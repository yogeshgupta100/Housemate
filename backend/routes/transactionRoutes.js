import express from 'express';
import { createTransaction, getAllTransactions, getTransactionById, getTransactionsByUser, mapTenantToRoom } from '../controllers/transactionController.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createTransaction);
router.post('/map-tenant', mapTenantToRoom);
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);
router.get('/user/:userId', getTransactionsByUser);

export default router;