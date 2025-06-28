import pool from '../config/postgres.js';

const TransactionModel = {
  async create(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { property_id, floor_id, room_id, user_id, move_in_date, status, rent_amount, deposit_amount } = data;
      const { rows } = await client.query(
        `INSERT INTO transactions
          (property_id, floor_id, room_id, user_id, move_in_date, status, rent_amount, deposit_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          property_id,
          floor_id,
          room_id,
          user_id,
          move_in_date,
          status || 'pending',
          rent_amount || 0,
          deposit_amount || 0
        ]
      );
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
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
      `);
      return rows.map(row => ({
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
        }
      }));
    } finally {
      client.release();
    }
  },

  async update(id, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { property_id, floor_id, room_id, user_id, move_in_date, status, rent_amount, deposit_amount } = data;
      const { rows } = await client.query(
        `UPDATE transactions SET
          property_id = $1,
          floor_id = $2,
          room_id = $3,
          user_id = $4,
          move_in_date = $5,
          status = $6,
          rent_amount = $7,
          deposit_amount = $8,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $9
         RETURNING *`,
        [
          property_id,
          floor_id,
          room_id,
          user_id,
          move_in_date,
          status,
          rent_amount || 0,
          deposit_amount || 0,
          id
        ]
      );
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async remove(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `DELETE FROM transactions WHERE id = $1 RETURNING *`,
        [id]
      );
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getById(id) {
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
        WHERE t.id = $1
      `, [id]);
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
        }
      };
    } finally {
      client.release();
    }
  }
};

export default TransactionModel; 