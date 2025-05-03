import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/userModel.js';
import Role from "../models/role.js";

class AuthService {
  async register(userData) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    try {
      const defaultRole = await Role.findOne({ name: 'individual' });
      if (!defaultRole) {
        throw new Error('Default role not found');
      }

      const user = await User.create({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        gender: userData.gender,
        role: defaultRole._id,
        companyName: userData.companyName,
        registrationNumber: userData.registrationNumber,
        dealerLicense: userData.dealerLicense
      });

      const token = this.generateToken(user._id);

      return { user, token };
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        throw new Error(messages.join(', '));
      }
      throw error;
    }
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('password');
    if (!user || !(await this.comparePasswords(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user._id);
    return { user, token };
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateProfile(userId, updateData) {
    const allowedUpdates = {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      phone: updateData.phone,
      gender: updateData.gender,
      address: {
        city: updateData.address?.city,
        state: updateData.address?.state
      },
      bio: updateData.bio
    };

    Object.keys(allowedUpdates).forEach(key =>
        allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    return await User.findByIdAndUpdate(
        userId,
        allowedUpdates,
        {
          new: true,
          runValidators: true
        }
    );
  }

  async updatePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!(await this.comparePasswords(currentPassword, user.password))) {
      throw new Error('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email });
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
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Password Reset Request',
    //   message: `You requested a password reset. Please go to: ${resetUrl}`
    // });
  }

  generateToken(userId) {
    return jwt.sign({ id: userId },
        process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
  }

  async comparePasswords(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }
}

export default new AuthService();
