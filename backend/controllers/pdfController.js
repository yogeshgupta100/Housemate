import multer from 'multer';
import s3Service, { uploadToS3 } from '../services/s3Service.js';

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for videos, images, and PDFs (will check type below)
    },
    fileFilter: (req, file, cb) => {
        console.log('File received:', file);
        // Accept PDFs, images, and videos
        if (
            file.mimetype === 'application/pdf' ||
            file.mimetype.startsWith('image/') ||
            file.mimetype.startsWith('video/')
        ) {
            cb(null, true);
        } else {
            console.log('Invalid file type:', file.mimetype);
            cb(new Error('Only PDF, image, and video files are allowed'), false);
        }
    },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next(err);
};

export const uploadPDF = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const file = req.file;
        const folder = req.body.folder || 'documents';
        
        // Upload to S3 using the named export function
        const url = await uploadToS3(file, folder);
        
        res.status(200).json({
            success: true,
            url: url
        });
    } catch (error) {
        console.error('Error in uploadPDF:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to upload file',
            error: error.message 
        });
    }
};

export const getPDFUrl = async (req, res) => {
    try {
        const { key } = req.params;
        const signedUrl = await s3Service.getSignedUrl(key);
        
        res.status(200).json({
            success: true,
            signedUrl
        });
    } catch (error) {
        console.error('Error in getPDFUrl:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate signed URL',
            error: error.message
        });
    }
};

export { upload, handleMulterError }; 