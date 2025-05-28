import pool from "../config/postgres.js";

const createTransactionTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        floor_id INTEGER REFERENCES floors(id) ON DELETE SET NULL,
        room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        move_in_date DATE,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_room_transaction UNIQUE (property_id, floor_id, room_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_transactions_property_id ON transactions(property_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_room_id ON transactions(room_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    `);
  } catch (error) {
    console.error("Error creating transactions table:", error);
    throw error;
  }
};

createTransactionTable();

const TransactionModel = {
  async create(transactionData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { property_id, floor_id, room_id, user_id, move_in_date, status } = transactionData;
      const { rows } = await client.query(
        `INSERT INTO transactions (property_id, floor_id, room_id, user_id, move_in_date, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [property_id, floor_id, room_id, user_id, move_in_date, status || 'pending']
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
    const { rows } = await pool.query(
      `SELECT * FROM transactions WHERE id = $1`,
      [id]
    );
    return rows[0];
  },

  async findByUser(user_id) {
    const { rows } = await pool.query(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );
    return rows;
  },

  async findByRoom(room_id) {
    const { rows } = await pool.query(
      `SELECT * FROM transactions WHERE room_id = $1 ORDER BY created_at DESC`,
      [room_id]
    );
    return rows;
  },

  async updateStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE transactions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return rows[0];
  },

  async delete(id) {
    const { rows } = await pool.query(
      `DELETE FROM transactions WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0];
  },
};

export default TransactionModel; 