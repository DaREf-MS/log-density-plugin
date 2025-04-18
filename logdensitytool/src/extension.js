const StandardResponse = require("./services/response/standardResponseService");
const vscode = require('vscode');
const { getGitRemoteUrl } = require('./utils/gitHelper'); // Import the required function
const LogDensityCodeLensProvider = require('./providers/logDensityCodeLensProvider');
const { registerOpenTabsSideBarProvider } = require('./providers/openTabsSidebarProvider');
const { trainModel } = require('./services/trainModelService');
const { runModel } = require('./services/runModelService');
const { registerJavaFileProvider } = require('./providers/javaFileProvider');
const { registerAnalyzeFileProvider } = require('./providers/analyzeFileProvider');
const { createApiModel, createResponse } = require('./services/factoryService');
const { configuration } = require('./model_config');
const { readFile } = require("./utils/fileReader");
const { buildPrompt, getSurroundingMethodText, extractAttributesFromPrompt } = require("./utils/modelTools")
const path = require('path');

const { api_id, url, port, prompt_file, improve_log_prompt_file, default_model, default_token, llm_temperature, llm_max_token, response_id, attributes_to_comment, comment_string, injection_variable } = configuration;

const {initializeAdviceService, generateLogAdviceForDocument} = require('./services/logAdviceService');

let trained = false;
let remoteUrl; // Store the remote URL if needed
let apiModelService;
let reponseService;
const codeLensProvider = new LogDensityCodeLensProvider();


function initialize() {
    apiModelService = createApiModel(api_id, url, port, default_model, default_token);
    reponseService = createResponse(response_id);
    initializeAdviceService(apiModelService, reponseService,readFile, buildPrompt, getSurroundingMethodText, extractAttributesFromPrompt, StandardResponse, createResponse, configuration);
}

async function analyzeDocument(document) {
    if (document && document.languageId !== "java") {
        return;
    }
    const { blocks } = await runModel(remoteUrl, document.getText());
    codeLensProvider.setData(blocks);  // Update CodeLens with new data
}

async function generateLogAdvice() {
    await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Generating Log...`,
            cancellable: false
        }, async () => {
            
            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showInformationMessage("No active editor found.");
                return;
            }

            const document = editor.document;
            const selection = editor.selection;
            const cursorLine = selection.active.line;

            try {
                await generateLogAdviceForDocument(document, cursorLine);

                const userResponse = await vscode.window.showQuickPick(["Yes", "No"], {
                placeHolder: "Log advice generated. Do you want to apply the changes?",
                canPickMany: false
                });
        
                if (userResponse === "Yes") {
                vscode.window.showInformationMessage("Log advice applied.");
                } else {
                vscode.commands.executeCommand('undo');
                vscode.window.showInformationMessage("Log advice discarded.");
                }
            } catch (error) {
                console.error(error);
                vscode.window.showErrorMessage("Failed to get code suggestion: " + error.message);
            }
    })
}

function improveLogsCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage("No active editor found.");
        return;
    }

    const document = editor.document;
    const selection = editor.selection;
    let selectedText = "";
    let contextText = "";

    if (!selection.isEmpty) {
        selectedText = document.getText(selection);
    } else {
        vscode.window.showInformationMessage("Please select a code block containing logs to analyse.");
        return;
    }
    
    contextText = editor.document.getText();
    let prompt = (
        "Context: For every log in this code block (System.out.print() and similar variations) improve it by checking for errors such as: -Typos in the log message -Missing context in the log -Using the wrong log type (ex: using System.out.println() when System.err.println() would be more suited because it's logging an error) \n"
        + selectedText
    );

    const javaLogRegex = /(System\.(out|err)\.println|Logger\.(debug|info|warn|error|fatal|trace|log)|log(ger)?\.(debug|info|warn|error|fatal|trace|log)|LOG(ger)?\.(debug|info|warn|error|fatal|trace|log))/;
    if (!javaLogRegex.test(selectedText)) {
        vscode.window.showInformationMessage("No logs found in the selected code block.");
        return;
    }

    const logLines = selectedText.split('\n');
    const logLinesSelected = [];

    logLines.forEach((line, i) => {
        if (javaLogRegex.test(line)) {
            const fullLineText = i === 0 ? editor.document.lineAt(selection.active.line).text : line;
            logLinesSelected.push({
                line: fullLineText.trim(),
                lineNotTrim: fullLineText,
            });
        }
    });
    
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Improving Logs",
        cancellable: false
    }, async (progress) => {
        progress.report({ message: "Contacting LLM..." });

        try {
            let edit = new vscode.WorkspaceEdit();
            for (let i = 0; i < logLinesSelected.length; i++) {

                const selectedLog = logLinesSelected[i];

                // Call your LLM service
                const model = await apiModelService.getModel();

                // Get the current directory of the script
                const projectBasePath = path.resolve(__dirname, "..", "..");
                let system_prompt = await readFile(path.join(projectBasePath, "prompt", improve_log_prompt_file)) // Extract prompt from txt file

                let attributes = []
                // Find and extract attributes from prompt {{json}}
                if (system_prompt.includes("{{") && system_prompt.includes("}}")) {
                    attributes = extractAttributesFromPrompt(system_prompt, attributes_to_comment) // Extract attributes from prompt {{json}}
                    system_prompt = system_prompt.replace("{{", "{");
                    system_prompt = system_prompt.replace("}}", "}");
                }
                
                // Build Prompt
                const builtPrompt = buildPrompt([contextText, "", selectedLog["line"]], system_prompt, injection_variable)
                if (builtPrompt != null) {
                    prompt = builtPrompt
                }

                let linesToInsert = [];
                while (linesToInsert.length === 0) {
                    console.log("Improving Logs...");
                    const modelResponse = await apiModelService.generate(model, null, prompt, llm_temperature, llm_max_token);
                    if (attributes.length > 0) {
                        linesToInsert = reponseService.extractLines(modelResponse, attributes, attributes_to_comment, comment_string);
                    } else {
                        const standardResponse = createResponse(StandardResponse.responseId)
                        linesToInsert = standardResponse.extractLines(modelResponse, attributes, attributes_to_comment, comment_string);
                    }
                    
                }

                // Detect indentation style based on the current line
                const currentLineText = selectedLog["lineNotTrim"];
                const lineIndentMatch = currentLineText.match(/^\s*/);
                const detectedIndent = lineIndentMatch ? lineIndentMatch[0] : '';

                for (let i = 0; i < linesToInsert.length; i++) {
                    let lineText = linesToInsert[i]

                    // Preserve the detected indentation for all lines after the first
                    const formattedLine = detectedIndent + lineText;

                    const commentRegex = /\/\/\s/;
                    const noChangesRegex = /No necessary changes needed/;
                    const currentLogRegex = new RegExp(selectedLog["line"].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

                    if ((commentRegex.test(formattedLine) && noChangesRegex.test(formattedLine)) ||
                    (currentLogRegex.test(formattedLine))) {
                        const editEntries = edit.entries();
                        if (editEntries.length > 0) {
                            const newEdit = new vscode.WorkspaceEdit();
                            for (let i = 0; i < editEntries.length - 1; i++) {
                                const [uri, edits] = editEntries[i];
                                for (const singleEdit of edits) {
                                    newEdit.replace(uri, singleEdit.range, singleEdit.newText);
                                }
                            }
                            edit = newEdit;
                        }
                        break;
                    }

                    for (let j = 0; j < document.lineCount; j++) {
                        const line = document.lineAt(j);
                        if (line.text.includes(selectedLog["line"])) {
                            if (commentRegex.test(formattedLine)) {
                                edit.insert(document.uri, line.range.start, formattedLine);
                            }
                            else if (javaLogRegex.test(formattedLine)) {
                                edit.replace(document.uri, line.range, '\n' + formattedLine);
                                break;
                            }
                        }
                    }
                }
            }

            if (edit.entries().length === 0) {
                vscode.window.showInformationMessage("No changes needed in the selected code block.");
                return;
            }
                // Apply the edit
                await vscode.workspace.applyEdit(edit);

                const userResponse = await vscode.window.showQuickPick(
                    ["Yes", "No"],
                    {
                        placeHolder: "Improved logs generated. Do you want to apply the changes?",
                        canPickMany: false
                    }
                );

                if (userResponse === "Yes") {
                    // Apply the changes permanently
                    vscode.window.showInformationMessage("Improved logs applied.");
                } else {
                    // Revert the changes
                    vscode.commands.executeCommand('undo');
                    vscode.window.showInformationMessage("Improved logs discarded.");
                }
            
        } catch (error) {
            console.error(error);
            vscode.window.showErrorMessage("Failed to get code suggestion. " + error.message);
        }
    });
}

function activate(context) {
    initialize();
    // eslint-disable-next-line no-unused-vars
    const workspaceRoot = vscode.workspace.rootPath;
    
    // Register Codelens
    context.subscriptions.push(vscode.languages.registerCodeLensProvider({ language: 'java' }, codeLensProvider));

    context.subscriptions.push(vscode.commands.registerCommand('extension.showLogDensityInfo', block => {
        vscode.window.showInformationMessage(`Details for block starting at line ${block.blockLineStart}: ${JSON.stringify(block)}`);
    }));

    // Register AnalyzeFileProvider and JavaFileProvider and OpenTabsSidebarProvider
    const openTabsSidebarProvider = registerOpenTabsSideBarProvider(context);
    const analyzeFileProvider = registerAnalyzeFileProvider(context);
    const javaFileProvider = registerJavaFileProvider(context, analyzeFileProvider);
    analyzeFileProvider.setJavaFileProvider(javaFileProvider);

    // Initialize and use the Git remote URL
    getGitRemoteUrl().then((url) => {
        remoteUrl = url;
        console.log("Git detected url.")
    });

    let disposableTrain = vscode.commands.registerCommand('extension.sendGitHubUrl', async () => {
        const url = await vscode.window.showInputBox({ prompt: 'Enter GitHub URL to train model', value: remoteUrl });
        if (url) {
            await trainModel(url);
            remoteUrl = url;
            console.log(`setting github url... ${remoteUrl}`)
            openTabsSidebarProvider.setUrl(remoteUrl);
            analyzeFileProvider.setRemoteUrl(remoteUrl);
            trained = true;
            const activeEditor = vscode.window.activeTextEditor;

            if (activeEditor) {
                await analyzeDocument(activeEditor.document);
            }
        } else {
            vscode.window.showErrorMessage('GitHub URL is required');
        }


    });

    // File event handlers, sends file content to backend on change
    const analyzeSavedFileDisposable = vscode.workspace.onDidSaveTextDocument(document => {
        if (trained && remoteUrl && document.languageId === "java") {
            analyzeDocument(document);
        }
    });

    // File event handlers, sends file content to backend on file open
    const analyzeOpenedFileDisposable = vscode.workspace.onDidOpenTextDocument(document => {
        if (trained && remoteUrl && document.languageId === "java") {
            analyzeDocument(document);
        }
    });

    /* Commented functionnality, missing functions getAllJavaFiles() and analyzeProjectFiles()
    const analyzeNewJavaFilesCommand = vscode.commands.registerCommand('extension.analyzeNewJavaFiles', async () => {
        const allFiles = await getAllJavaFiles();
        const results = await analyzeProjectFiles(allFiles);
        if (results) {
            console.log(results);
            vscode.window.showInformationMessage('New Java files analysis complete. Check the console for details.');
        }
    });
    */

    let generateLog = vscode.commands.registerCommand('log-advice-generator.generateLogAdvice', generateLogAdvice);
    let improveLogs = vscode.commands.registerCommand('log-advice-generator.improveLogsCommand', improveLogsCommand);

    let changeModel = vscode.commands.registerCommand('log-advice-generator.changeModelId', async () => {
        const MODEL_ID = await apiModelService.getModel();
        const model = await vscode.window.showInputBox({ prompt: `Enter ${api_id} Model ID`, value: MODEL_ID });
        if (model) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Changing Model to: ${model}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "Initializing model change..." });

                try {
                    const response = await apiModelService.changeModel(model)

                    if (response.completed === true) {
                        vscode.window.showInformationMessage('Model Change has been successful, Model configured: ' + response.model);
                    } else {
                        vscode.window.showErrorMessage('Model Change Failed, Model configured: ' + response.model);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage('An error occurred during the model change process.');
                }
            });
        } else {
            vscode.window.showErrorMessage('MODEL ID is required');
        }
    });


    let changeToken = vscode.commands.registerCommand('log-advice-generator.changeToken', async () => {
        const token = await vscode.window.showInputBox({ prompt: `Enter ${api_id} Token` });
        if (token) {
            console.log(`Changing token`)
            const response = await apiModelService.changeToken(token);
            //console.log(JSON.stringify(response, null, 2));
            if (response.completed == true) {
                vscode.window.showInformationMessage('Token Change has been successfull')
            } else {
                vscode.window.showErrorMessage(response.message);
            }
        } else {
            vscode.window.showErrorMessage('TOKEN is required');
        }
    });

    let getModelInfo = vscode.commands.registerCommand('log-advice-generator.modelInfo', async () => {
        const response = await apiModelService.info();
        //console.log(JSON.stringify(response.model, null))
        vscode.window.showInformationMessage("Model : " + JSON.stringify(response.model, null))
    });

    context.subscriptions.push(
        disposableTrain,
        analyzeSavedFileDisposable,
        analyzeOpenedFileDisposable,
        generateLog,
        improveLogs,
        changeModel,
        changeToken,
        getModelInfo
    );
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};
