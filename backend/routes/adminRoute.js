import express from 'express';
import { 
  getAdminStats,
  fetchAllAppointments,
  updateAppointmentStatus,
  getUsers,
  getUser,
  updateUserDetails,
  removeUser,
  getProperties,
  getProperty,
  updatePropertyDetails,
  removeProperty,
  getAppointment,
  updateAppointmentDetails,
  removeAppointment,
  getStats,
  getAdminDashboard,
  getPropertyAnalytics,
  getUserAnalytics,
  getRevenueAnalytics,
  getSystemHealth
} from '../controllers/adminController.js';
import * as userController from '../controllers/userController.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

// Stats routes
router.get('/stats', getAdminStats);

// Appointment routes
router.get('/appointments', fetchAllAppointments);
router.put('/appointments/status', updateAppointmentStatus);

router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

export default router;