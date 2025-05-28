import express from 'express';
import { createTransaction } from '../controllers/transactionController.js';

const router = express.Router();

// POST /api/transactions
router.post('/', createTransaction);

export default router; 