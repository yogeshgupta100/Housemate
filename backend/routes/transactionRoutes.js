import express from 'express';
import { createTransaction, getAllTransactions, getTransactionById } from '../controllers/transactionController.js';

const router = express.Router();

router.post('/', createTransaction);
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);

export default router;