const jobModel = require('../models/job');
const logger = require('../../logging/config/logger');
const { enqueue } = require('../jobs/queue');
const fs = require('fs');
const path = require('path');

/**
 * Controller Function to create job
 * @param req - Request parameters
 * @param res - Response parameters
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
 * @param req - Request parameters
 * @param res - Response parameters
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
 * @param req - Request parameters
 * @param res - Response parameters
 */
async function getThumbnail(req, res) {
    try {
        const { id } = req.params;
        logger.info(`Checking status of the job with id: ${id}`);

        // Retrieve the job from the database
        const job = await jobModel.getJobById(id);

        // If the job doesn't exist, return an error response
        if (!job) {
            return res.status(404).json({
                error: 'Job not found',
            });
        }

        // If the job is not complete, return an error response
        if (job.status !== 'succeeded') {
            return res.status(400).json({
                error: 'Thumbnail generation has not completed',
            });
        }

        // Retrieve and send thumbnail image to the user
        const thumbnailPath = path.join(
            __dirname,
            '../../public/thumbnails',
            `${id}.jpg`
        );

        // If the thumbnail file doesn't exist at the thumbnail path
        if (!fs.existsSync(thumbnailPath)) {
            return res.status(404).json({ error: 'Thumbnail not found' });
        }

        res.sendFile(thumbnailPath);
    } catch (error) {
        logger.error(`Error getting thumbnail: ${error}`);
        res.status(500).json({
            error: 'An error occurred while retrieving the thumbnail',
        });
    }
}

/**
 * Function to list all jobs
 * @param req - Request parameters
 * @param res - Response parameters
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

async function deleteJobById(req, res) {
    try {
        const { id } = req.params;
        logger.info(`Checking status of the job with id: ${id}`);

        // Find the job by ID and delete it
        const deletedJob = await jobModel.deleteJobById(id);
        if (!deletedJob) {
            return res.status(404).json({ error: 'Job not found' });
        }

        logger.info(`Job deleted with id: ${id}`);
        // Return the deletion status to the user
        res.status(200).json({ message: 'Job deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting job: ${error}`);
        res.status(500).json({
            error: 'An error occurred while deleting the job',
        });
    }
}

module.exports = {
    createJob,
    getJobStatus,
    getThumbnail,
    listJobs,
    deleteJobById,
};
