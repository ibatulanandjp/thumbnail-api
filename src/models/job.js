const { MongoClient, ObjectId } = require('mongodb');
const logger = require('../../logging/config/logger');
const { uri, dbName, collectionName } = require('../config/db');

/**
 * Function to connect to the MongoDB and return database connection
 * @returns Database instance
 */
async function connect() {
    try {
        const client = await MongoClient.connect(uri);
        const db = client.db(dbName);
        logger.info('Connected to database successfully');
        return { client, db };
    } catch (error) {
        logger.error(`Error connecting to the database: ${error}`);
    }
}

/**
 * Function to disconnect from the database
 * @param client - MongoDB Client
 */
async function disconnect(client) {
    try {
        await client.close();
        logger.info('Disconnected from the database successfully');
    } catch (error) {
        logger.error(`Error disconnecting from the database: ${error}`);
    }
}

/**
 * Function to create job document in the database
 * @param imageFilename - Url of the image
 * @returns ID of the newly created job
 */
async function createJob(imageFilename) {
    try {
        const { client, db } = await connect();
        const job = {
            imageFilename,
            status: 'processing',
            createdAt: new Date(),
        };

        const result = await db.collection(collectionName).insertOne(job);
        logger.info(
            `Created a new job in the database with the id: ${result.insertedId}`
        );

        // Disconnect from the database
        await disconnect(client);

        return result.insertedId;
    } catch (error) {
        logger.error(`Error creating job in the database: ${error}`);
    }
}

/**
 * Function to retrieve job document from the database by specific Id
 * @param jobId - Id of the job
 * @returns Job document with the id
 */
async function getJobById(jobId) {
    try {
        const { client, db } = await connect();
        const job = await db.collection(collectionName).findOne({
            _id: new ObjectId(jobId),
        });
        // Disconnect from the database
        await disconnect(client);
        return job;
    } catch (error) {
        logger.error(`Error getting job by Id from the database: ${error}`);
    }
}

/**
 * Function to update the status of the job document in the database
 * @param jobId - Id of the Job
 * @param status - New Status to set
 * @returns True, if one row updated, else False
 */
async function updateJobStatus(jobId, status) {
    try {
        const { client, db } = await connect();
        const result = await db.collection(collectionName).updateOne(
            {
                _id: new ObjectId(jobId),
            },
            {
                $set: { status },
            }
        );
        logger.info(`Updated the status of the job : ${jobId}`);
        // Disconnect from the database
        await disconnect(client);
        return result.modifiedCount === 1;
    } catch (error) {
        logger.error(`Error updating job status in the database: ${error}`);
    }
}

/**
 * Function to retrive all the job documents from the database
 * @returns List of all the jobs
 */
async function getAllJobs() {
    try {
        const { client, db } = await connect();
        const jobs = await db.collection(collectionName).find().toArray();

        logger.info('Retrieved the list of jobs');
        // Disconnect from the database
        await disconnect(client);
        return jobs;
    } catch (error) {
        logger.error(`Error getting all jobs from the database: ${error}`);
    }
}

/**
 * Function to delete job document from the database by specific Id
 * @param jobId - Id of the job
 * @returns Deleted job
 */
async function deleteJobById(jobId) {
    try {
        const { client, db } = await connect();

        const result = await db.collection(collectionName).findOneAndDelete({
            _id: new ObjectId(jobId),
        });

        // Disconnect from the database
        await disconnect(client);
        return result.value;
    } catch (error) {
        logger.error(`Error deleting job by Id from the database: ${error}`);
    }
}

module.exports = {
    createJob,
    getJobById,
    updateJobStatus,
    getAllJobs,
    deleteJobById,
};
