/* eslint-disable no-unused-vars */
// API IDs available
const HuggingFaceApiModel = require("./services/apiModel/huggingFaceApiModelService");
const OllamaApiModel = require("./services/apiModel/ollamaApiModelService");

// Response IDs type available
const JsonResponse = require("./services/response/jsonResponseService");
const RegexResponse = require("./services/response/regexResponseService")
const StandardResponse = require("./services/response/standardResponseService");

let configuration = {
    api_id : OllamaApiModel.apiId, //ollama and huggingface available
    url : "http://localhost", // Service URL
    port : "11434", // Service Port
    default_model : "qwen2.5-coder:3b",
    prompt_file : "generate_log.txt", // From prompt Folder
    improve_log_prompt_file : "improve_log.txt", // From prompt Folder
    default_token : "", // Only used for huggingface
    llm_temperature: null, // (Default: 0.8) value between 0 and 1. Increasing the temperature will make the model answer more creatively. (null = not configured)
    llm_max_token: null, // (Default: 128, -1 = infinite generation, -2 = fill context) (null = not configured)
    response_id :  JsonResponse.responseId, // select valid response id
    attributes_to_comment : ["reason"], // list of attributes to comment
    comment_string: "//", // Comment string to add
    injection_variable: "[{vscode_content}, {class_variables}, {log_message}]" // variable to inject vscode content in prompt
}


module.exports = {
    configuration
};