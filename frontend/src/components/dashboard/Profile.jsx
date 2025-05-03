import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaCamera, FaSave } from 'react-icons/fa';
import './Profile.css';
import {Backendurl} from "@/App.jsx";
import axios from "axios";

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
    bio: ''
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
          bio: userData.bio || ''
        });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        gender: formData.gender,
        address: {
          city: formData.address?.city,
          state: formData.address?.state
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

      if (response.data.success) {
        // Just update the local state if needed
        setFormData(response.data.data);
        setIsEditing(false);
        alert('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Error updating profile');
    }
};
  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile</h1>
        <button
          className="edit-button"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-image-section">
          <div className="profile-image-container">
            {previewImage ? (
              <img src={previewImage} alt="Profile" />
            ) : (
              <div className="profile-image-placeholder">
                {formData.firstName?.charAt(0) || 'U'}
              </div>
            )}
            {isEditing && (
              <label className="image-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <FaCamera />
              </label>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>First Name</label>
            <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={true}
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <input
                type="text"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>User Type</label>
            <input
                type="text"
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                disabled={true}
            />
          </div>

          {/*<div className="form-group">*/}
          {/*  <label>Address</label>*/}
          {/*  <textarea*/}
          {/*      name="address"*/}
          {/*      value={formData.address}*/}
          {/*      onChange={handleInputChange}*/}
          {/*      disabled={!isEditing}*/}
          {/*  />*/}
          {/*</div>*/}

          <div className="form-group">
            <label>City</label>
            <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>State</label>
            <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows="4"
            />
          </div>

          {isEditing && (
              <button type="submit" className="save-button">
                <FaSave/> Save Changes
              </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;