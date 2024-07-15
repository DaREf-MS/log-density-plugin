const vscode = require('vscode');
const axios = require('axios');

async function trainModel(url) {
    console.log("Sending POST request to training service with URL:", url);

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Window,
        cancellable: false
    }, async (progress) => {
        try {
            // Count total java files in the workspace
            const javaFiles = await vscode.workspace.findFiles('**/*.java');
            const totalFiles = javaFiles.length;
            console.log(`Found ${totalFiles} Java files in the workspace.`);


            let totalSize = 0;

            // calculate total java files size 
            for (const file of javaFiles) {
                const fileStat = await vscode.workspace.fs.stat(file);
                totalSize += fileStat.size;
            }

            // Initialize the progress
            let currentProgress = 0;
            const maxProgress = 90; 

            // Update the progress
            const updateProgress = (increment) => {
                currentProgress += increment;
                if (currentProgress > maxProgress) {
                    currentProgress = maxProgress;
                }

                const displayProgress = Math.round(currentProgress);
                // Use increment to update the progress
                progress.report({ increment: 0, message: `${displayProgress}% Training...` });
            };

            
            progress.report({ increment: 0, message: 'Starting model training...' });



            // Simulate the progress
            const interval = setInterval(() => {
                const increment = (maxProgress * 1.0) / (totalFiles*0 + (totalSize/10000*0.35));
                updateProgress(increment);
                if (currentProgress >= maxProgress) {
                    clearInterval(interval);
                }
            }, 1000);

            // sending post request
            const response = await axios.post('http://localhost:8080/create', { url });

            console.log("Response received:", response.data);
            vscode.window.showInformationMessage('Success: ' + response.data.message);

        
            progress.report({ increment: 100 - currentProgress, message: 'Model training completed' });

            vscode.window.showInformationMessage('AI Model training completed successfully!');
        } catch (error) {
            console.error("Failed to send request or process response:", error);
            vscode.window.showErrorMessage('Failed to create model: ' + (error.response ? error.response.data.detail : error.message));
        }
    });

}

module.exports = {
    trainModel
};

