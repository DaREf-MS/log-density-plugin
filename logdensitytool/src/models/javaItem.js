const vscode = require('vscode');
const path = require('path');
const { readFile } = require('../utils/fileReader');
const { runModel } = require('../services/runModelService');

class JavaItem extends vscode.TreeItem {
    constructor(filepath, command = null) {
        super(path.basename(filepath), vscode.TreeItemCollapsibleState.None);
        this.filepath = filepath;
        this.contextValue = 'javaFile';
        this.iconPath = vscode.ThemeIcon.File;
        this.density = null;
        this.predictedDensity = null;
        this.pendingRequest = null;
        this.command = command;
        this.extensionPath = vscode.extensions.getExtension('PFE019.logdensitytool').extensionPath;
    }

    update(density, predictedDensity, densityDifference) {
        let icon;
        this.density = density;
        this.predictedDensity = predictedDensity;

        if (densityDifference < 1) {
            icon = path.join(this.extensionPath, 'media', 'icons', 'checkmark.svg');
        } else if (1 <= densityDifference && densityDifference < 2) {
            icon = path.join(this.extensionPath, 'media', 'icons', 'chevron.svg');
        } else if (2 <= densityDifference && densityDifference <= 6) {
            icon = path.join(this.extensionPath, 'media', 'icons', 'chevron-double.svg');
        }

        this.iconPath = icon;
        console.log(`Updated info for ${path.basename(this.filepath)}: ${this.iconPath}, ${density}, ${predictedDensity}`);
    }

    get tooltip() {
        return this.filepath;
    }

    get description() {
        if (this.density !== null && this.predictedDensity !== null) {
            return `${this.density} (Desired density: ${this.predictedDensity})`;
        } else {
            return '';
        }
    }
}

module.exports = JavaItem;