import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  updatePassword
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.use(protect);
router.get('/me', getCurrentUser);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);

export default router; 