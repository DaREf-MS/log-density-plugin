const vscode = require('vscode');

class TabGroupItem extends vscode.TreeItem {
    constructor(label, files) {
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        this.files = files;
    }

    get tooltip() {
        return this.label;
    }
}

module.exports = TabGroupItem;