const fs = require('fs').promises;

async function readFile(filepath) {
    try {
        const content = await fs.readFile(filepath, 'utf-8');
        return content;
    } catch (error) {
        throw new Error(`Error reading file ${filepath}: ${error.message}`);
    }
}

module.exports = {
    readFile
};
