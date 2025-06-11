import pool from '../config/postgres.js';
import bcrypt from 'bcrypt';

class UserRepository {
  async findAll() {
    const { rows } = await pool.query('SELECT id, first_name, last_name, email, phone, gender, role_id, user_type, company_name, city, state, bio, profile_image, marital_status, govt_id_number, id_card_images, verification_status, profession, nationality, bank_details, created_at, updated_at FROM users');
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, first_name, last_name, email, phone, gender, role_id, user_type, company_name, city, state, bio, profile_image, marital_status, govt_id_number, id_card_images, verification_status, profession, nationality, bank_details, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0];
  }

  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0];
  }

  async create(userData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const { rows } = await client.query(
        `INSERT INTO users (
          first_name, last_name, email, password, phone, gender,
          role_id, user_type, company_name, registration_number,
          dealer_license, city, state, bio, marital_status,
          govt_id_number, id_card_images, verification_status,
          profession, nationality, bank_details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING id, first_name, last_name, email, phone, gender, role_id, user_type, company_name, city, state, bio, profile_image, marital_status, govt_id_number, id_card_images, verification_status, profession, nationality, bank_details, created_at, updated_at`,
        [
          userData.firstName,
          userData.lastName,
          userData.email,
          hashedPassword,
          userData.phone,
          userData.gender,
          userData.role,
          userData.userType,
          userData.companyName,
          userData.registrationNumber,
          userData.dealerLicense,
          userData.address?.city,
          userData.address?.state,
          userData.bio,
          userData.maritalStatus,
          userData.govtIdNumber,
          userData.idCardImages || [],
          userData.verificationStatus || 'pending',
          userData.profession,
          userData.nationality,
          userData.bankDetails ? JSON.stringify(userData.bankDetails) : null
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
  }

  async update(id, updateData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { rows: [existingUser] } = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );

      if (!existingUser) {
        await client.query('ROLLBACK');
        return null;
      }

      const convertedUpdateData = {};
      for (const [key, value] of Object.entries(updateData)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        convertedUpdateData[snakeKey] = value;
      }

      // Only update the fields that are provided in updateData
      const setClause = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(convertedUpdateData)) {
        if (value !== undefined) {
          setClause.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (setClause.length === 0) return existingUser;

      values.push(id);
      const { rows } = await client.query(
        `UPDATE users 
         SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}
         RETURNING id, first_name, last_name, email, phone, gender, role_id, user_type, company_name, city, state, bio, profile_image, marital_status, govt_id_number, id_card_images, verification_status, profession, nationality, bank_details, created_at, updated_at`,
        values
      );
      
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id) {
    const { rows } = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0];
  }

  async findByResetPasswordToken(token) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expire > CURRENT_TIMESTAMP',
      [token]
    );
    return rows[0];
  }
}

export default new UserRepository();
