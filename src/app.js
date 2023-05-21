'use strict';

const express = require('express');
const routes = require('./routes/jobRoutes');
const path = require('path');

// Express App
const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes - base path for all API endpoints
app.use('/api', routes);

module.exports = app;
