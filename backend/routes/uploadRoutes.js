import express from 'express';
import { upload, handleMulterError } from '../controllers/pdfController.js';
import { protect } from '../middleware/authmiddleware.js';
import s3Service from '../services/s3Service.js';

const router = express.Router();

// Route to upload government ID
router.post('/govt-id', protect, upload.single('file'), handleMulterError, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Generate a unique key for the file
        const key = `govt-ids/${Date.now()}-${req.file.originalname}`;
        
        // Upload to S3
        const result = await s3Service.uploadPDF(req.file, key);
        
        res.status(200).json({
            success: true,
            url: result.url
        });
    } catch (error) {
        console.error('Error uploading government ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload government ID',
            error: error.message
        });
    }
});

// Route to upload profile image
router.post('/profile', protect, upload.single('file'), handleMulterError, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Generate a unique key for the file
        const key = `profile-images/${Date.now()}-${req.file.originalname}`;
        
        // Upload to S3
        const result = await s3Service.uploadPDF(req.file, key);
        
        res.status(200).json({
            success: true,
            url: result.url
        });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload profile image',
            error: error.message
        });
    }
});

export default router; 