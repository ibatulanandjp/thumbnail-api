const jobController = require('../../src/controllers/jobController');
const jobModel = require('../../src/models/job');
const queue = require('../../src/jobs/queue');
const path = require('path');
const fs = require('fs');

// Mock the model functions
jest.mock('../../src/models/job', () => {
    const createJobMock = jest.fn().mockResolvedValue('job123');
    const getJobByIdMock = jest.fn().mockResolvedValue({
        status: 'processing',
    });
    const getAllJobsMock = jest.fn().mockResolvedValue([
        { id: '1', status: 'succeeded' },
        { id: '2', status: 'processing' },
        { id: '3', status: 'failed' },
    ]);
    return {
        createJob: createJobMock,
        getJobById: getJobByIdMock,
        getAllJobs: getAllJobsMock,
    };
});

// Mock the queue functions
jest.mock('../../src/jobs/queue', () => {
    const enqueueMock = jest.fn();
    return {
        enqueue: enqueueMock,
    };
});

// Mock the logger functions
jest.mock('../../logging/config/logger', () => {
    const infoMock = jest.fn();
    const errorMock = jest.fn();
    return {
        info: infoMock,
        error: errorMock,
    };
});

// Mock fs (file) function
jest.mock('fs', () => {
    const existsSyncMock = jest.fn().mockReturnValue(true);
    return {
        existsSync: existsSyncMock,
    };
});

// Test Implementation
describe('Job Controller', () => {
    describe('createJob', () => {
        // Before Each Test
        beforeEach(() => {
            req = {
                file: { filename: 'test.jpg' },
            };
            res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            };
        });

        // After Each Test
        afterEach(() => {
            jest.clearAllMocks();
        });

        // === Test #1 ===
        it('should create a new job and return the job ID', async () => {
            // Call the createJob function
            await jobController.createJob(req, res);

            // Check if createJob model function was called with expected parameter
            expect(jobModel.createJob).toHaveBeenCalledWith(req.file.filename);

            // Check if the job was enqueued
            expect(queue.enqueue).toHaveBeenCalledWith({
                jobId: 'job123',
                imageFilename: req.file.filename,
            });

            // Check if the response is as expected
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ jobId: 'job123' });
        });

        // === Test #2 ===
        it('should handle the case when no image file is uploaded', async () => {
            // Request file is undefined
            req.file = undefined;

            // Call the createJob function
            await jobController.createJob(req, res);

            // Check if the response is as expected
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'No image file uploaded',
            });

            // Check if the createJob model function is not called
            expect(jobModel.createJob).not.toHaveBeenCalled();
        });

        // === Test #3 ===
        it('should handle errors during job creation', async () => {
            // Mock jobModel.createJob to throw error
            jobModel.createJob.mockRejectedValueOnce(
                new Error({ error: 'Error creating job in the database' })
            );

            // Call the createJob function
            await jobController.createJob(req, res);

            // Check if the createJob model function was called with expected parameter
            expect(jobModel.createJob).toHaveBeenCalledWith(req.file.filename);

            // Check if the response is as expected
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'An error occurred while creating the job',
            });
        });
    });

    describe('getJobStatus', () => {
        // Before Each Test
        beforeEach(() => {
            req = {
                params: { id: 'job123' },
            };
            res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            };
        });

        // After Each Test
        afterEach(() => {
            jest.clearAllMocks();
        });

        // === Test #1 ===
        it('should get the job status', async () => {
            // Call the getJobStatus function
            await jobController.getJobStatus(req, res);

            // Check if the getJobById model function is called with expected parameters
            expect(jobModel.getJobById).toHaveBeenCalledWith(req.params.id);

            // Check if the response is as expected
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ status: 'processing' });
        });

        // === Test #2 ===
        it('should handle the case when the job is not found', async () => {
            // Mock getJobById model function returns null
            jobModel.getJobById = jest.fn().mockResolvedValue(null);

            // Call the getJobStatus function
            await jobController.getJobStatus(req, res);

            // Check if the response is as expected
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Job not found' });

            // Check if the getJobById model function is called with expected parameter
            expect(jobModel.getJobById).toHaveBeenCalledWith(req.params.id);
        });

        // === Test #3 ===
        it('should handle errors while getting job status', async () => {
            // Mock jobModel.getJobById to throw error
            jobModel.getJobById.mockRejectedValueOnce(
                new Error({
                    error: 'Error getting job by Id from the database',
                })
            );

            // Call the getJobStatus function
            await jobController.getJobStatus(req, res);

            // Check if the getJobById model function was called with expected parameter
            expect(jobModel.getJobById).toHaveBeenCalledWith(req.params.id);

            // Check if the response is as expected
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'An error occurred while retrieving the job status',
            });
        });
    });

    describe('getThumbnail', () => {
        // Before Each Test
        beforeEach(() => {
            req = {
                params: { id: 'job123' },
            };
            res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
                sendFile: jest.fn(),
            };
        });

        // After Each Test
        afterEach(() => {
            jest.clearAllMocks();
        });

        // === Test #1 ===
        it('should retrieve and send the thumbnail image to the user', async () => {
            // Evaluate path
            let thumbnailPath = path.join(
                __dirname,
                '../../public/thumbnails',
                `${req.params.id}.jpg`
            );

            // Mock getJobById function returns 'succeeded' as job status
            jobModel.getJobById = jest
                .fn()
                .mockResolvedValue({ status: 'succeeded' });

            // Call the getThumbnail function
            await jobController.getThumbnail(req, res);

            // Check if the getJobById model function is called with expected parameter
            expect(jobModel.getJobById).toHaveBeenCalledWith(req.params.id);

            // Check if the fs.existsSync function is called with expected parameter
            expect(fs.existsSync).toHaveBeenCalledWith(thumbnailPath);

            // Check if the response is as expected
            expect(res.status).not.toHaveBeenCalled();
            expect(res.sendFile).toHaveBeenCalledWith(thumbnailPath);
        });

        // === Test #2 ===
        it('should handle the case when job is not found', async () => {
            // Mock getJobById function returns null
            jobModel.getJobById = jest.fn().mockResolvedValue(null);

            // Call the getThumbnail function
            await jobController.getThumbnail(req, res);

            // Check if the getJobById model function is called with expected parameter
            expect(jobModel.getJobById).toHaveBeenCalledWith(req.params.id);

            // Check if the fs.existsSync function is not called
            expect(fs.existsSync).not.toHaveBeenCalled();

            // Check if the response is as expected
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Job not found',
            });
        });

        // === Test #3 ===
        it('should handle the case when thumbnail generation is not complete', async () => {
            // Mock getJobById function returns 'processing' as job status
            jobModel.getJobById = jest
                .fn()
                .mockResolvedValue({ status: 'processing' });

            // Call the getThumbnail function
            await jobController.getThumbnail(req, res);

            // Check if the getJobById model function is called with expected parameter
            expect(jobModel.getJobById).toHaveBeenCalledWith(req.params.id);

            // Check if the fs.existsSync function is not called
            expect(fs.existsSync).not.toHaveBeenCalled();

            // Check if the response is as expected
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Thumbnail generation has not completed',
            });
        });

        // === Test #4 ===
        it('should handle the case when the thumbnail file is not found', async () => {
            // Evaluate path
            let thumbnailPath = path.join(
                __dirname,
                '../../public/thumbnails',
                `${req.params.id}.jpg`
            );

            // Mock getJobById function returns 'succeeded' as job status
            jobModel.getJobById = jest
                .fn()
                .mockResolvedValue({ status: 'succeeded' });

            // Mock fs.existsSync function returns 'false'
            fs.existsSync = jest.fn().mockReturnValue(false);

            // Call the getThumbnail function
            await jobController.getThumbnail(req, res);

            // Check if the getJobById model function is called with expected parameter
            expect(jobModel.getJobById).toHaveBeenCalledWith(req.params.id);

            // Check if the fs.existsSync function is called with expected parameter
            expect(fs.existsSync).toHaveBeenCalledWith(thumbnailPath);

            // Check if the response is as expected
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Thumbnail not found',
            });
        });

        // === Test #5 ===
        it('should handle errors during thumbnail retrieval', async () => {
            // Mock getJobById function returns an error
            jobModel.getJobById = jest.fn().mockRejectedValue(
                new Error({
                    error: 'Error getting job by Id from the database',
                })
            );

            // Call the getThumbnail function
            await jobController.getThumbnail(req, res);

            // Check if the getJobById model function is called with expected parameter
            expect(jobModel.getJobById).toHaveBeenCalledWith(req.params.id);

            // Check if the fs.existsSync function is not called
            expect(fs.existsSync).not.toHaveBeenCalled();

            // Check if the response is as expected
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'An error occurred while retrieving the thumbnail',
            });
        });
    });

    describe('listJobs', () => {
        // Before Each Test
        beforeEach(() => {
            req = {
                params: { id: 'job123' },
            };
            res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
                sendFile: jest.fn(),
            };
        });

        // After Each Test
        afterEach(() => {
            jest.clearAllMocks();
        });

        // === Test #1 ===
        it('should retrieve the list of jobs', async () => {
            // Call the listJobs function
            await jobController.listJobs(req, res);

            // Check if the getAllJobs model function is called
            expect(jobModel.getAllJobs).toHaveBeenCalled();

            // Check if the response is as expected
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                jobs: [
                    { id: '1', status: 'succeeded' },
                    { id: '2', status: 'processing' },
                    { id: '3', status: 'failed' },
                ],
            });
        });

        // === Test #2 ===
        it('should handle errors while retrieving the jobs', async () => {
            // Mock jobModel.getAllJobs to throw error
            jobModel.getAllJobs.mockRejectedValueOnce(
                new Error({
                    error: 'Error getting all jobs from the database',
                })
            );

            // Call the listJobs function
            await jobController.listJobs(req, res);

            // Check if the getAllJobs model function is called
            expect(jobModel.getAllJobs).toHaveBeenCalled();

            // Check if the response is as expected
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'An error occurred while retrieving the jobs',
            });
        });
    });
});
