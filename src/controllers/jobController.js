const jobModel = require('../models/job');
const logger = require('../../logging/config/logger');
const { enqueue } = require('../jobs/queue');

/**
 * Controller Function to create job
 * @param {*} req - Request parameters
 * @param {*} res - Response parameters
 */
async function createJob(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded' });
        }
        const image = req.file;
        logger.info(`Creating a new job for the file: ${image.filename}`);

        // Create a new job in the database
        const jobId = await jobModel.createJob(image.filename);

        // Push the job to the queue
        const jobData = {
            jobId: jobId,
            imageFilename: image.filename,
        };
        await enqueue(jobData);

        // Return the job ID to the user
        res.json({ jobId });
    } catch (error) {
        logger.error(`Error creating job: ${error}`);
        res.status(500).json({
            error: 'An error occurred while creating the job',
        });
    }
}

/**
 * Controller Function to get job status
 * @param {*} req - Request parameters
 * @param {*} res - Response parameters
 * @returns Status of Job
 */
async function getJobStatus(req, res) {
    try {
        const { id } = req.params;
        logger.info(`Checking status of the job with id: ${id}`);

        // Retrieve the job from the database
        const job = await jobModel.getJobById(id);

        // If the job doesn't exiest, return an error response
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        logger.info(`Job status of the job with id: ${id} is: ${job.status}`);
        // Return the job status to the user
        res.json({ status: job.status });
    } catch (error) {
        logger.error(`Error getting job status: ${error}`);
        res.status(500).json({
            error: 'An error occurred while retrieving the job status',
        });
    }
}

/**
 * Controller Function to get thumbnail
 * @param {*} req - Request parameters
 * @param {*} res - Response parameters
 */
async function getThumbnail(req, res) {
    try {
        const { jobId } = req.params;

        // Retrieve the job from the database
        const job = await jobModel.getJobById(jobId);

        // If the job doesn't exist or is not completed, return an error response
        if (!job || job.status !== 'succeeded') {
            return res.status(400).json({
                error: 'Job not found or thumbnail generation has not completed',
            });
        }

        // TODO: Implementation for retrieving and sending thumbnail image to the user
    } catch (error) {
        logger.error(`Error getting thumbnail: ${error}`);
        res.status(500).json({
            error: 'An error occurred while retrieving the thumbnail',
        });
    }
}

/**
 * Function to list all jobs
 * @param {*} req - Request parameters
 * @param {*} res - Response parameters
 */
async function listJobs(req, res) {
    try {
        logger.info('Retrieving the list the jobs');

        // Retrieve all jobs from the database
        const jobs = await jobModel.getAllJobs();

        // Return the list of jobs to the user
        res.json({ jobs });
    } catch (error) {
        logger.error(`Error listing jobs: ${error}`);
        res.status(500).json({
            error: 'An error occurred while retrieving the jobs',
        });
    }
}

module.exports = {
    createJob,
    getJobStatus,
    getThumbnail,
    listJobs,
};
