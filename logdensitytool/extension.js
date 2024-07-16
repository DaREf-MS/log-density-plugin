const vscode = require('vscode');
const LogDensityCodeLensProvider = require('./logDensityCodeLensProvider');
const AnalysisPreviewProvider = require('./analysisPreviewProvider');
const OpenTabsSidebarProvider = require('./openTabsSidebarProvider');
const trainModelService = require('./trainModelService');
const runModelService = require('./runModelService');

let repositoryIndex = 0;
let remoteIndex = 0;

let trained = false;
let remoteGitUrl;
const codeLensProvider = new LogDensityCodeLensProvider();

async function getGitRemoteUrl() {

    function tryGetGitRemoteUrl() {
    
        let gitExtension = vscode.extensions.getExtension('vscode.git');
        let git, repo;
        if (
            gitExtension && 
            gitExtension.isActive && 
            (git = gitExtension.exports.getAPI(1)) && git.repositories.length > repositoryIndex &&
            (repo = git.repositories[repositoryIndex]) && repo.repository.remotes.length > remoteIndex
        ) {
            let remoteGitUrl = repo.repository.remotes[remoteIndex].fetchUrl;
            return remoteGitUrl;
        }
    }

    return new Promise((resolve, reject) => {
        pollGetUrl = setInterval(() => {
            let result = tryGetGitRemoteUrl()
            if (result) {
                clearInterval(pollGetUrl);
                resolve(result)
            }
        }, 50);
    })

}


async function analyzeDocument(document) {

    if (document?.languageId !== "java") {
        return;
    }
    
    const { blocks } = await runModelService.runModel(remoteGitUrl, document.getText())
    codeLensProvider.setData(blocks);  // Update CodeLens with new data
}

async function analyzeActiveEditor() {
    const activeEditor = vscode.window.activeTextEditor
    if (trained && remoteGitUrl && activeEditor?.document) {
        await analyzeDocument(activeEditor.document);
    }
}

function activate(context) {
    context.subscriptions.push(vscode.languages.registerCodeLensProvider({ language: 'java' }, codeLensProvider));

    const workspaceRoot = vscode.workspace.rootPath;
    const analysisPreviewProvider = new AnalysisPreviewProvider(workspaceRoot);
    vscode.window.registerTreeDataProvider('javaFilesView', analysisPreviewProvider);

    context.subscriptions.push(vscode.commands.registerCommand('extension.showLogDensityInfo', block => {
        vscode.window.showInformationMessage(`Details for block starting at line ${block.blockLineStart}: ${JSON.stringify(block)}`);
    }));
    getGitRemoteUrl().then((url) => {
        remoteGitUrl = url;
    })

    async function handleFileEvent(event) {
        if (
            trained && remoteGitUrl && 
            event.contentChanges && 
            event.contentChanges.length > 0 
        ) {
            await analyzeDocument(event.document)
        }
    }

    const openTabsSidebarProvider = new OpenTabsSidebarProvider(remoteGitUrl);
    vscode.window.createTreeView('openTabsPreview', { treeDataProvider: openTabsSidebarProvider });
    vscode.commands.registerCommand('extension.refreshOpenTabs', () => openTabsSidebarProvider.refresh());

    const analyzeEditedFileDisposable = vscode.workspace.onDidChangeTextDocument(handleFileEvent);
    const analyzeOpenedFileDisposable = vscode.workspace.onDidOpenTextDocument(handleFileEvent);
    const analyzeTextDisposable = vscode.window.onDidChangeActiveTextEditor(analyzeActiveEditor);
    vscode.workspace.onDidOpenTextDocument(() => {
        vscode.commands.executeCommand('extension.refreshOpenTabs');
    });

    // Automatically refresh when the visible editors change
    vscode.window.onDidChangeVisibleTextEditors(() => {
        vscode.commands.executeCommand('extension.refreshOpenTabs');
    });


    // TODO - gerer ceci plutard
    const resetUrlDisposable = vscode.workspace.onDidChangeWorkspaceFolders(event => {
        remoteGitUrl = undefined;
        trained = false;
        getGitRemoteUrl().then((url) => {
            remoteGitUrl = url;          
        })
    });


    // context.subscriptions.push(vscode.commands.registerCommand('extension.showLogDensityInfo', block => {
    //     vscode.window.showInformationMessage(`Details for block starting at line ${block.blockLineStart}: ${JSON.stringify(block)}`);
    // }));

    // Register command to trigger model training
    let disposableTrain = vscode.commands.registerCommand('extension.sendGitHubUrl', async () => {
        const url = await vscode.window.showInputBox({ prompt: 'Enter GitHub URL to train model', value: remoteGitUrl});
        if (url) {
            await trainModelService.trainModel(url);
            trained = true;
            await analyzeActiveEditor();
        } else {
            vscode.window.showErrorMessage('GitHub URL is required');
        }
    });


    context.subscriptions.push(
        // analyzeTextDisposable,
        analyzeEditedFileDisposable, 
        analyzeOpenedFileDisposable,
        resetUrlDisposable, 
        disposableTrain
    );

    
}

function deactivate() {}


module.exports = {
    activate,
    deactivate
};
