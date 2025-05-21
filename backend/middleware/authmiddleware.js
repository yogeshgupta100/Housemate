import jwt from "jsonwebtoken";
import pool from "../config/postgres.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login to continue",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from PostgreSQL
    const client = await pool.connect();
    try {
      const { rows: [user] } = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [decoded.id]
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Remove password from user object
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
      next();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
};

// In backend/middleware/authmiddleware.js
export const checkAppointmentOwnership = async (req, res, next) => {
  try {
    const client = await pool.connect();
    try {
      const { rows: [appointment] } = await client.query(
        'SELECT * FROM appointments WHERE id = $1',
        [req.params.id]
      );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      if (appointment.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this appointment",
        });
      }

      req.appointment = appointment;
      next();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error checking appointment ownership:", error);
    res.status(500).json({
      success: false,
      message: "Error checking appointment ownership",
    });
  }
};

export default protect;
