import multer from 'multer';
import mongoose from 'mongoose';

const MULTER_MESSAGES = {
    LIMIT_FILE_SIZE: 'Each image must be 5 MB or smaller',
    LIMIT_FILE_COUNT: 'You can upload at most 3 images',
    LIMIT_UNEXPECTED_FILE: 'Only JPEG, PNG or WebP images (max 3) are allowed',
};

// eslint-disable-next-line no-unused-vars
const errorHandlingMiddleware = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: MULTER_MESSAGES[err.code] || err.message });
    }
    if (err instanceof mongoose.Error.ValidationError) {
        const first = Object.values(err.errors)[0];
        return res.status(400).json({ message: first?.message || 'Invalid data' });
    }
    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({ message: `Invalid ${err.path}` });
    }
    if (err?.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Malformed JSON body' });
    }

    console.error(err);
    res.status(err.status || 500).json({ message: err.expose ? err.message : 'Internal Server Error' });
};

export default errorHandlingMiddleware;
