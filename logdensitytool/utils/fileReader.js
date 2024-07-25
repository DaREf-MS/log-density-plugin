const fs = require('fs');

async function readFile(filepath) {
    try {
        const content = await fs.readFile(filepath, 'utf-8');
        return content;
    } catch (error) {
        console.error(`Error reading file ${filepath}:`, error);
        return '';
    }
}

module.exports = {
    readFile
}