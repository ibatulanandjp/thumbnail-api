const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Storage for uploaded images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/uploads'));
    },
    filename: (req, file, cb) => {
        const imageName = `${uuidv4()}-${file.originalname}`;
        cb(null, imageName);
    },
});

// Filter to allow only image files
const fileFilter = (req, file, cb) => {
    try {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            throw new Error('Invalid file type. Only image files are allowed.');
        }
    } catch (error) {
        cb(error, false);
    }
};

// Multer instance
const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
