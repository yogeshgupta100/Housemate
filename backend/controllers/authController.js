import authService from '../services/authService.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/postgres.js';

export const register = async (req, res) => {
  try {
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'phone'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const { user, token } = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          user_type: user.user_type,
          role_id: user.role_id
        },
        token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either email or phone number and password'
      });
    }

    const { user, token } = await authService.login(identifier, password);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          user_type: user.user_type,
          role_id: user.role_id
        },
        token
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updatePassword = async (req, res) => {
  try {
    await authService.updatePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    await authService.resetPassword(req.params.token, req.body.password);
    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user with admin role
    const { rows: [user] } = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role_id = 5',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role_id: user.role_id
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};