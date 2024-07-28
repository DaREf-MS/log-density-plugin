const vscode = require('vscode');
const LogDensityCodeLensProvider = require('./logDensityCodeLensProvider');
const AnalysisPreviewProvider = require('./analysisPreviewProvider');
const OpenTabsSidebarProvider = require('./openTabsSidebarProvider');
const trainModelService = require('./trainModelService');
const runModelService = require('./runModelService');

let repositoryIndex = 0;
let remoteIndex = 0;

let trained = false;
let detectedRemoteGitUrl; // url detectée pour le projet ouvert
let chosenRemoteGitUrl; // URL du répertoire choisi
const codeLensProvider = new LogDensityCodeLensProvider();
let openTabsSidebarProvider;

function getGitRepo() {
    let gitExtension = vscode.extensions.getExtension('vscode.git');
    let git, repo;
    
    if (
        gitExtension && 
        gitExtension.isActive && 
        (git = gitExtension.exports.getAPI(1)) && git.repositories.length > repositoryIndex &&
        (repo = git.repositories[repositoryIndex])
    ) {
        return repo;
    }
}

async function getGitRemoteUrl() {

    function tryGetGitRemoteUrl() {
    
        let repo;
        if (
            (repo = getGitRepo()) &&
            repo.repository.remotes.length > remoteIndex
        ) {
            let detectedRemoteGitUrl = repo.repository.remotes[remoteIndex].fetchUrl;
            return detectedRemoteGitUrl;
        }
    }

    return new Promise((resolve, reject) => {
        // poll the activation
        pollGetUrl = setInterval(() => {
            let result = tryGetGitRemoteUrl()
            if (result) {
                clearInterval(pollGetUrl);
                resolve(result);
            }
        }, 50);
    })

}

/**
 * Predicate for analyzable file
 * @param {string} filepath - the absolute path of the file
 * @returns {boolean} whether the file is analyzable or not
 */
function shouldAnalyze(filepath) {
    if (chosenRemoteGitUrl !== detectedRemoteGitUrl) {
        return true;
    } else {
        let repo = getGitRepo();
    }
}

async function analyzeDocument(document) {

    if (document?.languageId !== "java") {
        return;
    }
    
    const { blocks } = await runModelService.runModel(chosenRemoteGitUrl, document.getText())
    codeLensProvider.setData(blocks);  // Update CodeLens with new data
}

async function analyzeActiveEditor() {
    const activeEditor = vscode.window.activeTextEditor
    if (trained && chosenRemoteGitUrl && activeEditor?.document) {
        await analyzeDocument(activeEditor.document);
    }
}



function activate(context) {
    context.subscriptions.push(vscode.languages.registerCodeLensProvider({ language: 'java' }, codeLensProvider));

    const workspaceRoot = vscode.workspace.rootPath;
    const analysisPreviewProvider = new AnalysisPreviewProvider(workspaceRoot);
    vscode.window.registerTreeDataProvider('javaFilesView', analysisPreviewProvider);

    context.subscriptions.push(vscode.commands.registerCommand('extension.showLogDensityInfo', block => {
        vscode.window.showInformationMessage(`Details for block starting at line ${block.blockLineStart}: ${JSON.stringify(block)}`);
    }));

    let gitExtension = vscode.extensions.getExtension('vscode.git');
    gitExtension.activate().then((api) => {
        console.log("omg look at my glorious api", api)
        api.model.onDidAddRemoteSourcePublisher((...omg) => {
            console.log("remote source pub: ", omg)
        })
        const openRepoDisposable = api.model.onDidOpenRepository((repository)=> {
            console.log("omg a repository was added, here it is", repository);
            
            let hello = repository.onDidRunOperation((operation) => {
                console.log("status was ran", operation)
                console.log("voici les remotes a nouveau: ", repository.remotes[0].fetchUrl);
                hello.dispose();
            });
            
            wdir_changed_files = repository.workingTreeGroup.resourceStates.map(rs => rs.ressources.modified);
            console.log('here is the current changes:', wdir_changed_files);
            repository.workingTreeGroup.onDidUpdateResourceStates((...args) => {

                console.log("omg ressources where changed", repository.workingTreeGroup.resourceStates.map(rs => rs.resources.modified));

                const extActivationDisposable = gitExtension.activate().then(api => {
                    const openRepoDisposable2 = api.model.onDidOpenRepository(repo2 => {
                        console.log("repo2 was opened:", repo2)
                        openRepoDisposable2.dispose()
                    })
                    // extActivationDisposable.dispose()
                });
                
            });
            // repository.untrackedGroup.on

            openRepoDisposable.dispose();
        })
        let repo = api.model.repositories[0];
        console.log('here is the repo: ', repo)
        repo?.onDidChangeState((...args) => console.log("omg there is a change, here are the args", args))
    })

    // // setTimeout(() => getGitRemoteUrl(), 10000);
    // getGitRepo()?.repository?.workingTreeGroup?.onDidUpdateResourceStates((...args) => {
    //     console.log("here are the changes args", args);
    // });

    getGitRemoteUrl().then((url) => {
        detectedRemoteGitUrl = url;
    })

    async function handleFileEvent(event) {
        if (
            trained && chosenRemoteGitUrl && 
            event.contentChanges && 
            event.contentChanges.length > 0 
        ) {
            await analyzeDocument(event.document)
        }
    }


    // Singleton to make sure there are not multiple initializations
    if (!openTabsSidebarProvider) {
        openTabsSidebarProvider = new OpenTabsSidebarProvider();
    }
    vscode.window.createTreeView('openTabsSidebarView', { treeDataProvider: openTabsSidebarProvider });
    vscode.commands.registerCommand('extension.refreshOpenTabs', () => openTabsSidebarProvider.refresh());

    // Refresh openTabsSidebarView when a file is opened
    function handleDidOpenTextDocument() {
        console.log('handleDidOpenTextDocument called');
        if (!openTabsSidebarProvider.isInitialized) {
            console.log('Sidebar initialized');
            openTabsSidebarProvider.isInitialized = true;
            return;
        }
        console.log('Executing refreshOpenTabs');
        vscode.commands.executeCommand('extension.refreshOpenTabs');
    }
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(handleDidOpenTextDocument)
    );

    // Refresh openTabsSidebarView when a file is closed, but prevent refreshing when initializing
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(() => {
            vscode.commands.executeCommand('extension.refreshOpenTabs');
        })
    );

    // Register the new command for predicting open tabs
    let disposablePredict = vscode.commands.registerCommand('extension.predictOpenTabs', async () => {
        vscode.window.showInformationMessage('Predict Open Tabs command executed');
        openTabsSidebarProvider.predictOpenTabs();
    });

    const analyzeEditedFileDisposable = vscode.workspace.onDidChangeTextDocument(handleFileEvent);
    const analyzeOpenedFileDisposable = vscode.workspace.onDidOpenTextDocument(handleFileEvent);
    const analyzeTextDisposable = vscode.window.onDidChangeActiveTextEditor(analyzeActiveEditor);


    // TODO - gerer ceci plutard
    const resetUrlDisposable = vscode.workspace.onDidChangeWorkspaceFolders(event => {
        detectedRemoteGitUrl = undefined;
        chosenRemoteGitUrl = undefined;
        trained = false;
        getGitRemoteUrl().then((url) => {
            detectedRemoteGitUrl = url;          
        })
    });

    // Register command to trigger model training
    let disposableTrain = vscode.commands.registerCommand('extension.sendGitHubUrl', async () => {
        const url = await vscode.window.showInputBox({ prompt: 'Enter GitHub URL to train model', value: detectedRemoteGitUrl});
        if (url) {
            await trainModelService.trainModel(url);
            chosenRemoteGitUrl = url;
            trained = true;
            openTabsSidebarProvider.setUrl(chosenRemoteGitUrl);
            await analyzeActiveEditor();
        } else {
            vscode.window.showErrorMessage('GitHub URL is required');
        }
    });


    context.subscriptions.push(
        // analyzeTextDisposable,
        analyzeEditedFileDisposable, 
        analyzeOpenedFileDisposable,
        resetUrlDisposable, 
        disposableTrain,
        disposablePredict
    );

    
}

function deactivate() {}


module.exports = {
    activate,
    deactivate
};
