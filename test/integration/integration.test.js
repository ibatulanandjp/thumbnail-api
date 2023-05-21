const request = require('supertest');
const app = require('../../src/app');
const path = require('path');
const queue = require('../../src/jobs/queue');
require('../../src/jobs/worker');

describe('Integration Test', () => {
    let server;
    let jobId;

    beforeAll(() => {
        server = app.listen(4000, () => {
            console.log('Server started on port 4000');
        });
    });

    afterAll(async () => {
        await request(app).delete(`/api/job/${jobId}`);
        await queue.closeConnection();
        server.close();
    });

    describe('POST /upload', () => {
        it('should upload an image file and return a success response', async () => {
            const imagePath = path.join(__dirname, '/image.jpg');

            const response = await request(app)
                .post('/api/upload')
                .attach('image', imagePath);
            jobId = response.body.jobId;

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('jobId');
        });

        it('should return 400 if no image file is provided', async () => {
            const response = await request(app).post('/api/upload');
            expect(response.status).toBe(400);
        });
    });

    describe('GET /job/:id', () => {
        it('should return the job status for a valid job ID', async () => {
            const response = await request(app).get(`/api/job/${jobId}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body.status).toBeDefined();
        });

        it('should return 404 for an invalid job ID', async () => {
            const dummyJobId = '64687cf8b4a75a41085df8f1';
            const response = await request(app).get(`/api/job/${dummyJobId}`);

            expect(response.status).toBe(404);
        });
    });

    describe('GET /jobs', () => {
        it('should return the list of jobs', async () => {
            const response = await request(app).get('/api/jobs');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('jobs');
            expect(response.body.jobs).toBeDefined();
            expect(Array.isArray(response.body.jobs)).toBe(true);
        });
    });

    describe('GET /jobs/:id/thumbnail', () => {
        it('should return the thumbnail image for a valid job ID', async () => {
            const response = await request(app).get(
                `/api/job/${jobId}/thumbnail`
            );

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('image/jpeg');
        });

        it('should return 404 for an invalid job ID', async () => {
            const dummyJobId = '64687cf8b4a75a41085df8f1';
            const response = await request(app).get(
                `/api/job/${dummyJobId}/thumbnail`
            );

            expect(response.status).toBe(404);
        });
    });
});
