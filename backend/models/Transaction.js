import pool from "../config/postgres.js";
import {
  calculateLeaseEndDate,
  isTransactionVisible,
} from "../utils/leaseUtils.js";

const TransactionModel = {
  async create(data) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const {
        property_id,
        floor_id,
        room_id,
        user_id,
        move_in_date,
        status,
        rent_amount,
        deposit_amount,
        lease_period = "11 months",
      } = data;

      // Calculate lease end date
      const lease_end_date = calculateLeaseEndDate(move_in_date, lease_period);

      const { rows } = await client.query(
        `INSERT INTO transactions
          (property_id, floor_id, room_id, user_id, move_in_date, status, 
           rent_amount, deposit_amount, lease_period, lease_end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          property_id,
          floor_id,
          room_id,
          user_id,
          move_in_date,
          status || "pending",
          rent_amount || 0,
          deposit_amount || 0,
          lease_period,
          lease_end_date,
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

  async find() {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT t.*, 
               p.title as property_title, 
               p.images as property_images, 
               p.location as property_location, 
               p.city as property_city, 
               p.state as property_state,
               p.price as property_price,
               u.id as seller_id,
               u.first_name as seller_first_name,
               u.last_name as seller_last_name,
               u.email as seller_email
        FROM transactions t
        JOIN properties p ON t.property_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE t.is_expired = false
        ORDER BY t.created_at DESC
      `);
      return rows.map((row) => ({
        ...row,
        amount: Number(row.property_price) || 0,
        property: {
          title: row.property_title,
          images: row.property_images,
          location: row.property_location,
          city: row.property_city,
          state: row.property_state,
        },
        seller: {
          id: row.seller_id,
          name: `${row.seller_first_name} ${row.seller_last_name}`,
          email: row.seller_email,
        },
      }));
    } finally {
      client.release();
    }
  },

  async update(id, data) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const {
        property_id,
        floor_id,
        room_id,
        user_id,
        move_in_date,
        status,
        rent_amount,
        deposit_amount,
        lease_period,
      } = data;

      // Calculate lease end date if move_in_date or lease_period changed
      let lease_end_date = null;
      if (move_in_date || lease_period) {
        const currentTransaction = await this.getById(id);
        const newMoveInDate = move_in_date || currentTransaction?.move_in_date;
        const newLeasePeriod = lease_period || currentTransaction?.lease_period;
        lease_end_date = calculateLeaseEndDate(newMoveInDate, newLeasePeriod);
      }

      const updateFields = [
        "property_id = $1",
        "floor_id = $2",
        "room_id = $3",
        "user_id = $4",
        "move_in_date = $5",
        "status = $6",
        "rent_amount = $7",
        "deposit_amount = $8",
        "updated_at = CURRENT_TIMESTAMP",
      ];

      const values = [
        property_id,
        floor_id,
        room_id,
        user_id,
        move_in_date,
        status,
        rent_amount || 0,
        deposit_amount || 0,
      ];

      if (lease_period) {
        updateFields.push("lease_period = $9");
        values.push(lease_period);
      }

      if (lease_end_date) {
        updateFields.push("lease_end_date = $" + (values.length + 1));
        values.push(lease_end_date);
      }

      values.push(id);

      const { rows } = await client.query(
        `UPDATE transactions SET ${updateFields.join(", ")} WHERE id = $${
          values.length
        } RETURNING *`,
        values
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

  async remove(id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `DELETE FROM transactions WHERE id = $1 RETURNING *`,
        [id]
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

  async getById(id) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `
        SELECT t.*, 
               p.title as property_title, 
               p.images as property_images, 
               p.location as property_location, 
               p.city as property_city, 
               p.state as property_state,
               p.price as property_price,
               u.id as seller_id,
               u.first_name as seller_first_name,
               u.last_name as seller_last_name,
               u.email as seller_email
        FROM transactions t
        JOIN properties p ON t.property_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE t.id = $1
      `,
        [id]
      );
      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        ...row,
        amount: Number(row.property_price) || 0,
        property: {
          title: row.property_title,
          images: row.property_images,
          location: row.property_location,
          city: row.property_city,
          state: row.property_state,
        },
        seller: {
          id: row.seller_id,
          name: `${row.seller_first_name} ${row.seller_last_name}`,
          email: row.seller_email,
        },
      };
    } finally {
      client.release();
    }
  },

  async findByUserId(userId) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `
        SELECT t.*, 
               p.title as property_title, 
               p.images as property_images, 
               p.location as property_location, 
               p.city as property_city, 
               p.state as property_state,
               p.price as property_price,
               p.listing_type as property_listing_type,
               u.id as seller_id,
               u.first_name as seller_first_name,
               u.last_name as seller_last_name,
               u.email as seller_email
        FROM transactions t
        JOIN properties p ON t.property_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE t.user_id = $1 AND t.is_expired = false
        ORDER BY t.created_at DESC
      `,
        [userId]
      );

      return rows
        .map((row) => ({
          ...row,
          amount: Number(row.property_price) || 0,
          property: {
            title: row.property_title,
            images: row.property_images,
            location: row.property_location,
            city: row.property_city,
            state: row.property_state,
            listing_type: row.property_listing_type,
          },
          seller: {
            id: row.seller_id,
            name: `${row.seller_first_name} ${row.seller_last_name}`,
            email: row.seller_email,
          },
        }))
        .filter((transaction) => isTransactionVisible(transaction));
    } finally {
      client.release();
    }
  },

  async updateExpiredStatus() {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rowCount } = await client.query(`
        UPDATE transactions 
        SET is_expired = true, 
            updated_at = CURRENT_TIMESTAMP
        WHERE lease_end_date < CURRENT_TIMESTAMP 
          AND is_expired = false
      `);

      await client.query("COMMIT");
      return rowCount;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};

export default TransactionModel;
