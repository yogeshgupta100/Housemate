import TransactionModel from '../models/TransactionModel.js';

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