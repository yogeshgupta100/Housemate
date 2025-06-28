import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from '../context/AuthContext';
import OTPInput from './OTPInput';
import PasswordInput from './PasswordInput';
import GoogleSignInButton from './GoogleSignInButton';
import { Backendurl } from "../App.jsx";

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: "",
  });
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIdentifierSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${Backendurl}/api/otp/generate`, {
        identifier: formData.identifier
      });

      if (response.data.success) {
        setShowOTP(true);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.message || "Error processing request");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerificationSuccess = () => {
    setShowOTP(false);
    setShowPassword(true);
    toast.success("Email verified! Please enter your password.");
  };

  const handlePasswordSubmit = async (password) => {
    setLoading(true);
    try {
      const result = await login(formData.identifier, password);
      
      if (result.success) {
        toast.success("Login successful!");
        const from = location.state?.from?.pathname || "/properties";
        navigate(from);
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (data) => {
    // Update auth context
    login(data.user.email, null, data.token);
    const from = location.state?.from?.pathname || "/properties";
    navigate(from);
  };

  const handleGoogleError = (error) => {
    console.error("Google sign-in error:", error);
  };

  if (showOTP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="w-full max-w-md"
        >
          <OTPInput 
            identifier={formData.identifier}
            onVerificationSuccess={handleOTPVerificationSuccess}
          />
        </motion.div>
      </div>
    );
  }

  if (showPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="w-full max-w-md"
        >
          <PasswordInput
            identifier={formData.identifier}
            onSubmit={handlePasswordSubmit}
            loading={loading}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                HOUSEMATE
              </h2>
            </Link>
            <h1 className="mt-6 text-2xl font-semibold text-gray-800">Welcome back</h1>
            <p className="mt-2 text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleIdentifierSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                Email or Phone Number
              </label>
              <input
                type="text"
                name="identifier"
                id="identifier"
                required
                value={formData.identifier}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                placeholder="Enter email or phone number"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                "Continue"
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
              </div>
            </div>

            <Link
              to="/signup"
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              Create an account
            </Link>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;