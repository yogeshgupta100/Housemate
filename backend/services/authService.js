import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import userRepository from '../repositories/userRepository.js';
import sendEmail from '../utils/sendEmail.js';

class AuthService {
  async register(userData) {
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const user = await userRepository.create(userData);
    const token = this.generateToken(user._id);

    return { user, token };
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user || !(await this.comparePasswords(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user._id);
    return { user, token };
  }

  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateProfile(userId, updateData) {
    return await userRepository.update(userId, updateData);
  }

  async updatePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!(await this.comparePasswords(currentPassword, user.password))) {
      throw new Error('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send email with reset token
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message: `You requested a password reset. Please go to: ${resetUrl}`
    });
  }

  generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });
  }

  async comparePasswords(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }
}

export default new AuthService();
