const vscode = require('vscode');

/**
 * This function finds the attributes in SystemPrompt and replaces them with corresponding texts.
 * If none of the attributes are found, the texts are added at the end.
 * @param {string[]} texts - Array of texts to replace the injectionVariables.
 * @param {string} systemPrompt - The system prompt to modify.
 * @param {string} injectionVariable - A string in the format `injection_variable: "[{attr1}, {attr2}]"`.
 * @returns {string|null} - Updated system prompt or null if an error occurs.
 */
function buildPrompt(texts, systemPrompt, injectionVariable) {
    try {
        
        systemPrompt = String(systemPrompt);

        const contentInsideBrackets = injectionVariable.match(/\[(.*?)\]/);
        if (!contentInsideBrackets) {
            throw new Error("Invalid injectionVariable format. Expected format: 'injection_variable: \"[{attr1}, {attr2}]\"'");
        }

        const attributes = contentInsideBrackets[1]
            .split(',')
            .map(item => item.trim());

        
        if (!Array.isArray(texts)) {
            throw new Error("The 'texts' parameter must be an array.");
        }

        let found = false;

        for (let i = 0; i < attributes.length; i++) {
            const attribute = attributes[i];
            const text = texts[i];
            const regex = new RegExp(attribute, 'g');
            if (systemPrompt.includes(attribute)) {
                systemPrompt = systemPrompt.replace(regex, text);
                found = true;
            }
        }

        
        if (!found) {
            systemPrompt += texts.join(' ');
        }

        return systemPrompt;
        
    } catch (error) {
        console.error("Error in buildPrompt function:", error.message);
        return null;
    }
}

function getSurroundingMethodText(document, lineNumber) {
    let startLine = lineNumber;
    let endLine = lineNumber;

    // Compteur pour suivre les accolades
    let openBraces = 0;

    // Chercher le début de la méthode
    while (startLine > 0) {
        const lineText = document.lineAt(startLine).text.trim();

        // Compter les accolades fermées et ouvertes
        openBraces += (lineText.match(/\}/g) || []).length;
        openBraces -= (lineText.match(/\{/g) || []).length;

        if (openBraces < 0) {
            // Trouvé le début de la méthode
            break;
        }

        startLine--;
    }

    // Réinitialiser le compteur pour chercher la fin
    openBraces = 0;

    // Chercher la fin de la méthode
    while (endLine < document.lineCount - 1) {
        const lineText = document.lineAt(endLine).text.trim();

        // Compter les accolades ouvertes et fermées
        openBraces += (lineText.match(/\{/g) || []).length;
        openBraces -= (lineText.match(/\}/g) || []).length;

        if (openBraces === 0 && lineText.includes('}')) {
            // Trouvé la fin de la méthode
            break;
        }

        endLine++;
    }

    // Récupérer le texte de la méthode complète
    const methodRange = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
    return document.getText(methodRange);
}

/**
 * Extract attribute names before the colon (:) in a JSON-like structure.
 * @param {string} text - The text containing JSON-like structure.
 * @param {string[]} attributesToComment - List of attributes to comment used to reorder list
 * @returns {string[]} - List of attribute names before the colon.
 */
function extractAttributesFromPrompt(text, attributesToComment) {
    const regex = /{{(.*?)}}/s; // get text between {{ and }}
    const matches = text.match(regex);

    if (matches) {
        text = matches[1].trim()
    }

    const attributes = extractAttributesBeforeColon(text)

    // Reorder the attributes: move attributes in 'attributesToComment' to the front
    const reorderedAttributes = attributes.sort((a, b) => {
        const aInCommentList = attributesToComment.includes(a);
        const bInCommentList = attributesToComment.includes(b);
        // If 'a' is in attributesToComment and 'b' is not, 'a' should come first
        if (aInCommentList && !bInCommentList) return -1;
        if (!aInCommentList && bInCommentList) return 1;
        return 0; // Maintain the order for other cases
    });

    return reorderedAttributes;
}

/**
 * Extract attribute names before the colon (:) from text.
 * @param {string} text - The text containing key-value pairs.
 * @returns {string[]} - List of attribute names.
 */
function extractAttributesBeforeColon(text) {
    const regex = /"(\w+)"\s*:|(\w+)\s*:/g;  // Matches word characters (letters, digits, underscores) followed by a colon.
    const attributes = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        attributes.push(match[1] || match[2]);  // Add the matched key (before the colon) to the list
    }

    return attributes;
}

module.exports = {
    buildPrompt,
    getSurroundingMethodText,
    extractAttributesFromPrompt
};