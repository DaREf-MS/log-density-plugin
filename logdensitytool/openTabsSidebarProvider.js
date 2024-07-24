const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;
const runModelService = require('./runModelService');

class OpenTabsSidebarProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.url = null;
        this.javaMap = new Map();
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
        // https://code.visualstudio.com/api/references/vscode-api#TabGroups
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
        const processedTabs = tabs
            .filter((tab) => tab.input && tab.input.uri && tab.input.uri.fsPath.endsWith('.java'))
            .map(async (tab) => {
                const filepath = tab.input.uri.fsPath;
                const content = await this.readFileContent(filepath);
                const javaItem = new JavaItem(filepath, vscode.TreeItemCollapsibleState.None);
                
                if (!this.javaMap.has(filepath)) {
                    this.javaMap.set(filepath, javaItem);
                    console.log(`Added ${filepath}`);
                }

                if (this.url) {
                    await this.analyzeContent(javaItem, content);
                }

                return javaItem;
            });
        console.log(`[Java Map]: ${this.javaMap.size}`)
            
        return Promise.all(processedTabs);
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

    async analyzeContent(javaItem, content) {
        try {
            // console.log(`[URL]: ${this.url}, [CONTENT]: ${content.length > 0}`);
            // const response = await runModelService.runModel(this.url, content);
            // const { density, predictedDensity } = response;
            // console.log(`[Density]: ${density}, [Predicted Density]: ${predictedDensity}`);
            // javaItem.density = density;
            // javaItem.predictedDensity = predictedDensity;
            this.refresh();
        } catch (error) {
            console.error(`Error analyzing file content: ${error}`);
        }
    }

    async setUrl(url) {
        // TODO set value of URL when it is chosen (extension line 124), but initially, it will always be undefined/null.
        // Suggested approach: display tabs without densities at first, then analyse once URL is available.
        // Analyze is only available when setURL is called, so figure out another method to run the analysis.
        this.url = url;
        
        for (const [key, value] of myMap) {
            const content = await this.readFileContent(key);
            await this.analyzeContent(javaItem, content);
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
        this.pendingRequest = null;
    }

    hasPendingRequest() {
        return this.pendingRequest;
    }

    setPendingRequest(pendingRequest) {
        this.pendingRequest = pendingRequest;
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