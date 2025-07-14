import express from "express";
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactionsByUser,
  mapTenantToRoom,
  updateExpiredTransactions,
} from "../controllers/transactionController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createTransaction);
router.get("/", getAllTransactions);
router.get("/:id", getTransactionById);
router.get("/user/:userId", getTransactionsByUser);
router.post("/map-tenant", mapTenantToRoom);
router.post("/update-expired", updateExpiredTransactions);

export default router;
