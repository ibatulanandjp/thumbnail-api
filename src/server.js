'use strict';

const express = require('express');
const routes = require('./routes/jobRoutes');
const { connect } = require('./jobs/queue');
const path = require('path');
const logger = require('../logging/config/logger');

// Express App
const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes - base path for all API endpoints
app.use('/api', routes);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    logger.info(`Server is listening on port: ${port}`);

    // Connect to Message Broker and start the worker process
    connect();
});
