import express from "express";
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactionsByUser,
  mapTenantToRoom,
  getUserRentedProperties,
  checkoutFromProperty,
  adminCheckoutTenant,
  getAllActiveTransactions,
} from "../controllers/transactionController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);

// Transaction CRUD operations
router.post("/", createTransaction);
router.get("/", getAllTransactions);
router.get("/:id", getTransactionById);
router.get("/user/:userId", getTransactionsByUser);

// Rented properties and checkout
router.get("/rented-properties/me", getUserRentedProperties);
router.post("/checkout/:transactionId", checkoutFromProperty);

// Admin routes
router.get("/admin/active-transactions", getAllActiveTransactions);
router.post("/admin/checkout/:transactionId", adminCheckoutTenant);

// Room mapping
router.post("/map-tenant", mapTenantToRoom);

export default router;
