const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;
const runModelService = require('./runModelService');

class OpenTabsSidebarProvider {
    constructor(remoteGitUrl) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.url = remoteGitUrl
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        if (element instanceof TabGroupItem) {
            return element.files;
        } else {
            const tabGroups = await this.getTabGroups();
            return Promise.resolve(tabGroups);
        }
    }

    async getTabGroups() {
        const tabGroups = vscode.window.tabGroups.all.map((tabGroup, index) => {
            const files = tabGroup.tabs
                .filter((tab) => tab.input && tab.input.uri && tab.input.uri.fsPath.endsWith('.java'))
                .map((tab) => {
                    const filepath = tab.input.uri.fsPath;
                    const filename = path.basename(filepath);
                    
                    // const content = await this.readFileContent(filepath);
                    // const response = await runModelService.runModel(this.url, content);
                    // const { density, predictedDensity } = response;
                    // console.log(`[Density]: ${density}, [Predicted Density]: ${predictedDensity}`);

                    return new JavaItem(filename, filepath, vscode.TreeItemCollapsibleState.None);
                });

            return new TabGroupItem(`Tab Group ${index + 1}`, files)
        })

        return tabGroups;
    }

    async readFileContent(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return content;
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            return '';
        }
    }

    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
}

class TabGroupItem extends vscode.TreeItem {
    constructor(label, files) {
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        this.files = files;
    }

    get tooltip() {
        return this.label;
    }
}

class JavaItem extends vscode.TreeItem {
    constructor(filename, filepath, collapsibleState, density = null, predictedDensity = null) {
        super(filename, collapsibleState);
        this.filename = filename;
        this.filepath = filepath;
        this.contextValue = 'javaFile';
        this.density = density;
        this.predictedDensity = predictedDensity;
    }

    // Text to display when hovering over file in Sidebar View
    get tooltip() {
        return this.filepath;
    }

    // Secondary text to display alongside the filename in Sidebar View
    get description() {
        if (this.density !== null && this.predictedDensity !== null) {
            return `${this.density} (Desired density: ${this.predictedDensity})`;
        } else {
            return '';
        }
    }
}

module.exports = OpenTabsSidebarProvider;