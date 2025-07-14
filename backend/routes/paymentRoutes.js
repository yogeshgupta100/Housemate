import express from "express";
import * as paymentController from "../controllers/paymentController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

// Webhook route (no authentication required - called by Razorpay)
router.post("/webhook", paymentController.handleWebhook);

// Protected routes (require authentication)
router.use(protect);

// Razorpay payment routes
router.post("/create-order", paymentController.createPaymentOrder);
router.post("/create-split-order", paymentController.createSplitPaymentOrder);
router.post("/verify", paymentController.verifyPayment);

// Payment history and details
router.get("/user-payments", paymentController.getUserPayments);
router.get("/payment/:paymentId", paymentController.getPaymentDetails);

// Admin routes
router.post("/cash-payment", paymentController.addCashPayment);
router.post("/transfer-to-owner", paymentController.transferToOwner);
router.get("/all-payments", paymentController.getAllPayments);
router.post("/refund", paymentController.refundPayment);

export default router;
