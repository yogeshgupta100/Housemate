import pool from "../config/postgres.js";

const PaymentModel = {
  async create(data) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const {
        transaction_id,
        user_id,
        property_id,
        amount,
        currency = "INR",
        payment_method,
        payment_status = "pending",
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment_receipt_url,
        payment_notes,
        processed_by,
      } = data;

      const { rows } = await client.query(
        `INSERT INTO payments (
          transaction_id, user_id, property_id, amount, currency,
          payment_method, payment_status, razorpay_order_id,
          razorpay_payment_id, razorpay_signature, payment_receipt_url,
          payment_notes, processed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          transaction_id,
          user_id,
          property_id,
          amount,
          currency,
          payment_method,
          payment_status,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          payment_receipt_url,
          payment_notes,
          processed_by,
        ]
      );

      // Update transaction payment status
      await client.query(
        `UPDATE transactions SET
          payment_status = $1,
          payment_method = $2,
          payment_amount = $3,
          payment_date = CURRENT_TIMESTAMP,
          razorpay_order_id = $4,
          razorpay_payment_id = $5,
          payment_receipt_url = $6,
          payment_notes = $7,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [
          payment_status,
          payment_method,
          amount,
          razorpay_order_id,
          razorpay_payment_id,
          payment_receipt_url,
          payment_notes,
          transaction_id,
        ]
      );

      await client.query("COMMIT");
      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async findById(id) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `
        SELECT p.*, 
               t.status as transaction_status,
               u.first_name, u.last_name, u.email,
               prop.title as property_title
        FROM payments p
        LEFT JOIN transactions t ON p.transaction_id = t.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN properties prop ON p.property_id = prop.id
        WHERE p.id = $1
      `,
        [id]
      );

      return rows[0] || null;
    } finally {
      client.release();
    }
  },

  async findByTransactionId(transactionId) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `
        SELECT p.*, 
               t.status as transaction_status,
               u.first_name, u.last_name, u.email,
               prop.title as property_title
        FROM payments p
        LEFT JOIN transactions t ON p.transaction_id = t.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN properties prop ON p.property_id = prop.id
        WHERE p.transaction_id = $1
        ORDER BY p.created_at DESC
      `,
        [transactionId]
      );

      return rows;
    } finally {
      client.release();
    }
  },

  async findByUserId(userId) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `
        SELECT p.*, 
               t.status as transaction_status,
               u.first_name, u.last_name, u.email,
               prop.title as property_title
        FROM payments p
        LEFT JOIN transactions t ON p.transaction_id = t.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN properties prop ON p.property_id = prop.id
        WHERE p.user_id = $1
        ORDER BY p.created_at DESC
      `,
        [userId]
      );

      return rows;
    } finally {
      client.release();
    }
  },

  async findByRazorpayPaymentId(razorpayPaymentId) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `
        SELECT p.*, 
               t.status as transaction_status,
               u.first_name, u.last_name, u.email,
               prop.title as property_title
        FROM payments p
        LEFT JOIN transactions t ON p.transaction_id = t.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN properties prop ON p.property_id = prop.id
        WHERE p.razorpay_payment_id = $1
        ORDER BY p.created_at DESC
      `,
        [razorpayPaymentId]
      );

      return rows;
    } finally {
      client.release();
    }
  },

  async updateStatus(id, status, additionalData = {}) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const updateFields = [
        "payment_status = $1",
        "updated_at = CURRENT_TIMESTAMP",
      ];
      const values = [status, id];
      let paramCount = 2;

      // Add additional fields if provided
      if (additionalData.razorpay_payment_id) {
        updateFields.push(`razorpay_payment_id = $${++paramCount}`);
        values.splice(-1, 0, additionalData.razorpay_payment_id);
      }

      if (additionalData.razorpay_signature) {
        updateFields.push(`razorpay_signature = $${++paramCount}`);
        values.splice(-1, 0, additionalData.razorpay_signature);
      }

      if (additionalData.payment_receipt_url) {
        updateFields.push(`payment_receipt_url = $${++paramCount}`);
        values.splice(-1, 0, additionalData.payment_receipt_url);
      }

      if (additionalData.payment_notes) {
        updateFields.push(`payment_notes = $${++paramCount}`);
        values.splice(-1, 0, additionalData.payment_notes);
      }

      const { rows } = await client.query(
        `UPDATE payments SET ${updateFields.join(
          ", "
        )} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      // Update transaction payment status
      await client.query(
        `UPDATE transactions SET
          payment_status = $1,
          payment_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [status, rows[0].transaction_id]
      );

      await client.query("COMMIT");
      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async getAll(limit = 50, offset = 0) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `
        SELECT p.*, 
               t.status as transaction_status,
               u.first_name, u.last_name, u.email,
               prop.title as property_title
        FROM payments p
        LEFT JOIN transactions t ON p.transaction_id = t.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN properties prop ON p.property_id = prop.id
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
      `,
        [limit, offset]
      );

      return rows;
    } finally {
      client.release();
    }
  },

  async getPaymentStats() {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT 
          COUNT(*) as total_payments,
          COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_payments,
          COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
          COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_payments,
          SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_amount,
          AVG(CASE WHEN payment_status = 'completed' THEN amount ELSE NULL END) as avg_amount
        FROM payments
      `);

      return rows[0];
    } finally {
      client.release();
    }
  },
};

export default PaymentModel;
