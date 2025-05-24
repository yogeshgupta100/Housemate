import multer from 'multer';
import s3Service from '../services/s3Service.js';

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        console.log('File received:', file);
        // Accept PDFs and images
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            console.log('Invalid file type:', file.mimetype);
            cb(new Error('Only PDF and image files are allowed'), false);
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
    console.log('Upload endpoint hit');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    try {
        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Determine the prefix based on file type
        const prefix = req.file.mimetype === 'application/pdf' ? 'pg' : 'images';
        const key = s3Service.generateKey(req.file.originalname, prefix);
        console.log('Generated S3 key:', key);
        
        const result = await s3Service.uploadPDF(req.file, key);
        console.log('Upload result:', result);

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: result
        });
    } catch (error) {
        console.error('Error in upload:', error);
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