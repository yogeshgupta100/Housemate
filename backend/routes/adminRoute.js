import express from 'express';
import { 
  getAdminStats,
  getAllAppointments,
  updateAppointmentStatus 
} from '../controller/adminController.js';
import * as userController from '../controllers/userController.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

// Stats routes
router.get('/stats', getAdminStats);

// Appointment routes
router.get('/appointments', protect, getAllAppointments);
router.put('/appointments/status', protect, updateAppointmentStatus);

router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

export default router;