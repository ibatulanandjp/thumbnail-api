const amqp = require('amqplib');
const logger = require('../../logging/config/logger');
const { uri, queueName } = require('../config/messagebroker');

let channel;

/**
 * Function to connect to the Message Broker
 */
async function connect() {
    try {
        const connection = await amqp.connect(uri);
        channel = await connection.createChannel();

        // Create the queue if it does not exist
        await channel.assertQueue(queueName, { durable: true });

        logger.info('Connected to Message Broker');

        return channel;
    } catch (error) {
        logger.error(`Error connecting to the Message Broker: ${error}`);
    }
}

/**
 * Function to push job to the queue
 * @param message - Object (message) to push
 */
async function enqueue(message) {
    try {
        // If the channel doesn't exist already, create a new one
        if (!channel) {
            await connect();
        }

        // Send the message to the queue
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
        logger.info(`Enqueued a job with id: ${message.jobId}`);
    } catch (error) {
        logger.error(`Error pushing message to the queue: ${error}`);
    }
}

module.exports = {
    connect,
    enqueue,
};
