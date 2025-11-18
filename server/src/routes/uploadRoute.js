import { Router } from 'express';
import { uploadMiddleware, uploadMap } from '../controllers/uploadController.js';

const uploadRoute = Router();

uploadRoute.post('/upload', (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File too large. Maximum size is 50MB' });
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, uploadMap);

export default uploadRoute;
