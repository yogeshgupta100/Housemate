import express from 'express';
import { uploadPDF, getPDFUrl, upload, handleMulterError } from '../controllers/pdfController.js';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'PDF routes are working' });
});

// Route to upload PDF
router.post('/upload', upload.single('pdf'), handleMulterError, uploadPDF);

// Route to get signed URL for a PDF
router.get('/url/:key', getPDFUrl);

export default router; 