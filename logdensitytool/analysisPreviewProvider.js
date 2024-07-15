const vscode = require('vscode');
const path = require('path');

// https://code.visualstudio.com/api/ux-guidelines/sidebars
// https://code.visualstudio.com/api/extension-guides/tree-view
class AnalysisPreviewProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        if (element) {
            return this.getJavaFiles(element.resourceUri.fsPath);
        } else {
            if (this.workspaceRoot) {
                return this.getJavaFiles(this.workspaceRoot);
            } else {
                vscode.window.showInformationMessage('No Java files in empty workspace');
                return [];
            }
        }
    }

    async getJavaFiles(dir) {
        if (await this.pathExists(dir)) {
            // Read the content of the root directory of the Java project
            const dirEntries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dir));

            // Find Java files and directories
            const javaFiles = dirEntries.filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.java'));
            const directories = dirEntries.filter(([name, type]) => type === vscode.FileType.Directory);

            // Create a non collapsible JavaItem with the log densities
            const fileItems = await Promise.all(javaFiles.map(async ([name]) => {
                const filepath = path.join(dir, name);
                const density = await this.fetchDensities(filepath);
                return new JavaItem(vscode.Uri.file(filepath), vscode.TreeItemCollapsibleState.None, density);
            }));

            // Create a collapsible JavaItem
            const directoryItems = directories.map(([name]) => new JavaItem(vscode.Uri.file(path.join(dir, name)), vscode.TreeItemCollapsibleState.Collapsed));

            return [...directoryItems, ...fileItems];
        } else {
            return [];
        }
    }

    // Get the densities by using the service
    async fetchDensities(filepath) {
        const currentDensity = 0;
        const desiredDensity = 3;
        return `Current ${currentDensity} vs Desired ${desiredDensity}`;
    }

    async pathExists(p) {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(p));
            return true;
        } catch (err) {
            return false;
        }
    }
}

class JavaItem extends vscode.TreeItem {
    constructor(resourceUri, collapsibleState, additionalInfo = '') {
        super(resourceUri, collapsibleState);
        this.resourceUri = resourceUri;
        this.contextValue = 'javaFile';
        this.iconPath = collapsibleState ? null : vscode.ThemeIcon.File;
        this.additionalInfo = additionalInfo;
    }

    get tooltip() {
        return `Some relevant message should appear in the tooltip...`;
    }

    get description() {
        return this.additionalInfo;
    }
}

module.exports = AnalysisPreviewProvider;