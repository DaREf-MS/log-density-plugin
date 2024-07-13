const vscode = require('vscode');
const axios = require('axios');

async function trainModel(url) {
    console.log("Sending POST request to training service with URL:", url);

    try {
        const response = await axios.post('http://localhost:8080/create', { url });
        console.log("Response received:", response.data);
        vscode.window.showInformationMessage('Success: ' + response.data.message);
        
    } catch (error) {
        console.error("Failed to send request or process response:", error);
        vscode.window.showErrorMessage('Failed to create model: ' + (error.response ? error.response.data.detail : error.message));
    }
}

module.exports = {
    trainModel
};
