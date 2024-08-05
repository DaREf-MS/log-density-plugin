const vscode = require('vscode');
const path = require('path');

class FolderItem extends vscode.TreeItem {
    constructor(uri, command) {
        super(path.basename(uri.fsPath), vscode.TreeItemCollapsibleState.Collapsed, command);
        this.uri = uri;
        this.contextValue = 'folder';
        this.iconPath = vscode.ThemeIcon.Folder;
        this.command = command;
    }
}

module.exports = FolderItem;