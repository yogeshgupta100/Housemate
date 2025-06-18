import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { forgotPasswordWithOTP } from '../controllers/userController.js';

const router = express.Router();

router.use(protect);

router.get('/search', userController.searchUsers);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', authorize(['admin']), userController.deleteUser);
router.post('/forgot', forgotPasswordWithOTP);

export default router;
