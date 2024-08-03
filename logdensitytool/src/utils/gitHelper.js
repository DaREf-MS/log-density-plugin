const vscode = require('vscode');

let repositoryIndex = 0;
let remoteIndex = 0;

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
    return null;
}

async function getGitRemoteUrl() {
    function tryGetGitRemoteUrl() {
        let repo;
        if (
            (repo = getGitRepo()) &&
            repo.repository.remotes.length > remoteIndex
        ) {
            return repo.repository.remotes[remoteIndex].fetchUrl;
        }
    }

    return new Promise((resolve, reject) => {
        let pollGetUrl = setInterval(() => {
            let result = tryGetGitRemoteUrl();
            if (result) {
                clearInterval(pollGetUrl);
                resolve(result);
            }
        }, 50);
    });
}

// Function to get the status of a file
async function getFileStatus(fileUri) {
    const repo = getGitRepo();
    if (!repo) return null; // No repository found

    await repo.status(); // Refresh status
    const status = repo.state.workingTreeChanges.find(change => change.uri.fsPath === fileUri.fsPath);

    if (!status) return 'unchanged'; // No changes found

    switch (status.status) {
        case vscode.GitStatus.INDEX_ADDED:
        case vscode.GitStatus.UNTRACKED:
            return 'new';
        case vscode.GitStatus.INDEX_MODIFIED:
        case vscode.GitStatus.MODIFIED:
            return 'modified';
        default:
            return 'unchanged';
    }
}

module.exports = {
    getGitRepo,
    getGitRemoteUrl,
    getFileStatus
};
