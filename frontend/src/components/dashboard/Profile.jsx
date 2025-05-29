import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaCamera, FaSave, FaTimes, FaCheckCircle } from 'react-icons/fa';
import './Profile.css';
import { Backendurl } from '@/App.jsx';
import axios from 'axios';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    userType: '',
    address: {
      city: '',
      state: ''
    },
    bio: '',
    identityProof: null,
    isVerified: false // Default to false for now
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(user?.profileImage);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(`${Backendurl}/api/auth/me`);
      if (response.data.success) {
        const userData = response.data.data;
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          gender: userData.gender || '',
          userType: userData.userType || '',
          address: {
            city: userData.address?.city || '',
            state: userData.address?.state || ''
          },
          bio: userData.bio || '',
          identityProof: userData.identityProof || null,
          isVerified: userData.isVerified || false // Will be updated later with backend data
        });
        setPreviewImage(userData.profileImage || null);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleIdentityProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        identityProof: objectUrl
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        gender: formData.gender,
        address: {
          city: formData.address.city,
          state: formData.address.state
        },
        bio: formData.bio
      };

      const response = await axios.put(
          `${Backendurl}/api/auth/profile`,
          updateData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
      );

      if (response.data.success === true) {
        updateUser(response.data.data);
        setIsEditing(false);
        alert('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Error updating profile');
    }
  };

  return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-800">
                {formData.firstName} {formData.lastName}
              </h1>
              <FaCheckCircle
                  className={`text-2xl ${formData.isVerified ? 'text-blue-600' : 'text-gray-400'}`}
                  title={formData.isVerified ? 'Verified' : 'Not Verified'}
              />
            </div>
            <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
                onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="relative w-32 h-32 mx-auto">
                {previewImage ? (
                    <img
                        src={previewImage}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full border-2 border-gray-200"
                    />
                ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                      {formData.firstName?.charAt(0) || 'U'}
                    </div>
                )}
                {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700">
                      <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                      />
                      <FaCamera className="text-white" />
                    </label>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="md:w-2/3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled={true}
                    className="mt-1 w-full p-2 border rounded-lg bg-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">User Type</label>
                <input
                    type="text"
                    name="userType"
                    value={formData.userType}
                    disabled={true}
                    className="mt-1 w-full p-2 border rounded-lg bg-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows="4"
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Identity Proof</label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  {formData.identityProof ? (
                      <div className="relative w-full max-w-xs mx-auto">
                        <img
                            src={formData.identityProof}
                            alt="Identity Proof"
                            className="w-full h-auto rounded-lg border shadow-sm"
                        />
                        {isEditing && (
                            <button
                                type="button"
                                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                                onClick={() => setFormData(prev => ({ ...prev, identityProof: null }))}
                            >
                              <FaTimes />
                            </button>
                        )}
                      </div>
                  ) : (
                      <div className="text-center py-4 text-gray-500">
                        <FaCamera className="mx-auto text-3xl mb-2" />
                        <p>No identity proof uploaded</p>
                      </div>
                  )}
                  {isEditing && (
                      <div className="mt-4 text-center">
                        <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                          <FaCamera className="mr-2" />
                          <span>Upload Identity Proof</span>
                          <input
                              type="file"
                              accept="image/*"
                              onChange={handleIdentityProofChange}
                              className="hidden"
                          />
                        </label>
                        <p className="text-sm text-gray-500 mt-2">Accepted: Aadhaar, PAN, Driver's License</p>
                      </div>
                  )}
                </div>
              </div>

              {isEditing && (
                  <button
                      type="submit"
                      className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <FaSave />
                    Save Changes
                  </button>
              )}
            </form>
          </div>
        </div>
      </div>
  );
};

export default Profile;