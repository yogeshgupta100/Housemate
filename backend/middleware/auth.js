import jwt from 'jsonwebtoken';
import pool from '../config/postgres.js';
import { AppError } from '../utils/error.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
      
      if (!rows[0]) {
        return next(new AppError('User not found', 404));
      }

      // Add user to request
      req.user = rows[0];
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token', 401));
      }
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Token expired', 401));
      }
      return next(new AppError('Not authorized to access this route', 401));
    }
  } catch (error) {
    console.error('Error in protect middleware:', error);
    next(error);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }
    
    if (!roles.includes(req.user.role_id)) {
      return next(new AppError(`User role ${req.user.role_id} is not authorized to access this route`, 403));
    }
    next();
  };
};

export const authenticate = {
  // This can be used for additional authentication methods if needed
  // For example: OAuth, social login, etc.
};