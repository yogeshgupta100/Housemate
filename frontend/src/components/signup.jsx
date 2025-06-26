import {useEffect, useState} from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Loader, UserPlus, Mail, Lock, Phone, User, Building, CheckCircle } from 'lucide-react';
import { Backendurl } from '../App';
import { toast } from 'react-toastify';
import GoogleSignInButton from './GoogleSignInButton';
import VerificationModal from './VerificationModal';
import './signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    companyName: '',
    registrationNumber: '',
    dealerLicense: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const navigate = useNavigate();

  // useEffect(() => {
  //   const fetchRoles = async () => {
  //     try {
  //       const apiUrl = `${Backendurl}/api/auth/get-roles`;
        
  //       if (!Backendurl) {
  //         throw new Error('Backend URL is not configured');
  //       }

  //       const response = await axios.get(apiUrl, {
  //         headers: {
  //           'Accept': 'application/json',
  //           'Content-Type': 'application/json'
  //         }
  //       });
        
  //       if (!response.data) {
  //         throw new Error('No data received from server');
  //       }
        
  //       if (response.data.success) {
  //         setRoles(response.data.data);
  //         const defaultRole = response.data.data.find(role => role.name === 'individual');
  //         if (defaultRole) {
  //           setSelectedRole(defaultRole.id);
  //         }
  //       } else {
  //         throw new Error(response.data.message || 'Failed to fetch roles');
  //       }
  //     } catch (error) {
  //       console.error('Error fetching roles:', error);
  //       console.error('Error details:', {
  //         message: error.message,
  //         response: error.response?.data,
  //         status: error.response?.status,
  //         config: error.config
  //       });
  //       toast.error('Error loading roles. Please try again later.');
  //     }
  //   };

  //   fetchRoles();
  // }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailVerificationSuccess = () => {
    setEmailVerified(true);
    toast.success('Email verified successfully!');
    setStep(2); // Move to next step after email verification
  };

  const handlePhoneVerificationSuccess = () => {
    setPhoneVerified(true);
    toast.success('Phone number verified successfully!');
    setStep(3); // Move to next step after phone verification
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return false;
    }
 
    if (formData.firstName.length < 2 || formData.firstName.length > 50) {
      toast.error('First name must be between 2 and 50 characters');
      return false;
    }

    if (formData.lastName.length < 2 || formData.lastName.length > 50) {
      toast.error('Last name must be between 2 and 50 characters');
      return false;
    }
    
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!formData.phone || !formData.gender) {
      toast.error('Please fill in all required fields');
      return false;
    }
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }
    
    const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
    if (!validGenders.includes(formData.gender)) {
      toast.error('Please select a valid gender');
      return false;
    }
    
    return true;
  };

  const validateStep3 = () => {
    if (formData.userType === 'corporate') {
      if (!formData.companyName || !formData.registrationNumber) {
        toast.error('Company name and registration number are required for corporate accounts');
        return false;
      }
    } else if (formData.userType === 'dealer') {
      if (!formData.dealerLicense) {
        toast.error('Dealer license is required for dealer accounts');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      // Instead of moving to next step, trigger email verification
      setShowEmailVerification(true);
    } else if (step === 2 && validateStep2()) {
      // Instead of moving to next step, trigger phone verification
      setShowPhoneVerification(true);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!emailVerified) {
      toast.error('Please verify your email address first');
      return;
    }

    if (!phoneVerified) {
      toast.error('Please verify your phone number first');
      return;
    }
    
    if (step === 3 && !validateStep3()) {
      return;
    }
    
    setLoading(true);
    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        gender: formData.gender,
        userType: formData.userType || 'individual',
        role: 'individual',
        emailVerified: emailVerified,
        phoneVerified: phoneVerified
      };

      // const selectedRoleData = roles.find(role => role.id === selectedRole);
      // if (selectedRoleData?.name === 'corporate') {
      //   userData.companyName = formData.companyName;
      //   userData.registrationNumber = formData.registrationNumber;
      // } else if (selectedRoleData?.name === 'dealer') {
      //   userData.dealerLicense = formData.dealerLicense;
      // }

      const response = await axios.post(
        `${Backendurl}/api/auth/register`,
        userData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        toast.success('Account created successfully!');
        navigate('/properties');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error(error.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (data) => {
    // Google sign-in successful, redirect to properties
    toast.success('Account created successfully with Google!');
    navigate('/properties');
  };

  const handleGoogleError = (error) => {
    console.error("Google sign-in error:", error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 mt-14">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                HOUSEMATE
              </h2>
            </Link>
            <h2 className="mt-6 text-2xl font-semibold text-gray-800">Create an account</h2>
            <p className="mt-2 text-gray-600">Join our community of property enthusiasts</p>
          </div>

          <div className="flex justify-between mb-8">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-circle">1</div>
              <div className="step-text">Basic Info</div>
            </div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-circle">2</div>
              <div className="step-text">Contact</div>
            </div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <div className="step-text">Complete</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      placeholder="John"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg shadow-blue-500/25"
                >
                  <span>Verify Email & Continue</span>
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
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      placeholder="1234567890"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <select
                      name="gender"
                      id="gender"
                      required
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="w-1/2 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
                  >
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg shadow-blue-500/25"
                  >
                    <span>Verify Phone</span>
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Registration</h3>
                  <p className="text-gray-600">Your email and phone have been verified. Complete your registration.</p>
                </div>

                {/* Verification Status */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-green-500 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">Email Verified</h4>
                        <p className="text-sm text-gray-600">{formData.email}</p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-green-500 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">Phone Verified</h4>
                        <p className="text-sm text-gray-600">{formData.phone}</p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="w-1/2 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
                  >
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>

          <Link
            to="/login"
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            Sign in to your account
          </Link>
        </div>
      </motion.div>

      {/* Verification Modals */}
      <VerificationModal
        isOpen={showEmailVerification}
        onClose={() => setShowEmailVerification(false)}
        type="email"
        identifier={formData.email}
        userId={null}
        onSuccess={handleEmailVerificationSuccess}
        isSignup={true}
      />

      <VerificationModal
        isOpen={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        type="phone"
        identifier={formData.phone}
        userId={null}
        onSuccess={handlePhoneVerificationSuccess}
        isSignup={true}
      />
    </div>
  );
};

export default Signup;