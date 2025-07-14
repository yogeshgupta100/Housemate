import TransactionModel from "../models/Transaction.js";
import userRepository from "../repositories/userRepository.js";
import pool from "../config/postgres.js";

export const createTransaction = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("body", req.body);
    const {
      property_id,
      floor_id,
      room_id,
      user_id,
      move_in_date,
      status,
      rent_amount,
      deposit_amount,
    } = req.body;
    if (!property_id || !room_id || !user_id) {
      return res.status(400).json({
        success: false,
        message: "property_id, room_id, and user_id are required.",
      });
    }

    // Application-level check for existing active transaction (not pending)
    const { rows: existing } = await client.query(
      `SELECT * FROM transactions WHERE property_id = $1 AND floor_id = $2 AND room_id = $3 AND user_id = $4 AND status = 'active'`,
      [property_id, floor_id, room_id, user_id]
    );
    if (existing.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "An active transaction already exists for this user and room.",
      });
    }

    // Delete all pending transactions for this room (to allow new bookings)
    await client.query(
      `DELETE FROM transactions WHERE property_id = $1 AND floor_id = $2 AND room_id = $3 AND status = 'pending'`,
      [property_id, floor_id, room_id]
    );

    // Check if room is available (only count active transactions)
    const { rows: activeTransactions } = await client.query(
      `SELECT COUNT(*) as active_count FROM transactions WHERE property_id = $1 AND floor_id = $2 AND room_id = $3 AND status = 'active'`,
      [property_id, floor_id, room_id]
    );

    const {
      rows: [room],
    } = await client.query(`SELECT * FROM rooms WHERE id = $1`, [room_id]);

    if (!room) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (Number(activeTransactions[0].active_count) >= room.capacity) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Room is already at full capacity",
      });
    }

    const {
      rows: [transaction],
    } = await client.query(
      `INSERT INTO transactions (
        property_id, floor_id, room_id, user_id, 
        move_in_date, status, rent_amount, deposit_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        property_id,
        floor_id,
        room_id,
        user_id,
        move_in_date,
        status || "pending",
        rent_amount,
        deposit_amount,
      ]
    );

    // Note: We do NOT increase room occupancy here for pending transactions
    // Room occupancy will be increased only when transaction becomes 'active' after payment

    await client.query("COMMIT");
    res.status(201).json({ success: true, transaction });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      // unique violation
      return res.status(409).json({
        success: false,
        message: "Transaction already exists for this user and room.",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
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
    const {
      rows: [transaction],
    } = await pool.query(
      `SELECT t.*, 
        p.title as property_title,
        u.first_name, u.last_name, u.email,
        r.room_number,
        owner.first_name as owner_first_name,
        owner.last_name as owner_last_name,
        owner.email as owner_email,
        owner.phone as owner_phone
       FROM transactions t
       LEFT JOIN properties p ON t.property_id = p.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN rooms r ON t.room_id = r.id
       LEFT JOIN users owner ON p.user_id = owner.id
       WHERE t.id = $1`,
      [id]
    );

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

// Get all transactions for a specific user
export const getTransactionsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rows: transactions } = await pool.query(
      `SELECT t.*, 
        p.title as property_title,
        u.first_name, u.last_name, u.email,
        r.room_number , images , listing_type
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

// Get user's rented properties (active transactions)
export const getUserRentedProperties = async (req, res) => {
  try {
    const userId = req.user.id; // Get from authenticated user

    const { rows: rentedProperties } = await pool.query(
      `SELECT 
        t.id as transaction_id,
        t.move_in_date,
        t.status as transaction_status,
        t.rent_amount,
        t.deposit_amount,
        t.created_at as rented_at,
        p.id as property_id,
        p.title as property_title,
        p.images as property_images,
        p.location as property_location,
        p.city as property_city,
        p.state as property_state,
        p.type as property_type,
        p.price as property_price,
        f.floor_number,
        r.id as room_id,
        r.room_number,
        r.capacity,
        r.rent_amount as room_rent,
        r.description as room_description,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.email as owner_email,
        u.phone as owner_phone
       FROM transactions t
       JOIN properties p ON t.property_id = p.id
       JOIN floors f ON t.floor_id = f.id
       JOIN rooms r ON t.room_id = r.id
       JOIN users u ON p.user_id = u.id
       WHERE t.user_id = $1 AND t.status = 'active'
       ORDER BY t.created_at DESC`,
      [userId]
    );

    // Format the response
    const formattedProperties = rentedProperties.map((property) => ({
      transactionId: property.transaction_id,
      propertyId: property.property_id,
      propertyTitle: property.property_title,
      propertyImages: property.property_images || [],
      propertyLocation: property.property_location,
      propertyCity: property.property_city,
      propertyState: property.property_state,
      propertyType: property.property_type,
      propertyPrice: property.property_price,
      floorNumber: property.floor_number,
      roomId: property.room_id,
      roomNumber: property.room_number,
      roomCapacity: property.capacity,
      roomRent: property.room_rent,
      roomDescription: property.room_description,
      moveInDate: property.move_in_date,
      rentAmount: property.rent_amount,
      depositAmount: property.deposit_amount,
      rentedAt: property.rented_at,
      transactionStatus: property.transaction_status,
      owner: {
        firstName: property.owner_first_name,
        lastName: property.owner_last_name,
        email: property.owner_email,
        phone: property.owner_phone,
      },
    }));

    res.status(200).json({
      success: true,
      rentedProperties: formattedProperties,
    });
  } catch (error) {
    console.error("Error fetching user rented properties:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Checkout from a rented property
export const checkoutFromProperty = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { transactionId } = req.params;
    const userId = req.user.id;

    // Verify the transaction belongs to the user
    const {
      rows: [transaction],
    } = await client.query(
      `SELECT t.*, r.id as room_id, r.occupied
       FROM transactions t
       JOIN rooms r ON t.room_id = r.id
       WHERE t.id = $1 AND t.user_id = $2 AND t.status = 'active'`,
      [transactionId, userId]
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message:
          "Transaction not found or you are not authorized to checkout from this property",
      });
    }

    // Update transaction status to 'completed' (checkout)
    await client.query(
      `UPDATE transactions 
       SET status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [transactionId]
    );

    // Decrease room occupancy by 1
    await client.query(
      `UPDATE rooms 
       SET occupied = GREATEST(0, occupied - 1), updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [transaction.room_id]
    );

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Successfully checked out from the property",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during checkout:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

// Admin checkout - allows admin to checkout any tenant from any room
export const adminCheckoutTenant = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { transactionId } = req.params;
    const adminId = req.user.id;

    // Verify the transaction exists and is active
    const {
      rows: [transaction],
    } = await client.query(
      `SELECT t.*, r.id as room_id, r.occupied, r.room_number, f.floor_number, p.title as property_title,
              u.first_name, u.last_name, u.email
       FROM transactions t
       JOIN rooms r ON t.room_id = r.id
       JOIN floors f ON r.floor_id = f.id
       JOIN properties p ON f.property_id = p.id
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1 AND t.status = 'active'`,
      [transactionId]
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found or is not active",
      });
    }

    // Update transaction status to 'completed' (checkout)
    await client.query(
      `UPDATE transactions 
       SET status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [transactionId]
    );

    // Decrease room occupancy by 1
    await client.query(
      `UPDATE rooms 
       SET occupied = GREATEST(0, occupied - 1), updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [transaction.room_id]
    );

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: `Successfully checked out ${transaction.first_name} ${transaction.last_name} from ${transaction.property_title} - Room ${transaction.room_number} (Floor ${transaction.floor_number})`,
      checkoutDetails: {
        tenantName: `${transaction.first_name} ${transaction.last_name}`,
        tenantEmail: transaction.email,
        propertyTitle: transaction.property_title,
        roomNumber: transaction.room_number,
        floorNumber: transaction.floor_number,
        checkoutDate: new Date().toISOString(),
        checkedOutBy: adminId,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during admin checkout:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

// Get all active transactions for admin view
export const getAllActiveTransactions = async (req, res) => {
  try {
    const { rows: activeTransactions } = await pool.query(
      `SELECT 
        t.id as transaction_id,
        t.move_in_date,
        t.status as transaction_status,
        t.rent_amount,
        t.deposit_amount,
        t.created_at as rented_at,
        p.id as property_id,
        p.title as property_title,
        p.location as property_location,
        p.city as property_city,
        p.state as property_state,
        p.type as property_type,
        f.floor_number,
        r.id as room_id,
        r.room_number,
        r.capacity,
        r.rent_amount as room_rent,
        r.description as room_description,
        u.id as tenant_id,
        u.first_name as tenant_first_name,
        u.last_name as tenant_last_name,
        u.email as tenant_email,
        u.phone as tenant_phone,
        owner.first_name as owner_first_name,
        owner.last_name as owner_last_name,
        owner.email as owner_email,
        owner.phone as owner_phone
       FROM transactions t
       JOIN properties p ON t.property_id = p.id
       JOIN floors f ON t.floor_id = f.id
       JOIN rooms r ON t.room_id = r.id
       JOIN users u ON t.user_id = u.id
       JOIN users owner ON p.user_id = owner.id
       WHERE t.status = 'active'
       ORDER BY t.created_at DESC`
    );

    // Format the response
    const formattedTransactions = activeTransactions.map((transaction) => ({
      transactionId: transaction.transaction_id,
      propertyId: transaction.property_id,
      propertyTitle: transaction.property_title,
      propertyLocation: transaction.property_location,
      propertyCity: transaction.property_city,
      propertyState: transaction.property_state,
      propertyType: transaction.property_type,
      floorNumber: transaction.floor_number,
      roomId: transaction.room_id,
      roomNumber: transaction.room_number,
      roomCapacity: transaction.capacity,
      roomRent: transaction.room_rent,
      roomDescription: transaction.room_description,
      moveInDate: transaction.move_in_date,
      rentAmount: transaction.rent_amount,
      depositAmount: transaction.deposit_amount,
      rentedAt: transaction.rented_at,
      transactionStatus: transaction.transaction_status,
      tenant: {
        id: transaction.tenant_id,
        firstName: transaction.tenant_first_name,
        lastName: transaction.tenant_last_name,
        email: transaction.tenant_email,
        phone: transaction.tenant_phone,
      },
      owner: {
        firstName: transaction.owner_first_name,
        lastName: transaction.owner_last_name,
        email: transaction.owner_email,
        phone: transaction.owner_phone,
      },
    }));

    res.status(200).json({
      success: true,
      activeTransactions: formattedTransactions,
    });
  } catch (error) {
    console.error("Error fetching active transactions:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const mapTenantToRoom = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { room_id, user_id, move_in_date, rent_amount, deposit_amount } =
      req.body;

    // Check if user exists
    const {
      rows: [user],
    } = await client.query("SELECT * FROM users WHERE id = $1", [user_id]);

    if (!user) {
      await client.query("ROLLBACK");
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
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Application-level check for existing active transaction (not pending)
    const { rows: existing } = await client.query(
      `SELECT * FROM transactions WHERE property_id = $1 AND floor_id = $2 AND room_id = $3 AND user_id = $4 AND status = 'active'`,
      [room.property_id, room.floor_id, room.id, user.id]
    );
    if (existing.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "An active transaction already exists for this user and room.",
      });
    }

    // Delete all pending transactions for this room (to allow new bookings)
    await client.query(
      `DELETE FROM transactions WHERE property_id = $1 AND floor_id = $2 AND room_id = $3 AND status = 'pending'`,
      [room.property_id, room.floor_id, room.id]
    );

    // Check if room is available (only count active transactions)
    const { rows: activeTransactions } = await client.query(
      `SELECT COUNT(*) as active_count FROM transactions WHERE property_id = $1 AND floor_id = $2 AND room_id = $3 AND status = 'active'`,
      [room.property_id, room.floor_id, room.id]
    );

    if (Number(activeTransactions[0].active_count) >= room.capacity) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Room is already at full capacity",
      });
    }

    // Use provided rent_amount or room's default rent
    const finalRentAmount = rent_amount || room.rent_amount || 0;
    const finalDepositAmount = deposit_amount || room.rent_amount || 0;

    // Create transaction
    const {
      rows: [transaction],
    } = await client.query(
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
        "active",
        finalRentAmount,
        finalDepositAmount,
      ]
    );

    // Update room occupied count (only for active transactions)
    await client.query(
      "UPDATE rooms SET occupied = occupied + 1 WHERE id = $1",
      [room_id]
    );

    await client.query("COMMIT");
    res.status(201).json({
      success: true,
      message: "Tenant mapped to room successfully",
      transaction,
      room_details: {
        rent_amount: finalRentAmount,
        deposit_amount: finalDepositAmount,
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

// Complete a pending transaction - redirect to payment
export const completeTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    // Verify the transaction belongs to the user and is pending
    const {
      rows: [transaction],
    } = await pool.query(
      `SELECT t.*, p.title as property_title, r.room_number
       FROM transactions t
       JOIN properties p ON t.property_id = p.id
       JOIN rooms r ON t.room_id = r.id
       WHERE t.id = $1 AND t.user_id = $2 AND t.status = 'pending'`,
      [transactionId, userId]
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message:
          "Transaction not found or you are not authorized to complete this transaction",
      });
    }

    // Check if room is still available
    const {
      rows: [room],
    } = await pool.query(`SELECT r.* FROM rooms r WHERE r.id = $1`, [
      transaction.room_id,
    ]);

    if (!room || room.occupied >= room.capacity) {
      return res.status(400).json({
        success: false,
        message: "Room is no longer available",
      });
    }

    // Return payment details for frontend to redirect to payment gateway
    const baseAmount =
      Number(transaction.rent_amount) + Number(transaction.deposit_amount);
    const adminCommission = baseAmount * 0.02; // 2% admin commission
    const razorpayFee = baseAmount * 0.025; // 2.5% Razorpay processing fee
    const subtotalWithFees = baseAmount + adminCommission + razorpayFee;
    const gst = subtotalWithFees * 0.18; // 18% GST on subtotal with fees
    const finalTotal = subtotalWithFees + gst;

    res.status(200).json({
      success: true,
      message: "Redirecting to payment gateway",
      paymentDetails: {
        transactionId: transaction.id,
        amount: finalTotal,
        baseAmount: baseAmount,
        adminCommission: adminCommission,
        razorpayFee: razorpayFee,
        subtotalWithFees: subtotalWithFees,
        gst: gst,
        propertyTitle: transaction.property_title,
        roomNumber: transaction.room_number,
        rentAmount: transaction.rent_amount,
        depositAmount: transaction.deposit_amount,
      },
    });
  } catch (error) {
    console.error("Error preparing transaction for payment:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel a pending transaction - delete from database
export const cancelTransaction = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { transactionId } = req.params;
    const userId = req.user.id;

    // Verify the transaction belongs to the user and is pending
    const {
      rows: [transaction],
    } = await client.query(
      `SELECT t.*
       FROM transactions t
       WHERE t.id = $1 AND t.user_id = $2 AND t.status = 'pending'`,
      [transactionId, userId]
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message:
          "Transaction not found or you are not authorized to cancel this transaction",
      });
    }

    // Delete the transaction from database
    // Note: We don't decrease room occupancy since pending transactions don't increase it
    await client.query(`DELETE FROM transactions WHERE id = $1`, [
      transactionId,
    ]);

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Transaction cancelled and removed successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error cancelling transaction:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

// Activate transaction after successful payment
export const activateTransaction = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { transactionId } = req.params;
    const userId = req.user.id;

    // Verify the transaction belongs to the user and is pending
    const {
      rows: [transaction],
    } = await client.query(
      `SELECT t.*, r.id as room_id, r.occupied, r.capacity
       FROM transactions t
       JOIN rooms r ON t.room_id = r.id
       WHERE t.id = $1 AND t.user_id = $2 AND t.status = 'pending'`,
      [transactionId, userId]
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message:
          "Transaction not found or you are not authorized to activate this transaction",
      });
    }

    // Check if room is still available
    if (transaction.occupied >= transaction.capacity) {
      return res.status(400).json({
        success: false,
        message: "Room is no longer available",
      });
    }

    // Update transaction status to 'active'
    await client.query(
      `UPDATE transactions 
       SET status = 'active', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [transactionId]
    );

    // Increase room occupancy (now that transaction is active)
    await client.query(
      `UPDATE rooms 
       SET occupied = occupied + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [transaction.room_id]
    );

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Transaction activated successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error activating transaction:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};
