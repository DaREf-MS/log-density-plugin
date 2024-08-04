const vscode = require('vscode');
const path = require('path');
const { analyzeFiles } = require('../services/analyzeProject');
const { readFile } = require('../utils/fileReader');

class AnalyzeFileProvider {
    constructor(analysisPreviewProvider) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.analyzeList = [];
        this.analysisPreviewProvider = analysisPreviewProvider;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    addFileToAnalyze(uri) {
        console.log(`Attempting to add: ${uri.fsPath}`);
        if (!this.analyzeList.some(existingUri => existingUri.fsPath === uri.fsPath)) {
            this.analyzeList.push(uri);
            this.refresh();
        } else {
            console.log(`File already in list: ${uri.fsPath}`);
        }
    }

    removeFileFromAnalyze(filePath) {
        let originalLength = this.analyzeList.length;
        this.analyzeList = this.analyzeList.filter(item => item.fsPath !== filePath);
        if (originalLength === this.analyzeList.length) {
            console.log('File not found in the list:', filePath);
        } else {
            console.log('File removed:', filePath);
            this.refresh();
        }
    }
    
    removeAllFiles() {
        this.analyzeList = [];
        this.refresh();
        console.log("Test remove all files clicked")
        console.log(`${this.analyzeList}`)
    }
    
    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!element) {
            return this.analyzeList.map(uri => {
                const treeItem = new vscode.TreeItem(path.basename(uri.fsPath), vscode.TreeItemCollapsibleState.None);
                treeItem.command = {
                    command: 'analyzeFileProvider.removeFile',
                    title: "Remove File",
                    arguments: [uri.fsPath]  
                };
                treeItem.contextValue = 'analyzableFile';
                treeItem.iconPath = vscode.ThemeIcon.File;
                return treeItem;
            });
        }
        return [];
    }

    async sendFilesForAnalysis() {
        const fileContents = await Promise.all(this.analyzeList.map(async uri => {
            try {
                const content = await readFile(uri.fsPath);
                // const document = await vscode.workspace.openTextDocument(uri);
                // const content = document.getText();  // Get text content directly
                // console.log(`Content of ${uri.fsPath}: ${content.slice(0, 200)}`);  // just 200 first chars to debug
                return {
                    url: uri.fsPath,
                    content: content
                };
            } catch (error) {
                console.error(`Error processing file ${uri.toString()}: ${error}`);
                throw error;  
            }
        }));
    
        try {
            const results = await analyzeFiles(fileContents);
            this.analysisPreviewProvider.updateFiles(results);
            vscode.window.showInformationMessage('Files successfully sent for analysis.');
            return results;
        } catch (error) {
            vscode.window.showErrorMessage('Failed to send files for analysis: ' + error.message);
        }
    }
}

function registerAnalyzeFileProvider(context, analysisPreviewProvider) {
    const analyzeFileProvider = new AnalyzeFileProvider(analysisPreviewProvider);
    context.subscriptions.push(vscode.window.createTreeView('analyzeFilesView', {
        treeDataProvider: analyzeFileProvider
    }));

    context.subscriptions.push(vscode.commands.registerCommand('analyzeFileProvider.removeFile', (filePath) => {
        if (!filePath) {
            vscode.window.showErrorMessage('File path not provided or incorrect.');
            return;
        }
        console.log("Removing file at path:", filePath.command.arguments[0]); // first element in the argument is the file
        analyzeFileProvider.removeFileFromAnalyze(filePath.command.arguments[0]);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('analyzeFileProvider.sendForAnalysis', async () => {
        const results = await analyzeFileProvider.sendFilesForAnalysis();
        vscode.window.showInformationMessage('Files sent for analysis. Check the console for details.');
        console.log(results);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('analyzeFileProvider.removeAllFiles', () => {
        analyzeFileProvider.removeAllFiles();
        vscode.window.showInformationMessage('All files have been removed from the analysis list.');
    }));
    
    return analyzeFileProvider;  
}

module.exports = {
    registerAnalyzeFileProvider
};
