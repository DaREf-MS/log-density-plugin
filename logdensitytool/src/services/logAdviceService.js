const vscode = require('vscode');
const path = require('path');

let apiModelService;
let reponseService;
let readFile;
let buildPrompt;
let getSurroundingMethodText;
let extractAttributesFromPrompt;
let StandardResponse;
let createResponse;
let configuration;

function initializeAdviceService(
  _apiModelService,
  _reponseService,
  _readFile,
  _buildPrompt,
  _getSurroundingMethodText,
  _extractAttributesFromPrompt,
  _StandardResponse,
  _createResponse,
  _configuration
) {
  apiModelService = _apiModelService;
  reponseService = _reponseService;
  readFile = _readFile;
  buildPrompt = _buildPrompt;
  getSurroundingMethodText = _getSurroundingMethodText;
  extractAttributesFromPrompt = _extractAttributesFromPrompt;
  StandardResponse = _StandardResponse;
  createResponse = _createResponse;
  configuration = _configuration;
}

async function generateLogAdviceForDocument(document, cursorLine) {
  const {
    prompt_file,
    attributes_to_comment,
    comment_string,
    injection_variable,
    llm_temperature,
    llm_max_token
  } = configuration;

  const selectedText = getSurroundingMethodText(document, cursorLine);
  const classVariables = getClassVariables(document);

  let prompt = (
    "Context: Suggest 1 log (System.out.println()) to add to method the following JAVA functions. " +
    "Don't return the input, only the output:\n" +
    selectedText
  );

  const projectBasePath = path.resolve(__dirname, "..", "..","..");
  let system_prompt = await readFile(path.join(projectBasePath, "prompt", prompt_file));

  let attributes = [];
  if (system_prompt.includes("{{") && system_prompt.includes("}}")) {
    attributes = extractAttributesFromPrompt(system_prompt, attributes_to_comment);
    system_prompt = system_prompt.replace("{{", "{").replace("}}", "}");
  }

  const builtPrompt = buildPrompt([selectedText, classVariables], system_prompt, injection_variable);
  if (builtPrompt !== null) {
    prompt = builtPrompt;
  }

  const model = await apiModelService.getModel();

  let linesToInsert = [];
  while (linesToInsert.length === 0) {
    const modelResponse = await apiModelService.generate(
      model,
      null,
      prompt,
      llm_temperature,
      llm_max_token
    );

    if (attributes.length > 0) {
      linesToInsert = reponseService.extractLines(
        modelResponse,
        attributes,
        attributes_to_comment,
        comment_string
      );
    } else {
      const standardResponse = createResponse(StandardResponse.responseId);
      linesToInsert = standardResponse.extractLines(
        modelResponse,
        attributes,
        attributes_to_comment,
        comment_string
      );
    }
  }

  const edit = new vscode.WorkspaceEdit();
  const cursorPosition = new vscode.Position(cursorLine, 0);

  const currentLineText = document.lineAt(cursorLine).text;
  const lineIndentMatch = currentLineText.match(/^\s*/);
  const detectedIndent = lineIndentMatch ? lineIndentMatch[0] : '';

  linesToInsert.forEach((lineText) => {
    const formattedLine = detectedIndent + lineText
    edit.insert(document.uri, cursorPosition, formattedLine + "\n");
  });

  await vscode.workspace.applyEdit(edit);

  const newPosition = new vscode.Position(cursorLine + linesToInsert.length, 0);
  const editor = await vscode.window.showTextDocument(document.uri);
  editor.revealRange(new vscode.Range(newPosition, newPosition));

  return linesToInsert.length;
}


function getClassVariables(document) {
  const text = document.getText();
  const variablePattern = /(private|public|protected)\s+(static\s+)?(final\s+)?(\w+\s+\w+\s*=\s*.+?;)/g;
  const matches = text.match(variablePattern);
  const classVariablesString = matches ? matches.join('\n') : 'No class variables found.';

  return classVariablesString;
}

module.exports = {
  initializeAdviceService,
  generateLogAdviceForDocument,
  getClassVariables
};
