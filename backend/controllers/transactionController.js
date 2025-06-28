import TransactionModel from '../models/Transaction.js';
import userRepository from '../repositories/userRepository.js';
import pool from '../config/postgres.js';

export const createTransaction = async (req, res) => {
  try {
    const { property_id, floor_id, room_id, user_id, move_in_date, status } = req.body;
    if (!property_id || !room_id || !user_id) {
      return res.status(400).json({ success: false, message: 'property_id, room_id, and user_id are required.' });
    }
    
    const { rows: [transaction] } = await pool.query(
      `INSERT INTO transactions (
        property_id, floor_id, room_id, user_id, 
        move_in_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [property_id, floor_id, room_id, user_id, move_in_date, status || 'pending']
    );
    
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
    const { rows: transactions } = await pool.query(
      `SELECT t.*, 
        p.title as property_title,
        u.first_name, u.last_name, u.email,
        r.room_number
       FROM transactions t
       LEFT JOIN properties p ON t.property_id = p.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN rooms r ON t.room_id = r.id
       ORDER BY t.created_at DESC`
    );
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: [transaction] } = await pool.query(
      `SELECT t.*, 
        p.title as property_title,
        u.first_name, u.last_name, u.email,
        r.room_number
       FROM transactions t
       LEFT JOIN properties p ON t.property_id = p.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN rooms r ON t.room_id = r.id
       WHERE t.id = $1`,
      [id]
    );
    
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
    const { rows: transactions } = await pool.query(
      `SELECT t.*, 
        p.title as property_title,
        u.first_name, u.last_name, u.email,
        r.room_number
       FROM transactions t
       LEFT JOIN properties p ON t.property_id = p.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN rooms r ON t.room_id = r.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const mapTenantToRoom = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { room_id, user_id, move_in_date, rent_amount, deposit_amount } = req.body;

    // Check if user exists
    const { rows: [user] } = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [user_id]
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get room and floor details
    const { rows: [room] } = await client.query(
      `SELECT r.*, f.property_id, f.id as floor_id 
       FROM rooms r 
       JOIN floors f ON r.floor_id = f.id 
       WHERE r.id = $1`,
      [room_id]
    );

    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    // Check if room is already occupied
    if (room.occupied >= room.capacity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room is already at full capacity' 
      });
    }

    // Use provided rent_amount or room's default rent
    const finalRentAmount = rent_amount || room.rent_amount || 0;
    const finalDepositAmount = deposit_amount || room.rent_amount || 0;

    // Create transaction
    const { rows: [transaction] } = await client.query(
      `INSERT INTO transactions (
        property_id, floor_id, room_id, user_id, 
        move_in_date, status, rent_amount, deposit_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        room.property_id,
        room.floor_id,
        room.id,
        user.id,
        move_in_date || new Date(),
        'active',
        finalRentAmount,
        finalDepositAmount
      ]
    );

    // Update room occupied count
    await client.query(
      'UPDATE rooms SET occupied = occupied + 1 WHERE id = $1',
      [room_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ 
      success: true, 
      message: 'Tenant mapped to room successfully',
      transaction,
      room_details: {
        rent_amount: finalRentAmount,
        deposit_amount: finalDepositAmount
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error mapping tenant to room:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to map tenant to room' 
    });
  } finally {
    client.release();
  }
};