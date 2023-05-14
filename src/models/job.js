const { MongoClient, ObjectId } = require('mongodb');
const logger = require('../../logging/config/logger');
const { uri, dbName, collectionName } = require('../config/db');

/**
 * Function to connect to the MongoDB Server and return database connection
 * @returns Database instance
 */
async function connect() {
    try {
        const client = await MongoClient.connect(uri);
        const db = client.db(dbName);
        logger.info('Connected to database successfully');
        return db;
    } catch (error) {
        logger.error(`Error connecting to the database: ${error}`);
    }
}

/**
 * Function to create job document in the database
 * @param imageFilename - Url of the image
 * @returns ID of the newly created job
 */
async function createJob(imageFilename) {
    try {
        const db = await connect();
        const job = {
            imageFilename,
            status: 'processing',
            createdAt: new Date(),
        };

        const result = await db.collection(collectionName).insertOne(job);
        logger.info(
            `Created a new job in the database with the id: ${result.insertedId}`
        );

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
        const db = await connect();
        const job = await db.collection(collectionName).findOne({
            _id: new ObjectId(jobId),
        });
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
        const db = await connect();
        const result = await db.collection(collectionName).updateOne(
            {
                _id: new ObjectId(jobId),
            },
            {
                $set: { status },
            }
        );
        logger.info(`Updated the status of the job : ${jobId}`);
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
        const db = await connect();
        const jobs = await db.collection(collectionName).find().toArray();

        logger.info('Retrieved the list of jobs');
        return jobs;
    } catch (error) {
        logger.error(`Error getting all jobs from the database: ${error}`);
    }
}

module.exports = {
    createJob,
    getJobById,
    updateJobStatus,
    getAllJobs,
};
