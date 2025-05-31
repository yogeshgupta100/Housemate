import express from 'express';
import * as authController from '../controllers/authController.js';
import { protect } from '../middleware/authmiddleware.js';
import * as roleController from "../controllers/roleController.js";
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin', authController.adminLogin);

router.get('/me',protect, authController.getCurrentUser);
router.put('/profile',protect, authController.updateProfile);
router.put('/password', authController.updatePassword);

router.get('/get-roles', roleController.getRoles);
router.get('/get-all-roles', roleController.getAllRoles);
router.post('/assign', protect, roleController.assignRole);

router.post('/reset-password', authController.resetPassword);

export default router;