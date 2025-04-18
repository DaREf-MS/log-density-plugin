const vscode = require('vscode');

class LogDensityCodeLensProvider {
    constructor() {
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
        this.data = [];
        this.log_density_classes = [
            "No logs",               // 0
            "Very low log density",  // 1
            "Low log density",       // 2
            "Medium log density",    // 3
            "High log density",      // 4
            "Very High log density"  // 5
        ];
    }

    setData(data) {
        this.data = data;
        this._onDidChangeCodeLenses.fire(); // Trigger UI update for CodeLens
    }

    provideCodeLenses(document, token) {
        const lenses = [];
        this.data
                .forEach(block => {
                    const position = new vscode.Position(block.blockLineStart - 1, 0);
                    const range = new vscode.Range(position, position);
                    const logDescription = this.log_density_classes[block.log_level] || "Unknown log density"; // Default to "Unknown" if out of bounds

                    // what will be written above code blocks
                    lenses.push(new vscode.CodeLens(range, {
                        command: 'extension.showLogDensityInfo',
                        title: `Predicted Log Density: ${logDescription} \u00A0 | \u00A0 Current Log Density: ${this.log_density_classes[block.currentLogLevel]}`,
                        tooltip: `Click for more details about the ${block.type} block starting at line ${block.blockLineStart} and ending at line ${block.blockLineEnd}`,
                        arguments: [block]
                    }));
                });
        return lenses;
    }
}

module.exports = LogDensityCodeLensProvider;
