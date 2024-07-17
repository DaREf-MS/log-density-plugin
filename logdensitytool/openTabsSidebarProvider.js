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

    // if TabGroupItem, display its children: the JavaItem instances associated to it
    // else if JavaItem, it is a leaf in the tree, so it has no children and returns an empty array
    // else: initial setup of the Sidebar View
    async getChildren(element) {
        if (element instanceof TabGroupItem) {
            return element.files;
        } else if (element instanceof JavaItem) {
            return [];
        } else {
            const tabGroupItems = await this.getTabGroups();
            return tabGroupItems.length > 0 ? tabGroupItems : [new vscode.TreeItem('No opened tabs...')]
        }
    }

    // if there is 1 tab group, return only the files
    // else if there is >1 tab groups, return files under collapsible tabGroups
    async getTabGroups() {
        const tabGroups = vscode.window.tabGroups.all;

        if (tabGroups.length === 1) {
            return this.processTabs(tabGroups[0].tabs);
        } else {
            const tabGroupItems = tabGroups.map((tabGroup, index) => {
                const tabs = this.processTabs(tabGroup.tabs);
                return new TabGroupItem(`Tab Group ${index + 1}`, tabs);
            });

            return tabGroupItems;
        }
    }

    // For each tab, verify that it is a Java file, then extract its filepath and analyze its densities based on its content
    async processTabs(tabs) {
        return tabs
            .filter((tab) => tab.input && tab.input.uri && tab.input.uri.fsPath.endsWith('.java'))
            .map((tab) => {
                const filepath = tab.input.uri.fsPath;
                    
                // const content = await this.readFileContent(filepath);
                // const response = await runModelService.runModel(this.url, content);
                // const { density, predictedDensity } = response;
                // console.log(`[Density]: ${density}, [Predicted Density]: ${predictedDensity}`);

                return new JavaItem(filepath, vscode.TreeItemCollapsibleState.None);
            });
    }

    async readFileContent(filepath) {
        try {
            const content = await fs.readFile(filepath, 'utf-8');
            return content;
        } catch (error) {
            console.error(`Error reading file ${filepath}:`, error);
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
    constructor(filepath, collapsibleState, density = null, predictedDensity = null) {
        super(path.basename(filepath), collapsibleState);
        this.filepath = filepath;
        this.filename = path.basename(filepath);
        this.contextValue = 'javaFile';
        this.iconPath = vscode.ThemeIcon.File;
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