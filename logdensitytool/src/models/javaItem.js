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
        this.command = command
        this.extensionPath = vscode.extensions.getExtension('PFE019.logdensitytool').extensionPath;
    }

    async analyzeJavaItem(url) {
        if (this.pendingRequest) {
            return this.pendingRequest;
        } else {
            try {
                const content = await readFile(this.filepath);
                // console.log(`[URL]: ${url}, [CONTENT]: ${content.length > 0}`);

                this.pendingRequest = runModel(url, content).finally(() => {
                    this.pendingRequest = null;
                });

                const { density, predictedDensity } = await this.pendingRequest;
                console.log(`[Density]: ${density}, [Predicted Density]: ${predictedDensity}`);
                this.density = density;
                this.predictedDensity = predictedDensity;

                if (this.onDidChangeTreeData) {
                    this.onDidChangeTreeData(this);
                }

                return this.pendingRequest;
            } catch (error) {
                console.error(`Error analyzing file content: ${error}`);
            }
        }
    }

    update(density, predictedDensity, densityDifference) {
        let icon;
        this.density = density;
        this.predictedDensity = predictedDensity;

        if (densityDifference < 1) {
            icon = path.join(this.extensionPath, 'media', 'icons', 'checkmark.svg');
        } else if (1 <= densityDifference && densityDifference < 2) {
            icon = path.join(this.extensionPath, 'media', 'icons', 'chevron.svg');
        } else if (2 <= densityDifference && density <= 6) {
            icon = path.join(this.extensionPath, 'media', 'icons', 'chevron-double.svg');
        }

        this.iconPath = icon;
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

module.exports = JavaItem;