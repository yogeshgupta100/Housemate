import express from "express";
import { protect } from '../middleware/authmiddleware.js';
import {
  scheduleViewing,
  getAllAppointments,
  updateAppointmentStatus,
  getAppointmentsByUser,
  cancelAppointment,
  updateAppointmentMeetingLink,
  getAppointmentStats,
  submitAppointmentFeedback,
  getUpcomingAppointments
} from "../controllers/appointmentController.js";


const router = express.Router();

router.post("/schedule", protect, scheduleViewing);
router.get("/user", protect, getAppointmentsByUser);
router.get("/upcoming", protect, getUpcomingAppointments);

router.get("/all", protect, getAllAppointments);
router.put("/:id/status", protect, updateAppointmentStatus);
router.put("/:id/meeting-link", protect, updateAppointmentMeetingLink);
router.post("/:id/feedback", protect, submitAppointmentFeedback);
router.get("/stats", protect, getAppointmentStats);

export default router;