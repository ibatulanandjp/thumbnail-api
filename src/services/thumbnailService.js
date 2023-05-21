const sharp = require('sharp');
const logger = require('../../logging/config/logger');

/**
 * Function to generate thumbnail for a given image buffer
 * @param imageBuffer - Buffer (Image) to convert into a thumbnail
 * @param width - Required width of the thumbnail
 * @param height - Required height of the thumbnail
 * @param thumbnailPath - Path of the thumbnail
 * @returns Thumbnail
 */
async function generateThumbnail(imageBuffer, width, height, thumbnailPath) {
    try {
        const thumbnail = await sharp(imageBuffer)
            .resize(width, height)
            .toFile(thumbnailPath);

        return thumbnail;
    } catch (error) {
        logger.error(`Error generating thumbnail: ${error}`);
    }
}

module.exports = {
    generateThumbnail,
};
