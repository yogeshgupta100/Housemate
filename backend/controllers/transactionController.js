import TransactionModel from "../models/Transaction.js";
import userRepository from "../repositories/userRepository.js";
import pool from "../config/postgres.js";
import { calculateLeaseEndDate } from "../utils/leaseUtils.js";

export const createTransaction = async (req, res) => {
  try {
    const {
      property_id,
      floor_id,
      room_id,
      user_id,
      move_in_date,
      status,
      lease_period,
    } = req.body;
    if (!property_id || !room_id || !user_id) {
      return res.status(400).json({
        success: false,
        message: "property_id, room_id, and user_id are required.",
      });
    }

    const transaction = await TransactionModel.create({
      property_id,
      floor_id,
      room_id,
      user_id,
      move_in_date,
      status: status || "pending",
      lease_period: lease_period || "11 months",
    });

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    if (error.code === "23505") {
      // unique violation
      return res.status(409).json({
        success: false,
        message: "Transaction already exists for this user and room.",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await TransactionModel.find();
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await TransactionModel.getById(id);

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all transactions for a specific user (filtered for non-expired and valid status)
export const getTransactionsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await TransactionModel.findByUserId(userId);

    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const mapTenantToRoom = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      room_id,
      user_id,
      move_in_date,
      rent_amount,
      deposit_amount,
      payment_method = "cash",
      lease_period = "11 months",
    } = req.body;

    // Check if user exists
    const {
      rows: [user],
    } = await client.query("SELECT * FROM users WHERE id = $1", [user_id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get room and floor details
    const {
      rows: [room],
    } = await client.query(
      `SELECT r.*, f.property_id, f.id as floor_id 
       FROM rooms r 
       JOIN floors f ON r.floor_id = f.id 
       WHERE r.id = $1`,
      [room_id]
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Check if room is already occupied
    if (room.occupied >= room.capacity) {
      return res.status(400).json({
        success: false,
        message: "Room is already at full capacity",
      });
    }

    // Use provided rent_amount or room's default rent
    const finalRentAmount = rent_amount || room.rent_amount || 0;
    const finalDepositAmount = deposit_amount || room.rent_amount || 0;
    const totalAmount = finalRentAmount + finalDepositAmount;

    // Calculate lease end date
    const lease_end_date = calculateLeaseEndDate(
      move_in_date || new Date(),
      lease_period
    );

    // Create transaction
    const {
      rows: [transaction],
    } = await client.query(
      `INSERT INTO transactions (
        property_id, floor_id, room_id, user_id, 
        move_in_date, status, rent_amount, deposit_amount,
        lease_period, lease_end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        room.property_id,
        room.floor_id,
        room.id,
        user.id,
        move_in_date || new Date(),
        "active",
        finalRentAmount,
        finalDepositAmount,
        lease_period,
        lease_end_date,
      ]
    );

    // Create cash payment record for admin mapping
    if (payment_method === "cash" && totalAmount > 0) {
      const {
        rows: [payment],
      } = await client.query(
        `INSERT INTO payments (
          transaction_id, user_id, property_id, amount, currency,
          payment_method, payment_status, payment_notes, processed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          transaction.id,
          user.id,
          room.property_id,
          totalAmount,
          "INR",
          "cash",
          "completed",
          `Cash payment for admin tenant mapping - Rent: ₹${finalRentAmount}, Deposit: ₹${finalDepositAmount}`,
          req.user.id, // Admin who processed the mapping
        ]
      );

      // Update transaction with payment details
      await client.query(
        `UPDATE transactions SET
          payment_status = 'completed',
          payment_method = 'cash',
          payment_amount = $1,
          payment_date = CURRENT_TIMESTAMP,
          payment_notes = $2,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [
          totalAmount,
          `Cash payment processed by admin - ${payment.id}`,
          transaction.id,
        ]
      );
    }

    // Update room occupied count
    await client.query(
      "UPDATE rooms SET occupied = occupied + 1 WHERE id = $1",
      [room_id]
    );

    await client.query("COMMIT");
    res.status(201).json({
      success: true,
      message: "Tenant mapped to room successfully with cash payment",
      transaction,
      room_details: {
        rent_amount: finalRentAmount,
        deposit_amount: finalDepositAmount,
        total_amount: totalAmount,
        payment_method: payment_method,
        lease_period: lease_period,
        lease_end_date: lease_end_date,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error mapping tenant to room:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to map tenant to room",
    });
  } finally {
    client.release();
  }
};

// Update expired transactions (can be called by a cron job)
export const updateExpiredTransactions = async (req, res) => {
  try {
    const updatedCount = await TransactionModel.updateExpiredStatus();
    res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} expired transactions`,
      updatedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update expired transactions",
    });
  }
};
