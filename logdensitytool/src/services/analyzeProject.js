const vscode = require('vscode');
const axios = require('axios');
const fs = require('fs'); 


// Function to send files for analysis
async function analyzeFiles(remoteUrl, fileContents) {

    //const gitUrl = await getGitRemoteUrl();
    

    try {
        fileContents.forEach(file => {
            //console.log(`Sending file content for file: ${file.url}`);
            //console.log(`Git URL: ${remoteUrl}`);
            //console.log(`Content (first 200 chars): ${file.content.slice(0, 200)}`);
        });
        const response = await axios.post('http://localhost:8081/analyzeProject', {
            gitUrl: remoteUrl,
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
