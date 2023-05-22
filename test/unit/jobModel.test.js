const jobModel = require('../../src/models/job');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: __dirname + './../../src/config/.env' });

jest.mock('mongodb');

// Mock the logger functions
jest.mock('../../logging/config/logger', () => {
    const infoMock = jest.fn();
    const errorMock = jest.fn();
    return {
        info: infoMock,
        error: errorMock,
    };
});

// Test Implementation
describe('Job Model', () => {
    let clientMock, dbMock;

    // Before Each Test
    beforeEach(() => {
        uri = process.env.MONGODB_URI;
        collectionName = process.env.COLLECTION_NAME;
        dbName = process.env.DB_NAME;

        dbMock = {
            collection: jest.fn().mockReturnThis(),
            insertOne: jest.fn().mockResolvedValue({ insertedId: '123' }),
            findOne: jest
                .fn()
                .mockResolvedValue({ _id: '123', status: 'succeeded' }),
            updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
            find: jest.fn().mockReturnThis(),
            toArray: jest.fn().mockResolvedValue([
                { _id: '123', status: 'succeeded' },
                { _id: '456', status: 'failed' },
            ]),
        };
        clientMock = {
            db: jest.fn().mockReturnValue(dbMock),
            close: jest.fn(),
        };

        MongoClient.connect.mockResolvedValue(clientMock);
        clientMock.db = jest.fn().mockReturnValue(dbMock);
    });

    // After Each Test
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createJob', () => {
        // Before Each Test
        beforeEach(() => {
            imageFilename = 'test.jpg';
        });

        // === Test #1 ===
        it('should create a new job in the database and return job id', async () => {
            // Call the createJob function
            const jobId = await jobModel.createJob(imageFilename);

            // Check if the jobId is as expected
            expect(jobId).toBe('123');

            // Check if the connect function is called with expected parameter
            expect(MongoClient.connect).toHaveBeenCalledWith(uri);

            // Check if the database functions are called with expected parameters
            expect(clientMock.db).toHaveBeenCalledWith(collectionName);
            expect(dbMock.collection).toHaveBeenCalledWith(dbName);
            expect(dbMock.insertOne).toHaveBeenCalledWith({
                imageFilename,
                status: 'processing',
                createdAt: expect.any(Date),
            });

            // Check if the database connection close function is called
            expect(clientMock.close).toHaveBeenCalled();
        });

        // === Test #2 ===
        it('should handle the errors during job creation', async () => {
            // Mock the insertOne returns error
            dbMock.insertOne.mockRejectedValue(
                new Error('Error creating job in the database')
            );

            // Call the createJob function
            const jobId = await jobModel.createJob(imageFilename);

            // Check if the jobId is as expected
            expect(jobId).toBe(undefined);
        });
    });

    describe('getJobById', () => {
        // Before Each
        beforeEach(() => {
            jobId = '123';
        });

        // === Test #1 ===
        it('should retrieve the job by ID', async () => {
            // Call the getJobById function
            const job = await jobModel.getJobById(jobId);

            // Check if the job detail is as expected
            expect(job).toEqual({
                _id: '123',
                status: 'succeeded',
            });

            // Check if the connect function is called with expected parameter
            expect(MongoClient.connect).toHaveBeenCalledWith(uri);

            // Check if the database functions are called with expected parameters
            expect(clientMock.db).toHaveBeenCalledWith(collectionName);
            expect(dbMock.collection).toHaveBeenCalledWith(dbName);
            expect(dbMock.findOne).toHaveBeenCalledWith({
                _id: expect.any(ObjectId),
            });

            // Check if the database connection close function is called
            expect(clientMock.close).toHaveBeenCalled();
        });

        // === Test #2 ===
        it('should handle errors during job retrieval by Id', async () => {
            // Mock the findOne returns error
            dbMock.findOne.mockRejectedValue(
                new Error('Error getting job by Id from the database')
            );

            // Call the getJobById function
            const job = await jobModel.getJobById(jobId);

            // Check if the job detail is as expected
            expect(job).toEqual(undefined);
        });
    });

    describe('updateJobStatus', () => {
        // Before Each Test
        beforeEach(() => {
            jobId = '123';
            status = 'succeeded';
        });

        // === Test #1 ===
        it('should update the job status and return true if one row is updated', async () => {
            // Call the updateJobStatus function
            const modified = await jobModel.updateJobStatus(jobId, status);

            // Check if the modified is as expected
            expect(modified).toBe(true);

            // Check if the connect function is called with expected parameter
            expect(MongoClient.connect).toHaveBeenCalledWith(uri);

            // Check if the database functions are called with expected parameters
            expect(clientMock.db).toHaveBeenCalledWith(collectionName);
            expect(dbMock.collection).toHaveBeenCalledWith(dbName);
            expect(dbMock.updateOne).toHaveBeenCalledWith(
                {
                    _id: expect.any(ObjectId),
                },
                {
                    $set: { status },
                }
            );

            // Check if the database connection close function is called
            expect(clientMock.close).toHaveBeenCalled();
        });

        // === Test #2 ===
        it('should return false if no rows are updated', async () => {
            // Mock updateOne to return 0 as modifiedCount
            dbMock.updateOne.mockResolvedValue({ modifiedCount: 0 });

            // Call the updateJobStatus function
            const modified = await jobModel.updateJobStatus(jobId, status);

            // Check if the modified is as expected
            expect(modified).toBe(false);
        });

        // === Test #3 ===
        it('should handle the errors while updating job status', async () => {
            // Mock the updateOne returns error
            dbMock.updateOne.mockRejectedValue(
                new Error('Error updating job status in the database')
            );

            // Call the updateJobStatus function
            const modified = await jobModel.updateJobStatus(jobId, status);

            // Check if the modified is as expected
            expect(modified).toBe(undefined);
        });
    });

    describe('getAllJobs', () => {
        // === Test #1 ===
        it('should retrieve all the jobs', async () => {
            // Call the getAllJobs function
            const jobs = await jobModel.getAllJobs();

            // Check if the jobs are as expected
            expect(jobs).toEqual([
                { _id: '123', status: 'succeeded' },
                { _id: '456', status: 'failed' },
            ]);

            // Check if the connect function is called with expected parameter
            expect(MongoClient.connect).toHaveBeenCalledWith(uri);

            // Check if the database functions are called with expected parameters
            expect(clientMock.db).toHaveBeenCalledWith(collectionName);
            expect(dbMock.collection).toHaveBeenCalledWith(dbName);
            expect(dbMock.find).toHaveBeenCalled();
            expect(dbMock.toArray).toHaveBeenCalled();

            // Check if the database connection close function is called
            expect(clientMock.close).toHaveBeenCalled();
        });

        // === Test #2 ===
        it('should handle errors during retrieval of all jobs', async () => {
            // Mock the findOne returns error
            dbMock.toArray.mockRejectedValue(
                new Error('Error getting all jobs from the database')
            );

            // Call the getAllJobs function
            const jobs = await jobModel.getAllJobs();

            // Check if the jobs are as expected
            expect(jobs).toEqual(undefined);
        });
    });
});
