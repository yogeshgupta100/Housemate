import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader } from 'lucide-react';

const OTPInput = ({ identifier, onVerificationSuccess }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);

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

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:4000/api/otp/generate', {
        identifier: identifier
      });

      if (response.data.success) {
        toast.success('OTP resent successfully!');
        setCountdown(60);
        setResendDisabled(true);
      } else {
        toast.error(response.data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:4000/api/otp/verify', {
        identifier: identifier,
        otp: otpValue
      });

      if (response.data.success) {
        toast.success('OTP verified successfully!');
        onVerificationSuccess();
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

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Enter Verification Code</h1>
        <p className="text-gray-600 mt-2">
          We've sent a verification code to your {identifier.includes('@') ? 'email' : 'phone'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
  );
};

export default OTPInput; 