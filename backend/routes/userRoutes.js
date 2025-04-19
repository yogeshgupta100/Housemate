import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const propertyRouter = express.Router();

router.use(authenticate); // Protect all routes

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', authorize(['admin']), userController.deleteUser);

export default propertyRouter;
