const dotenv = require('dotenv');
dotenv.config({ path: __dirname + './../config/.env' });

module.exports = {
    uri: process.env.MONGODB_URI,
    dbName: process.env.DB_NAME,
    collectionName: process.env.COLLECTION_NAME,
};
