import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/userModel.js';
import pool from '../config/postgres.js';

class AuthService {
  async register(userData) {
    const client = await pool.connect();
    try {
      // Check if user exists
      const { rows: existingUser } = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUser.length > 0) {
        throw new Error('Email already registered');
      }

      // Get role by ID
      const { rows: role } = await client.query(
        'SELECT * FROM roles WHERE id = $1',
        [userData.role]
      );

      if (!role.length) {
        throw new Error('Invalid role ID');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Insert user
      const { rows: [user] } = await client.query(
        `INSERT INTO users (
          first_name, last_name, email, password, phone, gender,
          role_id, user_type, company_name, registration_number,
          dealer_license
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          userData.firstName,
          userData.lastName,
          userData.email,
          hashedPassword,
          userData.phone,
          userData.gender,
          userData.role,
          userData.userType || 'individual',
          userData.companyName,
          userData.registrationNumber,
          userData.dealerLicense
        ]
      );

      const token = this.generateToken(user.id);
      return { user, token };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async login(email, password) {
    const client = await pool.connect();
    try {
      const { rows: [user] } = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await client.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      const token = this.generateToken(user.id);
      return { user, token };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async getCurrentUser(userId) {
    const client = await pool.connect();
    try {
      const { rows: [user] } = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async updateProfile(userId, updateData) {
    const client = await pool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          setClause.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (setClause.length === 0) return null;

      values.push(userId);
      const { rows: [user] } = await client.query(
        `UPDATE users 
         SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      return user;
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePassword(userId, currentPassword, newPassword) {
    const client = await pool.connect();
    try {
      const { rows: [user] } = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (!user) {
        throw new Error('User not found');
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await client.query(
        `UPDATE users 
         SET password = $1, password_changed_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [hashedPassword, userId]
      );
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async forgotPassword(email) {
    const client = await pool.connect();
    try {
      const { rows: [user] } = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (!user) {
        throw new Error('User not found');
      }

      const resetToken = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

      await client.query(
        'UPDATE users SET reset_password_token = $1, reset_password_expire = $2 WHERE id = $3',
        [user.resetPasswordToken, user.resetPasswordExpire, user.id]
      );

      // Send email with reset token
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      // await sendEmail({
      //   email: user.email,
      //   subject: 'Password Reset Request',
      //   message: `You requested a password reset. Please go to: ${resetUrl}`
      // });
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
  }
}

export default new AuthService();
