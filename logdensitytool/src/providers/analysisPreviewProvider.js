const vscode = require('vscode');
const path = require('path');
const GroupItem = require('../models/groupItem');
const JavaItem = require('../models/javaItem');

// https://code.visualstudio.com/api/ux-guidelines/sidebars
// https://code.visualstudio.com/api/extension-guides/tree-view
class AnalysisPreviewProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.itemsMap = new Map();
        this.results = [];
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        if (element) {
            if (element instanceof GroupItem) {
                return element.subItems;
            } else {
                return [];
            }
        } else {
            if (this.workspaceRoot) {
                return this.getJavaFiles(this.workspaceRoot);
            } else {
                vscode.window.showInformationMessage('No Java files in empty workspace');
                return [];
            }
        }
    }

    async getJavaFiles(dir, parent) {
        if (await this.pathExists(dir)) {
            const dirEntries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dir));
    
            const items = [];
            
            for (const [name, type] of dirEntries) {
                const filepath = path.join(dir, name);
    
                // Process Java file and directory entries into JavaItem and GroupItem instances
                if (type === vscode.FileType.File && name.endsWith('.java')) {
                    const javaItem = new JavaItem(filepath);
                    this.itemsMap.set(filepath, javaItem);
                    items.push(javaItem);
                } else if (type === vscode.FileType.Directory) {
                    const groupItem = new GroupItem(name, vscode.TreeItemCollapsibleState.Collapsed);
                    this.itemsMap.set(filepath, groupItem);
                    items.push(groupItem);
    
                    // Find more entries in the current directory (recursive call)
                    await this.getJavaFiles(filepath, groupItem);
                }
            }
    
            // Add JavaItem and GroupItem instances to the parent GroupItem, or return the root directory's content
            if (parent) {
                parent.subItems = items;
            } else {
                return items;
            }
        } else {
            return [];
        }
    }

    async pathExists(p) {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(p));
            return true;
        } catch (err) {
            return false;
        }
    }

    async updateFiles(results) {
        for (const result of results) {
            const { url, density, predictedDensity, difference } = result;
            const javaItem = this.itemsMap.get(url);
            console.log(javaItem);
            javaItem.update(density, predictedDensity, difference);
        }
    }
}

function registerAnalysisPreviewProvider(context, workspaceRoot) {
    const analysisPreviewProvider = new AnalysisPreviewProvider(workspaceRoot);
    vscode.window.registerTreeDataProvider('javaFilesView', analysisPreviewProvider);
    return analysisPreviewProvider;
}

module.exports = {
    registerAnalysisPreviewProvider
};