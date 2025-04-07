import express from "express";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import validator from "validator";
import crypto from "crypto";
import userModel from "../models/Usermodel.js";
import transporter from "../config/nodemailer.js";
import { getWelcomeTemplate } from "../email.js";
import { getPasswordResetTemplate } from "../email.js";

const backendurl = process.env.BACKEND_URL;

const createtoken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

dotenv.config();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    
    // Find user and include password field
    const user = await userModel.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Email not found" 
      });
    }
    
    // Use the matchPassword method from the User model
    const isMatch = await user.matchPassword(password);
    
    if (isMatch) {
      const token = createtoken(user._id);
      return res.status(200).json({ 
        success: true, 
        token, 
        user: { 
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
          role: user.role
        } 
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid password" 
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      gender,
      userType = 'User',
      // Optional fields for corporate/dealer
      companyName,
      companyRegistrationNumber,
      dealerLicense
    } = req.body;
    // console.log(req.body);
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !gender) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: firstName, lastName, email, password, and gender are required"
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Check if email already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Validate user type specific requirements
    if ((userType === 'Corporate' || userType === 'Dealer') && (!companyName || !companyRegistrationNumber)) {
      return res.status(400).json({
        success: false,
        message: "Company name and registration number are required for Corporate/Dealer accounts"
      });
    }

    if (userType === 'Dealer' && !dealerLicense) {
      return res.status(400).json({
        success: false,
        message: "Dealer license is required for Dealer accounts"
      });
    }

    // Create new user
    const newUser = new userModel({
      firstName,
      lastName,
      email,
      password,
      phone,
      gender,
      userType,
      companyName,
      companyRegistrationNumber,
      dealerLicense
    });

    await newUser.save();

    // Generate token
    const token = createtoken(newUser._id);

    // Send welcome email
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Welcome to BuildEstate - Your Account Has Been Created",
      html: getWelcomeTemplate(`${firstName} ${lastName}`)
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        userType: newUser.userType
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const forgotpassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not found", success: false });
    }
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 10 * 60 * 1000; // 1 hour
    await user.save();
    const resetUrl = `${process.env.WEBSITE_URL}/reset/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset - BuildEstate Security",
      html: getPasswordResetTemplate(resetUrl)
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Email sent", success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const resetpassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await userModel.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token", success: false });
    }
    // Set the password directly - the pre-save hook will hash it
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();
    return res.status(200).json({ message: "Password reset successful", success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const adminlogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.json({ token, success: true });
    } else {
      return res.status(400).json({ message: "Invalid credentials", success: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const logout = async (req, res) => {
    try {
        return res.json({ message: "Logged out", success: true });
    } catch (error) {
        console.error(error);
        return res.json({ message: "Server error", success: false });
    }
};

// get name and email

const getname = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    return res.json(user);
  }
  catch (error) {
    console.error(error);
    return res.json({ message: "Server error", success: false });
  }
}



export { login, register, forgotpassword, resetpassword, adminlogin, logout, getname };