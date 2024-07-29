const vscode = require('vscode');
const path = require('path');
const JavaItem = require('./models/javaItem');
const TabGroupItem = require('./models/tabGroupItem');

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
            return tabGroupItems.length > 0 ? tabGroupItems : [new vscode.TreeItem('No opened tabs...')];
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

    // For each tab, verify that it is a Java file, then extract its filepath
    async processTabs(tabs) {
        const processedTabs = tabs
            .filter((tab) => tab.input && tab.input.uri && tab.input.uri.fsPath.endsWith('.java'))
            .map(async (tab) => {
                const filepath = tab.input.uri.fsPath;
                let javaItem = this.javaMap.get(filepath);

                if (!javaItem) {
                    javaItem = new JavaItem(filepath);
                    javaItem.onDidChangeTreeData = () => this.refresh();
                    this.javaMap.set(filepath, javaItem);
                    console.log(`Added ${filepath}`);
                }

                return javaItem;
            });

        return Promise.all(processedTabs);
    }

    // Once the URL for the ai model is set, analyze the densities of the currently opened tabs
    async setUrl(url) {
        this.url = url;
        this.predictOpenTabs();
    }

    // Analyze the densities of the opened tabs in the map of JavaItem instances
    async predictOpenTabs() {
        console.log(`Analyzing ${this.javaMap.size} files`)

        for (const [key, value] of this.javaMap) {
            console.log(`Analyzing ${key}`);
            await value.analyzeJavaItem(this.url);
        }

        this.refresh();
    }

    // Remove JavaItem from map if its tab was closed
    removeClosedDocument(filepath) {
        if (this.javaMap.has(filepath)) {
            this.javaMap.delete(filepath);
            console.log(`Removed ${filepath}`);
        }

        this.refresh();
    }

    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
}

module.exports = OpenTabsSidebarProvider;