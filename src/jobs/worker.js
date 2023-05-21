const jobModel = require('../models/job');
const { generateThumbnail } = require('../services/thumbnailService');
const { readImageFile } = require('../services/fileService');
const path = require('path');
const { connect } = require('./queue');
const logger = require('../../logging/config/logger');
require('dotenv').config({ path: __dirname + './../../src/config/.env' });

let queueName = process.env.QUEUE_NAME;
let channel;

/**
 * Function to process message from the queue
 */
async function processMessage() {
    try {
        channel = await connect();
        logger.info('Worker started. Waiting for thumbnail jobs...');

        channel.consume(
            queueName,
            async (message) => {
                consumeMessage(message, channel);
            },
            { noAck: false }
        );
    } catch (error) {
        logger.error(`Error connecting to the Message Broker: ${error}`);
    }
}

/**
 * Function to consume message and generate thumbnail
 * @param message - Message to process
 * @param channel - Channel
 */
async function consumeMessage(message, channel) {
    try {
        if (!message) {
            return;
        }
        // Parse the job data from the message body
        const jobData = await JSON.parse(message.content.toString());

        const { jobId, imageFilename } = jobData;
        logger.info(`Worker started processing job with id: ${jobId}`);

        // Retrieve the job from the database
        const job = await jobModel.getJobById(jobId);

        // If the job doesn't exist or is already completed, return
        if (!job || job.status !== 'processing') {
            return;
        }

        logger.info(`Processing thumbnail for job: ${jobId}`);

        const imagePath = path.join(
            __dirname,
            '../../public/uploads',
            imageFilename
        );
        const thumbnailPath = path.join(
            __dirname,
            '../../public/thumbnails',
            `${jobId}.jpg`
        );

        // Read the image from the imagePath as an image buffer
        const imageBuffer = await readImageFile(imagePath);

        // Generate the thumbnail and save it at thumbnailPath
        const thumbnail = await generateThumbnail(
            imageBuffer,
            100,
            100,
            thumbnailPath
        );

        logger.info(`Thumbnail generated at path: ${thumbnailPath}`);

        // Update the job status to 'succeeded' and save it
        await jobModel.updateJobStatus(jobId, 'succeeded');

        channel.ack(message);
    } catch (error) {
        logger.error(`Error processing job: ${error}`);
        await jobModel.updateJobStatus(jobId, 'failed');

        channel.reject(message);
    }
}

/**
 * Function to close connection
 */
async function closeConnection() {
    if (channel) {
        await channel.close();
    }
}

/**
 * Function to handle graceful shutdown
 */
function handleShutdown() {
    // Clean up resources, perform cleanup tasks, etc.
    process.env.IS_WORKER_RUNNING = 'false';
    process.exit();
}

// Only start the worker process if it's not already running
if (process.env.IS_WORKER_RUNNING == 'false') {
    process.env.IS_WORKER_RUNNING = 'true';
    processMessage();
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

module.exports = {
    closeConnection,
};
