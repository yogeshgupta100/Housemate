import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader, X, Mail, Phone } from 'lucide-react';
import { Backendurl } from '../App.jsx';

const VerificationModal = ({ isOpen, onClose, type, identifier, userId, onSuccess, isSignup = false }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const [step, setStep] = useState('input'); // 'input' or 'otp'

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      let endpoint;
      let requestData;

      if (isSignup) {
        // Signup verification
        endpoint = type === 'email' ? '/api/auth/signup/send-email-otp' : '/api/auth/signup/send-phone-otp';
        requestData = type === 'email' ? { email: identifier } : { phone: identifier };
      } else {
        // Post-signup verification
        endpoint = type === 'email' ? '/api/auth/verify-email' : '/api/auth/verify-phone';
        requestData = { userId, [type]: identifier };
      }

      const response = await axios.post(`${Backendurl}${endpoint}`, requestData);

      if (response.data.success) {
        setStep('otp');
        setCountdown(60);
        setResendDisabled(true);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    await handleSendOTP();
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      let endpoint;
      let requestData;

      if (isSignup) {
        // Signup verification
        endpoint = type === 'email' ? '/api/auth/signup/verify-email-otp' : '/api/auth/signup/verify-phone-otp';
        requestData = type === 'email' ? { email: identifier, otp: otpValue } : { phone: identifier, otp: otpValue };
      } else {
        // Post-signup verification
        endpoint = type === 'email' ? '/api/auth/verify-email' : '/api/auth/verify-phone';
        requestData = { userId, [type]: identifier, otp: otpValue };
      }

      const response = await axios.post(`${Backendurl}${endpoint}`, requestData);

      if (response.data.success) {
        toast.success(response.data.message);
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        toast.error(response.data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error(error.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Verify {type === 'email' ? 'Email' : 'Phone'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 'input' ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                {type === 'email' ? (
                  <Mail className="w-6 h-6 text-blue-600" />
                ) : (
                  <Phone className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Verify your {type}
              </h3>
              <p className="text-gray-600">
                We'll send a verification code to your {type}
              </p>
              <p className="text-sm font-medium text-gray-900 mt-2">
                {identifier}
              </p>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                `Send verification code to ${type}`
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Enter verification code
              </h3>
              <p className="text-gray-600">
                We've sent a 6-digit code to your {type}
              </p>
              <p className="text-sm font-medium text-gray-900 mt-2">
                {identifier}
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="flex justify-center space-x-2">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={data}
                    onChange={(e) => handleChange(e.target, index)}
                    onFocus={(e) => e.target.select()}
                    className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg shadow-blue-500/25"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  "Verify"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendDisabled || loading}
                  className={`text-sm ${
                    resendDisabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  {resendDisabled
                    ? `Resend code in ${countdown}s`
                    : 'Resend verification code'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationModal; 