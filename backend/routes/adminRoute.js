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
  getSystemHealth,
  verifyUser
} from '../controllers/adminController.js';
import * as userController from '../controllers/userController.js';
import * as adminController from '../controllers/adminController.js';
import { protect } from '../middleware/authmiddleware.js';
import {
  createRequest,
  getAllPending,
  acceptRequest,
  rejectRequest,
  getRequestDetails
} from '../controllers/roomAvailabilityRequestController.js';

const router = express.Router();

router.get('/stats', getAdminStats);

router.get('/appointments', fetchAllAppointments);
router.put('/appointments/status', updateAppointmentStatus);

router.get('/users', userController.getAllUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.put('/users/:id/verify', verifyUser);

router.post('/rooms/make-available-request', createRequest);
router.get('/room-availability-requests', getAllPending);
router.post('/room-availability-requests/:id/accept', acceptRequest);
router.post('/room-availability-requests/:id/reject', rejectRequest);
router.get('/room-availability-requests/:id', getRequestDetails);

export default router;