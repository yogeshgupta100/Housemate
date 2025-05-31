import pool from '../config/postgres.js';

class OTPRepository {
  async createOTP({ identifier, otp, type, expiresAt }) {
    const client = await pool.connect();
    try {
      await client.query(
        'DELETE FROM otps WHERE identifier = $1',
        [identifier]
      );

      const { rows } = await client.query(
        `INSERT INTO otps (identifier, otp, type, expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [identifier, otp, type, expiresAt]
      );

      return rows[0];
    } finally {
      client.release();
    }
  }

  async verifyOTP(identifier, otp) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT * FROM otps 
         WHERE identifier = $1 
         AND otp = $2 
         AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [identifier, otp]
      );

      if (rows.length > 0) {
        await client.query(
          'DELETE FROM otps WHERE id = $1',
          [rows[0].id]
        );
        return true;
      }
      return false;
    } finally {
      client.release();
    }
  }

  async cleanupExpiredOTPs() {
    const client = await pool.connect();
    try {
      await client.query(
        'DELETE FROM otps WHERE expires_at <= NOW()'
      );
    } finally {
      client.release();
    }
  }
}

export default new OTPRepository(); 