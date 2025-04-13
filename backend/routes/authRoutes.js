import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.use(authController.protect);
router.get('/me', authController.getCurrentUser);
router.put('/profile', authController.updateProfile);
router.put('/password', authController.updatePassword);

export default router;