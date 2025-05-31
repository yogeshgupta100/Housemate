import express from 'express';
import { createTransaction, getAllTransactions, getTransactionById, getTransactionsByUser } from '../controllers/transactionController.js';

const router = express.Router();

router.post('/', createTransaction);
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);
router.get('/user/:userId', getTransactionsByUser);

export default router;