const vscode = require('vscode');
const axios = require('axios');
const fs = require('fs'); 
const { getGitRemoteUrl } = require('../utils/gitHelper');

// Function to send files for analysis
async function analyzeFiles(fileContents) {

    const gitUrl = await getGitRemoteUrl();
    

    try {
        fileContents.forEach(file => {
            console.log(`Sending file content for file: ${file.url}`);
            console.log(`Git URL: ${gitUrl}`);
            //console.log(`Content (first 200 chars): ${file.content.slice(0, 200)}`);
        });
        const response = await axios.post('http://localhost:8081/analyzeProject', {
            gitUrl: gitUrl,
            files: fileContents
        });
        return response.data;
    } catch (error) {
        console.error('Error sending files for analysis:', error);
        throw error;  
    }
}

module.exports = {
    analyzeFiles
};
