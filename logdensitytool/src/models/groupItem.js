const vscode = require('vscode');

class GroupItem extends vscode.TreeItem {
    constructor(label, collapsibleState, subItems = []) {
        super(label, collapsibleState);
        this.subItems = subItems;
        this.contextValue = 'groupItem';
    }

    get tooltip() {
        return this.label;
    }
}

module.exports = GroupItem;