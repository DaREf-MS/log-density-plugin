
const vscode = require('vscode');
const LogDensityCodeLensProvider = require('./logDensityCodeLensProvider');
const trainModelService = require('./trainModelService');
const runModelService = require('./runModelService');

function activate(context) {
    const codeLensProvider = new LogDensityCodeLensProvider();
    context.subscriptions.push(vscode.languages.registerCodeLensProvider({ language: 'java' }, codeLensProvider));

    context.subscriptions.push(vscode.commands.registerCommand('extension.showLogDensityInfo', block => {
        vscode.window.showInformationMessage(`Details for block starting at line ${block.blockLineStart}: ${JSON.stringify(block)}`);
    }));

    // Register command to trigger model training
    let disposableTrain = vscode.commands.registerCommand('extension.sendGitHubUrl', async () => {
        const url = await vscode.window.showInputBox({ prompt: 'Enter GitHub URL to train model' });
        if (url) {
            trainModelService.trainModel(url);
        } else {
            vscode.window.showErrorMessage('GitHub URL is required');
        }
    });

    // Register command to analyze log density and update CodeLens
    let disposableAnalyze = vscode.commands.registerCommand('extension.analyzeLogDensity', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const fileContent = editor.document.getText();
            const url = await vscode.window.showInputBox({ prompt: 'Enter corresponding GitHub repository URL for analysis' });
            if (url && fileContent) {
                const blocks = await runModelService.runModel(url, fileContent);
                if (blocks) {
                    codeLensProvider.setData(blocks);  // Update CodeLens with new data
                } else {
                    vscode.window.showErrorMessage('No data received for analysis');
                }
            } else {
                vscode.window.showErrorMessage('Both URL and file content are required');
            }
        } else {
            vscode.window.showErrorMessage('No active editor found');
        }
    });

    context.subscriptions.push(disposableTrain, disposableAnalyze);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
