const dotenv = require('dotenv');
dotenv.config({ path: __dirname + './../config/.env' });

module.exports = {
    uri: process.env.RABBITMQ_URI,
    queueName: process.env.QUEUE_NAME,
};
