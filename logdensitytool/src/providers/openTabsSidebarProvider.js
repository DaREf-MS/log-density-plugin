const vscode = require('vscode');
const path = require('path');
const GroupItem = require('../models/groupItem');
const JavaItem = require('../models/javaItem');
const { analyzeFiles } = require('../services/analyzeProject');
const { readFile } = require('../utils/fileReader');
const { generateLogAdviceForDocument } = require('../services/logAdviceService');
const { runModel } = require('../services/runModelService');

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

    // if GroupItem, display its children: the JavaItem instances associated to it
    // else if JavaItem, it is a leaf in the tree, so it has no children and returns an empty array
    // else: initial setup of the Sidebar View
    async getChildren(element) {
        if (element instanceof GroupItem) {
            return element.subItems;
        } else if (element instanceof JavaItem) {
            return [];
        } else {
            const groupItems = await this.getGroupItems();
            return groupItems.length > 0 ? groupItems : [new vscode.TreeItem('No opened tabs...')];
        }
    }

    // if there is 1 tab group, return only the files
    // else if there is >1 tab groups, return files under collapsible tabGroups
    async getGroupItems() {
        // https://code.visualstudio.com/api/references/vscode-api#TabGroups
        const tabGroups = vscode.window.tabGroups.all;

        if (tabGroups.length === 1) {
            return this.processTabs(tabGroups[0].tabs);
        } else {
            const groupItems = tabGroups.map((tabGroup, index) => {
                const tabs = this.processTabs(tabGroup.tabs);
                return new GroupItem(`Tab Group ${index + 1}`, vscode.TreeItemCollapsibleState.Expanded, tabs);
            });

            return groupItems;
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
    setUrl(url) {
        this.url = url;
        console.log(this.url);
        this.predictOpenTabs();
    }

    getUrl() {
        return this.url;
    }

    async predictOpenTabs() {
        if (!this.url) {
            vscode.window.showInformationMessage('No URL has been provided yet, use the Command Palette (Ctrl + Shift + P).');
            return;
        }
    
        console.log(`Preparing to analyze ${this.javaMap.size} files with url ${this.url}`);
    
        // Get the contents of the files from their filepath
        const fileContents = await Promise.all([...this.javaMap.values()].map(async (javaItem) => {
            try {
                const content = await readFile(javaItem.filepath);
                return {
                    url: javaItem.filepath,
                    content: content
                };
            } catch (error) {
                console.error(`Error reading file ${javaItem.filepath}: ${error}`);
                return null;
            }
        }));
    
        // Analyze the content of the files, then update the densities of the JavaItem instances for displaying
        try {
            const results = await analyzeFiles(this.url, fileContents);

            for (const result of results) {
                const javaItem = this.javaMap.get(result.url);
                if (javaItem) {
                    javaItem.density = result.density;
                    javaItem.predictedDensity = result.predictedDensity;
                    if (javaItem.onDidChangeTreeData) {
                        javaItem.onDidChangeTreeData(javaItem);
                    }
                }
            }

            this.refresh();
            vscode.window.showInformationMessage('Files successfully sent for analysis.');

            return results;
        } catch (error) {
            vscode.window.showErrorMessage('Failed to send files for analysis: ' + error.message);
        }
    }

    async getBlocks() {
        try {
            const results = await this.predictOpenTabs();
            const filteredFiles = results.filter(f => f.density < f.predictedDensity);
    
            if (filteredFiles.length === 0) {
                vscode.window.showInformationMessage('No files require additional logs.');
                return [];
            }
    
            console.log(`Processing ${filteredFiles.length} files with insufficient log density.`);
    
            const allBlocks = await Promise.all(filteredFiles.map(async (element) => {
                try {
                    const fileContent = await readFile(element.url);
                    const result = await runModel(this.getUrl(), fileContent);
    
                    if (!result.blocks || !Array.isArray(result.blocks)) {
                        console.warn(`No blocks found for file: ${element.url}`);
                        return { filePath: element.url, fileContent, blocks: [] };
                    }

                    const filtered = result.blocks.filter(block => block.currentLogLevel < block.log_level);
    
                    return { filePath: element.url, fileContent, blocks: filtered };

                } catch (error) {
                    console.error(`Error processing file ${element.url}:`, error);
                    return { filePath: element.url, fileContent: '', blocks: [] };
                }
            }));
    
            return allBlocks.filter(b => b.blocks.length > 0);

        } catch (error) {
            console.error('Error in getBlocks:', error);
            vscode.window.showErrorMessage('An error occurred while retrieving blocks.');
            return [];
        }
    }

    async addLogs(allBlocks) {
        for (const fileInfo of allBlocks) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Adding missing logs to: ${path.basename(fileInfo.filePath)}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "Contacting LLM..." });
                
                try {
                    const document = await vscode.workspace.openTextDocument(fileInfo.filePath);
                    let totalLinesAdded = 0;
                
                    for (const block of fileInfo.blocks) {
                        block.blockLineStart += totalLinesAdded;
                        let actualBlockStartLine = block.blockLineStart;
                        let currentLine = block.blockLineStart;
                        
                        while (currentLine < document.lineCount) {
                            const lineText = document.lineAt(currentLine - 1).text;
                            
                            if (lineText.includes('{')) {
                                actualBlockStartLine = currentLine;
                                break;
                            }
                            
                            currentLine++;
                        }

                        const linesAdded = await generateLogAdviceForDocument(
                            document,
                            actualBlockStartLine
                        );
                        
                        totalLinesAdded += linesAdded;
                    }
                    vscode.window.showInformationMessage(`Finished adding logs for : ${path.basename(fileInfo.filePath)}`);
                } catch (error) {
                    vscode.window.showErrorMessage('An error occurred while attempting to add missing logs.');
                    console.error(error);
                }
            });
        }
    }

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

function registerOpenTabsSideBarProvider(context) {
    const openTabsSidebarProvider = new OpenTabsSidebarProvider();
    vscode.window.createTreeView('openTabsSidebarView', { treeDataProvider: openTabsSidebarProvider });
    vscode.commands.registerCommand('openTabsSidebarView.refreshOpenTabs', () => openTabsSidebarProvider.refresh());

    // Refresh openTabsSidebarView when a file is opened, but prevent refreshing when initializing
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(() => {
            if (!openTabsSidebarProvider.isInitialized) {
                console.log('Open tabs sidebar initialized');
                openTabsSidebarProvider.isInitialized = true;
                return;
            }
            vscode.commands.executeCommand('openTabsSidebarView.refreshOpenTabs');
        })
    );

    // Refresh openTabsSidebarView when a file is closed
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument((document) => {
            const filepath = document.uri.fsPath;
            openTabsSidebarProvider.removeClosedDocument(filepath);
            vscode.commands.executeCommand('openTabsSidebarView.refreshOpenTabs');
        })
    );

    // Register the new command for predicting open tabs
    context.subscriptions.push(
        vscode.commands.registerCommand('openTabsSidebarView.predictOpenTabs', async () => {
            if (openTabsSidebarProvider.getUrl()) {
                vscode.window.showInformationMessage('Analyzing files that are currently open.');
                openTabsSidebarProvider.predictOpenTabs();
            } else {
                vscode.window.showInformationMessage('No URL has been provided yet, use the Command Palette (Ctrl + Shift + P).');
            }
        }),
        vscode.commands.registerCommand('openTabsSidebarView.analyzeAndAddMissingLogs', async () => {
            if (openTabsSidebarProvider.getUrl()) {
                const blocks = await openTabsSidebarProvider.getBlocks();
                if (blocks.length > 0) {
                    await openTabsSidebarProvider.addLogs(blocks);
                } else{
                    vscode.window.showInformationMessage('No files with insufficient log statements found.');
                }
            } else {
                vscode.window.showInformationMessage('No URL has been provided yet, use the Command Palette (Ctrl + Shift + P).');
            }
        })
    );

    return openTabsSidebarProvider;
}

module.exports = {
    registerOpenTabsSideBarProvider
};