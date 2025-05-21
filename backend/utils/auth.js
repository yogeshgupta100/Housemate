import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { isValidPassword } from './validators.js';

/**
 * Generates a JWT token for a user
 * @param {Object} user - The user object
 * @returns {string} The generated JWT token
 */
export const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id,
            email: user.email,
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

/**
 * Verifies a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Object} The decoded token payload
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

/**
 * Hashes a password using bcrypt
 * @param {string} password - The password to hash
 * @returns {Promise<string>} The hashed password
 */
export const hashPassword = async (password) => {
    if (!isValidPassword(password)) {
        throw new Error('Password does not meet requirements');
    }
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * Compares a password with a hashed password
 * @param {string} password - The plain text password
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
export const comparePasswords = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};

/**
 * Extracts the token from the Authorization header
 * @param {string} authHeader - The Authorization header
 * @returns {string|null} The extracted token or null if not found
 */
export const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};

/**
 * Checks if a user has the required role
 * @param {string} userRole - The user's role
 * @param {string|string[]} requiredRoles - The role(s) required
 * @returns {boolean} True if user has required role, false otherwise
 */
export const hasRequiredRole = (userRole, requiredRoles) => {
    if (Array.isArray(requiredRoles)) {
        return requiredRoles.includes(userRole);
    }
    return userRole === requiredRoles;
};

/**
 * Generates a password reset token
 * @param {Object} user - The user object
 * @returns {string} The generated reset token
 */
export const generatePasswordResetToken = (user) => {
    return jwt.sign(
        { 
            id: user.id,
            email: user.email,
            type: 'password_reset'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

/**
 * Verifies a password reset token
 * @param {string} token - The reset token to verify
 * @returns {Object} The decoded token payload
 */
export const verifyPasswordResetToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'password_reset') {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired reset token');
    }
};

/**
 * Generates a refresh token
 * @param {Object} user - The user object
 * @returns {string} The generated refresh token
 */
export const generateRefreshToken = (user) => {
    return jwt.sign(
        { 
            id: user.id,
            email: user.email,
            type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
};

/**
 * Verifies a refresh token
 * @param {string} token - The refresh token to verify
 * @returns {Object} The decoded token payload
 */
export const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
}; 