const vscode = require('vscode');
const path = require('path');
const fileReader = require('../utils/fileReader');
const runModelService = require('../runModelService');

class JavaItem extends vscode.TreeItem {
    constructor(filepath, collapsibleState, density = null, predictedDensity = null) {
        super(path.basename(filepath), collapsibleState);
        this.filepath = filepath;
        this.filename = path.basename(filepath);
        this.contextValue = 'javaFile';
        this.iconPath = vscode.ThemeIcon.File;
        this.density = density;
        this.predictedDensity = predictedDensity;
        this.pendingRequest = null;
    }

    async analyzeJavaItem(url) {
        if (this.pendingRequest) {
            return this.pendingRequest;
        } else {
            try {
                const content = await fileReader.readFile(this.filepath);
                console.log(`[URL]: ${url}, [CONTENT]: ${content.length > 0}`);

                this.pendingRequest = runModelService.runModel(url, content).finally(() => {
                    this.pendingRequest = null;
                });
                
                const { density, predictedDensity } = await this.pendingRequest;
                console.log(`[Density]: ${density}, [Predicted Density]: ${predictedDensity}`);
                this.density = density;
                this.predictedDensity = predictedDensity;

                return this.pendingRequest;
            } catch (error) {
                console.error(`Error analyzing file content: ${error}`);
            }
        }
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