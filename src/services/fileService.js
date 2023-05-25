const fs = require('fs');
const logger = require('../../logging/config/logger');

async function readImageFile(filePath) {
    try {
        const imageBuffer = await fs.promises.readFile(filePath);
        return imageBuffer;
    } catch (error) {
        logger.error('Error reading file as buffer: ', error);
    }
}

module.exports = {
    readImageFile,
};
