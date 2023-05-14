const express = require('express');
const jobController = require('../controllers/jobController');
const upload = require('./middleware');

// Router
const router = express.Router();

// Route for creating job
router.post('/upload', upload.single('image'), jobController.createJob);

// Route for getting job status for a job id
router.get('/job/:id', jobController.getJobStatus);

// Route for getting thumbnail for a job id
router.get('/job/:id/thumbnail', jobController.getThumbnail);

// Route for listing all the jobs
router.get('/jobs', jobController.listJobs);

module.exports = router;
