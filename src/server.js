'use strict';

const app = require('./app');
const { connect } = require('./jobs/queue');
const logger = require('../logging/config/logger');
require('dotenv').config({ path: __dirname + './../src/config/.env' });

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    logger.info(`Server is listening on port: ${port}`);

    // Connect to Message Broker and start the worker process
    connect();
});
