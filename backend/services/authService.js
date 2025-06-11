import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/postgres.js';
import otpRepository from '../repositories/otpRepository.js';

class AuthService {
  async register(userData) {
    const client = await pool.connect();
    try {
      // Check for duplicate email
      const { rows: existingEmail } = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingEmail.length > 0) {
        throw new Error('Email already registered');
      }

      // Check for duplicate phone
      const { rows: existingPhone } = await client.query(
        'SELECT * FROM users WHERE phone = $1',
        [userData.phone]
      );

      if (existingPhone.length > 0) {
        throw new Error('Phone number already registered');
      }

      const { rows: role } = await client.query(
        'SELECT * FROM roles WHERE id = $1',
        [userData.role]
      );

      if (!role.length) {
        throw new Error('Invalid role ID');
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

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

  async login(identifier, password) {
    const client = await pool.connect();
    try {
      const isEmail = identifier.includes('@');
      const query = isEmail 
        ? 'SELECT * FROM users WHERE email = $1'
        : 'SELECT * FROM users WHERE phone = $1';

      const { rows: [user] } = await client.query(query, [identifier]);

      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      console.log({isMatch});
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

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

      // Handle bank_details separately since it's JSONB
      if (updateData.bank_details) {
        // Check if bank_details is already a string
        if (typeof updateData.bank_details === 'string') {
          try {
            // Try to parse it to validate it's proper JSON
            JSON.parse(updateData.bank_details);
          } catch (e) {
            // If parsing fails, stringify it
            updateData.bank_details = JSON.stringify(updateData.bank_details);
          }
        } else {
          // If it's an object, stringify it
          updateData.bank_details = JSON.stringify(updateData.bank_details);
        }
      }

      // Handle id_card_images separately since it's an array
      if (updateData.id_card_images) {
        // If it's already a string, try to parse it
        if (typeof updateData.id_card_images === 'string') {
          try {
            const parsed = JSON.parse(updateData.id_card_images);
            updateData.id_card_images = `{${parsed.map(url => `"${url}"`).join(',')}}`;
          } catch (e) {
            // If parsing fails, assume it's already in PostgreSQL array format
            // Just ensure it's properly formatted
            if (!updateData.id_card_images.startsWith('{')) {
              updateData.id_card_images = `{${updateData.id_card_images}}`;
            }
          }
        } else {
          // If it's an array, convert to PostgreSQL array format
          updateData.id_card_images = `{${updateData.id_card_images.map(url => `"${url}"`).join(',')}}`;
        }
      }

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
         RETURNING id, first_name, last_name, email, phone, gender, role_id, user_type, company_name, city, state, bio, profile_image, marital_status, govt_id_number, id_card_images, verification_status, profession, nationality, bank_details, created_at, updated_at`,
        values
      );

      // Parse JSON fields back to objects
      if (user.bank_details) {
        try {
          user.bank_details = JSON.parse(user.bank_details);
        } catch (e) {
          // If parsing fails, keep it as is
          console.warn('Failed to parse bank_details:', e);
        }
      }

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
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

      await client.query(
        'UPDATE users SET reset_password_token = $1, reset_password_expire = $2 WHERE id = $3',
        [user.resetPasswordToken, user.resetPasswordExpire, user.id]
      );

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message: `You requested a password reset. Please go to: ${resetUrl}`
      });
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async resetPasswordWithOTP(identifier, otp, newPassword) {
    const client = await pool.connect();
    try {
      const isVerified = await otpRepository.verifyOTP(identifier, otp);
      if (!isVerified) {
        throw new Error('Invalid or expired OTP');
      }

      const isEmail = identifier.includes('@');
      const { rows: [user] } = await client.query(
        `SELECT * FROM users WHERE ${isEmail ? 'email' : 'phone'} = $1`,
        [identifier]
      );
      if (!user) throw new Error('User not found');

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await client.query(
        `UPDATE users SET password = $1, password_changed_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [hashedPassword, user.id]
      );
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
