const vscode = require('vscode');
const axios = require('axios');

function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.sendGitHubUrl', async () => {
        console.log("Command activated");  // Debug log
        const url = await vscode.window.showInputBox({
            placeHolder: 'Enter the GitHub repository URL'
        });

        console.log("URL entered:", url);  // Debug log
        if (!url) {
            vscode.window.showErrorMessage('No URL entered');
            return;
        }

		console.log("Sending POST request to service with URL:", url);

         axios.post('http://localhost:8080/create', { url })
            .then(response => {
                console.log("Response received:", response.data);  
                vscode.window.showInformationMessage('Success: ' + response.data.message);
            })
            .catch(error => {
                console.error("Failed to send request or process response:", error);  
                vscode.window.showErrorMessage('Failed to create model: ' + (error.response ? error.response.data.detail : error.message));
            });
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
