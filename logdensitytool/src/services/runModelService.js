const vscode = require('vscode');
const axios = require('axios');

async function runModel(url, fileContent) {
    console.log("Sending POST request to backend with file content");
    try {
        const response = await axios.post('http://localhost:8081/predict', {
            url: url,
            fileContent: fileContent
        });
        console.log("Response received:", response.data);
        return response.data;

    } catch (error) {
        console.error("Failed to send request or process response:", error);
        // vscode.window.showErrorMessage('Failed to analyze log density: ' + (error.response ? error.response.data.detail : error.message));
    }
}

module.exports = {
    runModel
};
