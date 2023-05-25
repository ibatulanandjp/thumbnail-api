const { fork } = require('child_process');
const amqp = require('amqplib');
const logger = require('../../logging/config/logger');
require('dotenv').config({ path: __dirname + './../../src/config/.env' });

let uri = process.env.RABBITMQ_URI;
let queueName = process.env.QUEUE_NAME;

let connection, channel;
let worker;

/**
 * Function to connect to the Message Broker
 * returns Channel
 */
async function connect() {
    try {
        connection = await amqp.connect(uri);
        channel = await connection.createChannel();

        // Create the queue if it does not exist
        await channel.assertQueue(queueName, { durable: true });

        logger.info('Connected to Message Broker');

        if (process.env.IS_WORKER_RUNNING == 'false') {
            logger.info('Creating a Child Worker Process');
            worker = fork('./src/jobs/worker.js');
        }

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

/**
 * Function to close connection
 */
async function closeConnection() {
    if (channel) {
        await channel.close();
    }
    if (connection) {
        await connection.close();
    }
    if (worker && process.env.IS_WORKER_RUNNING === 'true') {
        worker.kill();
        process.env.IS_WORKER_RUNNING = 'false';
    }
}

module.exports = {
    connect,
    enqueue,
    closeConnection,
};
