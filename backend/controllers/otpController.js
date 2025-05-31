import otpRepository from '../repositories/otpRepository.js';
import { sendEmail } from '../email.js';
import { sendOTP as sendSMSOTP } from '../services/smsService.js';
import pool from '../config/postgres.js';

const generateOTP = async (req, res) => {
  const client = await pool.connect();
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email or phone number'
      });
    }

    const isEmail = identifier.includes('@');
    const type = isEmail ? 'email' : 'phone';

    const { rows: [user] } = await client.query(
      `SELECT * FROM users WHERE ${isEmail ? 'email' : 'phone'} = $1`,
      [identifier]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No account found with this ${type}`
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await otpRepository.createOTP({
      identifier,
      otp,
      type,
      expiresAt
    });

    if (isEmail) {
      await sendEmail({
        email: identifier,
        subject: 'Your Verification Code',
        message: `Your verification code is ${otp}. This code will expire in 10 minutes.`
      });
    } else {
      await sendSMSOTP(identifier, otp);
    }

    res.status(200).json({
      success: true,
      message: `OTP sent to your ${type}`
    });
  } catch (error) {
    console.error('Error generating OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate OTP'
    });
  } finally {
    client.release();
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Identifier and OTP are required'
      });
    }

    const isVerified = await otpRepository.verifyOTP(identifier, otp);

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP'
    });
  }
};

const cleanupExpiredOTPs = async (req, res) => {
  try {
    await otpRepository.cleanupExpiredOTPs();
    res.status(200).json({
      success: true,
      message: 'Expired OTPs cleaned up successfully'
    });
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up expired OTPs'
    });
  }
};

export {
  generateOTP,
  verifyOTP,
  cleanupExpiredOTPs
}; 