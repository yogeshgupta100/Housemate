import express from 'express';
import * as authController from '../controllers/authController.js';
import * as googleAuthController from '../controllers/googleAuthController.js';
import * as signupVerificationController from '../controllers/signupVerificationController.js';
import { protect } from '../middleware/authmiddleware.js';
import * as roleController from "../controllers/roleController.js";
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin', authController.adminLogin);

// Google OAuth routes
router.post('/google', googleAuthController.googleSignIn);
router.post('/verify-phone', protect, googleAuthController.verifyPhoneWithOTP);
router.post('/verify-email', protect, googleAuthController.verifyEmailWithOTP);

// Signup verification routes
router.post('/signup/send-email-otp', signupVerificationController.sendSignupEmailOTP);
router.post('/signup/send-phone-otp', signupVerificationController.sendSignupPhoneOTP);
router.post('/signup/verify-email-otp', signupVerificationController.verifySignupEmailOTP);
router.post('/signup/verify-phone-otp', signupVerificationController.verifySignupPhoneOTP);

router.get('/me',protect, authController.getCurrentUser);
router.put('/profile',protect, authController.updateProfile);
router.put('/password', authController.updatePassword);

router.get('/get-roles', roleController.getRoles);
router.get('/get-all-roles', roleController.getAllRoles);
router.post('/assign', protect, roleController.assignRole);

router.post('/reset-password', authController.resetPassword);

export default router;