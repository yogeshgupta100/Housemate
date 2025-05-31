import TransactionModel from '../models/Transaction.js';

export const createTransaction = async (req, res) => {
  try {
    const { property_id, floor_id, room_id, user_id, move_in_date, status } = req.body;
    if (!property_id || !room_id || !user_id) {
      return res.status(400).json({ success: false, message: 'property_id, room_id, and user_id are required.' });
    }
    const transaction = await TransactionModel.create({
      property_id,
      floor_id,
      room_id,
      user_id,
      move_in_date,
      status: status || 'pending',
    });
    res.status(201).json({ success: true, transaction });
  } catch (error) {
    if (error.code === '23505') { // unique violation
      return res.status(409).json({ success: false, message: 'Transaction already exists for this user and room.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await TransactionModel.find(); // You may want to join property/user info as well
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transactions = await TransactionModel.find();
    const transaction = transactions.find(t => t.id == id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.status(200).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all transactions for a specific user
export const getTransactionsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await TransactionModel.find();
    // Filter transactions by user_id
    const userTransactions = transactions.filter(t => t.user_id == userId);
    res.status(200).json({ success: true, transactions: userTransactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};