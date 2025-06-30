import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/postgres.js";
import otpRepository from "../repositories/otpRepository.js";
import { sendEmail } from "../email.js";
import { sendOTP as sendSMSOTP } from "../services/smsService.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  const dbClient = await pool.connect();
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res
        .status(400)
        .json({ success: false, message: "Google access token is required" });
    }
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info from Google");
    }
    const userInfo = await userInfoResponse.json();
    const { email, id: googleId } = userInfo;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required from Google account",
      });
    }
    let {
      rows: [user],
    } = await dbClient.query(
      "SELECT * FROM users WHERE email = $1 OR google_id = $2",
      [email, googleId]
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found. Please sign up first.",
      });
    }
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
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
          role_id: user.role_id,
          profile_picture: user.profile_picture,
          is_verified: user.is_verified,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ success: false, message: "Google login failed" });
  } finally {
    dbClient.release();
  }
};

export const googleSignup = async (req, res) => {
  const dbClient = await pool.connect();
  try {
    const { accessToken, phone } = req.body;
    if (!accessToken) {
      return res
        .status(400)
        .json({ success: false, message: "Google access token is required" });
    }
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info from Google");
    }
    const userInfo = await userInfoResponse.json();
    const { email, given_name, family_name, picture, id: googleId } = userInfo;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required from Google account",
      });
    }
    // Check if user exists by email or google_id
    let {
      rows: [user],
    } = await dbClient.query(
      "SELECT * FROM users WHERE email = $1 OR google_id = $2",
      [email, googleId]
    );
    // Check if user exists with the same email AND phone
    let {
      rows: [userByEmailAndPhone],
    } = await dbClient.query(
      "SELECT * FROM users WHERE email = $1 AND phone = $2",
      [email, phone]
    );
    if (userByEmailAndPhone) {
      return res.status(400).json({
        success: false,
        message: "User already registered with this email and phone number.",
      });
    }
    if (!user) {
      // Create new user if doesn't exist
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
      const {
        rows: [newUser],
      } = await dbClient.query(
        `INSERT INTO users (
          first_name, last_name, email, password, phone, 
          google_id, profile_picture, user_type, role_id, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          given_name || "",
          family_name || "",
          email,
          hashedPassword,
          phone || null,
          googleId,
          picture || null,
          "individual",
          1, // Default role
          true, // Google users are pre-verified
        ]
      );
      user = newUser;
    } else {
      // Update existing user with Google ID if not present
      if (!user.google_id) {
        await dbClient.query(
          "UPDATE users SET google_id = $1, profile_picture = $2, is_verified = true WHERE id = $3",
          [googleId, picture || user.profile_picture, user.id]
        );
      }
      // If phone is not set, update it
      if (!user.phone && phone) {
        await dbClient.query("UPDATE users SET phone = $1 WHERE id = $2", [
          phone,
          user.id,
        ]);
        user.phone = phone;
      } else if (user.phone && user.phone !== phone) {
        return res.status(400).json({
          success: false,
          message:
            "A user with this email is already registered with a different phone number.",
        });
      }
    }
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
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
          role_id: user.role_id,
          profile_picture: user.profile_picture,
          is_verified: user.is_verified,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Google signup error:", error);
    res.status(500).json({ success: false, message: "Google signup failed" });
  } finally {
    dbClient.release();
  }
};

export const verifyPhoneWithOTP = async (req, res) => {
  const dbClient = await pool.connect();
  try {
    const { userId, phone, otp } = req.body;

    if (!userId || !phone) {
      return res.status(400).json({
        success: false,
        message: "User ID and phone number are required",
      });
    }

    // If OTP is provided, verify it
    if (otp) {
      const isVerified = await otpRepository.verifyOTP(phone, otp);
      if (!isVerified) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }
    } else {
      // Generate and send OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await otpRepository.createOTP({
        identifier: phone,
        otp: otpCode,
        type: "phone",
        expiresAt,
      });

      await sendSMSOTP(phone, otpCode);

      return res.status(200).json({
        success: true,
        message: "OTP sent to your phone number",
      });
    }

    // Update user's phone number
    await dbClient.query("UPDATE users SET phone = $1 WHERE id = $2", [
      phone,
      userId,
    ]);

    res.status(200).json({
      success: true,
      message: "Phone number verified successfully",
    });
  } catch (error) {
    console.error("Phone verification error:", error);
    res.status(500).json({
      success: false,
      message: "Phone verification failed",
    });
  } finally {
    dbClient.release();
  }
};

export const verifyEmailWithOTP = async (req, res) => {
  const dbClient = await pool.connect();
  try {
    const { userId, email, otp } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        message: "User ID and email are required",
      });
    }

    // If OTP is provided, verify it
    if (otp) {
      const isVerified = await otpRepository.verifyOTP(email, otp);
      if (!isVerified) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }
    } else {
      // Generate and send OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await otpRepository.createOTP({
        identifier: email,
        otp: otpCode,
        type: "email",
        expiresAt,
      });

      await sendEmail({
        email,
        subject: "Your Email Verification Code",
        message: `Your verification code is ${otpCode}. This code will expire in 10 minutes.`,
      });

      return res.status(200).json({
        success: true,
        message: "OTP sent to your email",
      });
    }

    // Update user's email verification status
    await dbClient.query("UPDATE users SET is_verified = true WHERE id = $1", [
      userId,
    ]);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed",
    });
  } finally {
    dbClient.release();
  }
};
