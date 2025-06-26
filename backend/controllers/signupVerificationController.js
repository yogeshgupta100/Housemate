import otpRepository from '../repositories/otpRepository.js';
import { sendEmail } from '../email.js';
import { sendOTP as sendSMSOTP } from '../services/smsService.js';

export const sendSignupEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Generate and send OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await otpRepository.createOTP({
      identifier: email,
      otp: otpCode,
      type: 'email',
      expiresAt
    });

    await sendEmail({
      email,
      subject: 'Your Email Verification Code',
      message: `Your verification code is ${otpCode}. This code will expire in 10 minutes.`
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email'
    });
  } catch (error) {
    console.error('Error sending signup email OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

export const sendSignupPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Generate and send OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await otpRepository.createOTP({
      identifier: phone,
      otp: otpCode,
      type: 'phone',
      expiresAt
    });

    await sendSMSOTP(phone, otpCode);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your phone number'
    });
  } catch (error) {
    console.error('Error sending signup phone OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

export const verifySignupEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const isVerified = await otpRepository.verifyOTP(email, otp);

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Error verifying signup email OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
};

export const verifySignupPhoneOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    const isVerified = await otpRepository.verifyOTP(phone, otp);

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    console.error('Error verifying signup phone OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Phone verification failed'
    });
  }
}; 