const vscode = require('vscode');
const { getGitRemoteUrl } = require('./utils/gitHelper'); // Import the required function
const LogDensityCodeLensProvider = require('./providers/logDensityCodeLensProvider');
const { registerAnalysisPreviewProvider } = require('./providers/analysisPreviewProvider');
const { registerOpenTabsSideBarProvider, OpenTabsSidebarProvider } = require('./providers/openTabsSidebarProvider');
const trainModelService = require('./services/trainModelService');
const runModelService = require('./services/runModelService');
const { registerJavaFileProvider, JavaFileProvider } = require('./providers/javaFileProvider');  
const { registerAnalyzeFileProvider} = require('./providers/analyzeFileProvider')

let trained = false;
let remoteUrl; // Store the remote URL if needed
const codeLensProvider = new LogDensityCodeLensProvider();

async function analyzeDocument(document) {
    if (document?.languageId !== "java") {
        return;
    }
    const { blocks } = await runModelService.runModel(remoteUrl, document.getText());
    codeLensProvider.setData(blocks);  // Update CodeLens with new data
}

function activate(context) {
    const workspaceRoot = vscode.workspace.rootPath;

    // Register Codelens
    context.subscriptions.push(vscode.languages.registerCodeLensProvider({ language: 'java' }, codeLensProvider));

    context.subscriptions.push(vscode.commands.registerCommand('extension.showLogDensityInfo', block => {
        vscode.window.showInformationMessage(`Details for block starting at line ${block.blockLineStart}: ${JSON.stringify(block)}`);
    }));

    // Register AnalysisPreviewProvider and OpenTabsSidebarProvider
    const analysisPreviewProvider = registerAnalysisPreviewProvider(context, workspaceRoot);
    const openTabsSidebarProvider = registerOpenTabsSideBarProvider(context);

    // Initialize and use the Git remote URL
    getGitRemoteUrl().then((url) => {
        remoteUrl = url;
        console.log("Git detected url.")
    });

    let disposableTrain = vscode.commands.registerCommand('extension.sendGitHubUrl', async () => {
        const url = await vscode.window.showInputBox({ prompt: 'Enter GitHub URL to train model', value: remoteUrl });
        if (url) {
            await trainModelService.trainModel(url);
            remoteUrl = url;
            openTabsSidebarProvider.setUrl(remoteUrl);
            trained = true;
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                await analyzeDocument(activeEditor.document);
            }
        } else {
            vscode.window.showErrorMessage('GitHub URL is required');
        }
    });

    // File event handlers, sends file content to backend on change
    const analyzeEditedFileDisposable = vscode.workspace.onDidChangeTextDocument(event => {
        if (trained && remoteUrl && event.document.languageId === "java") {
            analyzeDocument(event.document);
        }
    });

    // File event handlers, sends file content to backend on file open
    const analyzeOpenedFileDisposable = vscode.workspace.onDidOpenTextDocument(document => {
        if (trained && remoteUrl && document.languageId === "java") {
            analyzeDocument(document);
        }
    });

    // Register AnalyzeFileProvider and javaFileProvider
    const analyzeFileProvider = registerAnalyzeFileProvider(context, analysisPreviewProvider);
    const javaFileProvider = registerJavaFileProvider(context, analyzeFileProvider);

    const analyzeNewJavaFilesCommand = vscode.commands.registerCommand('extension.analyzeNewJavaFiles', async () => {
        const allFiles = await getAllJavaFiles();
        const results = await analyzeProjectFiles(allFiles);
        if (results) {
            console.log(results);  
            vscode.window.showInformationMessage('New Java files analysis complete. Check the console for details.');
        }
    });

    context.subscriptions.push(
        disposableTrain,
        analyzeEditedFileDisposable,
        analyzeOpenedFileDisposable
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
