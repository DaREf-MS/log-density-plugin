const vscode = require('vscode');
const path = require('path');
const FolderItem = require('../models/folderItem');

class JavaFileProvider {
    constructor(analyzeFileProvider) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.analyzeFileProvider = analyzeFileProvider;
    }

    sendFileToAnalyze(fileUri) {
        this.analyzeFileProvider.addFileToAnalyze(fileUri);
        this.refresh(); 
    }

    getAnalyzeList() {
        return this.analyzeList.map(uri => new JavaFile(uri));
    }

    refresh() {
        console.log('Refreshing view...');
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        if (!element) {
            return this.getRootFolders();
        } else if (element instanceof FolderItem) {
            return this.getJavaFilesAndFolders(element.uri);
        }
        return [];
    }

    async getRootFolders() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return [];
        let folders = [];
        for (const folder of workspaceFolders) {
            let subfolders = await this.getJavaFilesAndFolders(folder.uri);
            if (subfolders.length > 0) {
                folders.push(new FolderItem(folder.uri, this.createFolderCommand(folder.uri)));
            }
        }
        return folders;
    }

    async getJavaFilesAndFolders(uri) {
        let items = [];
        const entries = await vscode.workspace.fs.readDirectory(uri);
        for (const [name, type] of entries) {
            const childUri = vscode.Uri.file(path.join(uri.fsPath, name));
            if (type === vscode.FileType.Directory) {
                const subItems = await this.getJavaFilesAndFolders(childUri);
                if (subItems.length > 0) {
                    items.push(new FolderItem(childUri, this.createFolderCommand(childUri)));
                }
            } else if (name.endsWith('.java')) {
                items.push(new JavaFile(childUri));
            }
        }
        return items;
    }

    // distinction with the other method, is that this returns onyl the java files contained in the selected directory
    async collectJavaFiles(uri) {
        let javaFiles = [];
        const entries = await vscode.workspace.fs.readDirectory(uri);
        for (const [name, type] of entries) {
            const childUri = vscode.Uri.file(path.join(uri.fsPath, name));
            if (type === vscode.FileType.Directory) {
                const nestedFiles = await this.collectJavaFiles(childUri);
                javaFiles = javaFiles.concat(nestedFiles);
            } else if (name.endsWith('.java')) {
                javaFiles.push(childUri);
            }
        }
        return javaFiles;
    }
    
    createFolderCommand(uri) {
        return {
            command: 'javaFileProvider.addToSendList',
            title: "Add Folder to Send List",
            arguments: [uri]
        };
    }
}

class JavaFile extends vscode.TreeItem {
    constructor(uri) {
        super(path.basename(uri.fsPath), vscode.TreeItemCollapsibleState.None);
        this.uri = uri;
        this.contextValue = 'javaFile';
        this.iconPath = vscode.ThemeIcon.File;
        this.tooltip = uri.fsPath;
        this.command = {
            command: 'javaFileProvider.addToSendList',
            title: "Add File to Send List",
            arguments: [uri]
        };
    }
}

function registerJavaFileProvider(context, analyzeFileProvider) {
    const javaFileProvider = new JavaFileProvider(analyzeFileProvider);

    context.subscriptions.push(vscode.window.createTreeView('javaFiles', {
        treeDataProvider: javaFileProvider
    }));

    context.subscriptions.push(vscode.commands.registerCommand('javaFileProvider.addToSendList', async (item) => {
        if (item instanceof FolderItem) {
            console.log(`Adding all Java files from folder: ${item.uri.fsPath}`);
            const javaFiles = await javaFileProvider.collectJavaFiles(item.uri);
            javaFiles.forEach(fileUri => {
                javaFileProvider.analyzeFileProvider.addFileToAnalyze(fileUri);
            });
        } else if (item instanceof JavaFile) {
            console.log(`Adding file: ${item.uri.fsPath}`);
            javaFileProvider.analyzeFileProvider.addFileToAnalyze(item.uri);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('javaFiles.refreshEntry', () => javaFileProvider.refresh()));

    return javaFileProvider; 
}

module.exports = {
    registerJavaFileProvider
};