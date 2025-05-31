import express from 'express';
import { generateOTP, verifyOTP, cleanupExpiredOTPs } from '../controllers/otpController.js';

const router = express.Router();

router.post('/generate', generateOTP);

router.post('/verify', verifyOTP);

router.post('/cleanup', cleanupExpiredOTPs);

export default router; 