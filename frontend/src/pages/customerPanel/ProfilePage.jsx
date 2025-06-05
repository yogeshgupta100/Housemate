import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit, Camera, Save, X } from 'lucide-react';
import PageHeader from '../../components/customerPanel/common/PageHeader';
import axios from 'axios';
import { Backendurl } from '../../App';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
const ProfilePage = () => {
  const { user: authUser, updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
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
    maritalStatus: '',
    govtIdNumber: '',
    idCardImages: [],
    verificationStatus: 'pending',
    profession: '',
    nationality: '',
    bankDetails: {
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      accountHolderName: ''
    }
  });

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Backendurl}/api/auth/me`);
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        setFormData({
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          gender: userData.gender || '',
          userType: userData.user_type || '',
          address: {
            city: userData.city || '',
            state: userData.state || ''
          },
          bio: userData.bio || '',
          identityProof: userData.identity_proof || null,
          maritalStatus: userData.marital_status || '',
          govtIdNumber: userData.govt_id_number || '',
          idCardImages: userData.id_card_images || [],
          verificationStatus: userData.verification_status || 'pending',
          profession: userData.profession || '',
          nationality: userData.nationality || '',
          bankDetails: {
            accountNumber: userData.bank_details?.account_number || '',
            bankName: userData.bank_details?.bank_name || '',
            ifscCode: userData.bank_details?.ifsc_code || '',
            accountHolderName: userData.bank_details?.account_holder_name || ''
          }
        });
        setPreviewImage(userData.profile_image || null);
      } else {
        setError('Failed to fetch user data');
      }
    } catch (err) {
      setError('Error loading profile data');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
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
      // First upload the profile image if it exists
      let profileImageUrl = user.profile_image;
      if (profileImage) {
        const formData = new FormData();
        formData.append('pdf', profileImage); // We'll use the same endpoint but for images

        const uploadResponse = await axios.post(
          `${Backendurl}/api/pg/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (uploadResponse.data.success) {
          profileImageUrl = uploadResponse.data.data.url;
        }
      }

      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        gender: formData.gender,
        city: formData.address.city,
        state: formData.address.state,
        bio: formData.bio,
        profile_image: profileImageUrl,
        marital_status: formData.maritalStatus,
        govt_id_number: formData.govtIdNumber,
        id_card_images: formData.idCardImages,
        verification_status: formData.verificationStatus,
        profession: formData.profession,
        nationality: formData.nationality,
        bank_details: {
          account_number: formData.bankDetails.accountNumber,
          bank_name: formData.bankDetails.bankName,
          ifsc_code: formData.bankDetails.ifscCode,
          account_holder_name: formData.bankDetails.accountHolderName
        }
      };

      console.log('Sending update data:', updateData);

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

      console.log('API Response:', response);

      if (response && response.data) {
        if (response.data.success) {
          setUser(response.data.data);
          updateUser(response.data.data);
          toast.success('Profile updated successfully');
          fetchUserDetails();
          setIsEditing(false);
        } else {
          toast.error(response.data.message || 'Failed to update profile');
        }
      } else {
        toast.error('Unexpected response from server');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.response) {
        console.error('Error response:', error.response);
        toast.error(error.response.data?.message || 'Server error occurred');
      } else if (error.request) {
        console.error('Error request:', error.request);
        toast.error('No response from server');
      } else {
        console.error('Error message:', error.message);
        toast.error('Error updating profile');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <PageHeader 
        title="My Profile" 
        description="Manage your personal information and preferences"
        actions={
          isEditing ? (
            <button 
              onClick={() => {
                setIsEditing(false);
                fetchUserDetails();
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          )
        }
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="relative w-32 h-32 mx-auto mb-4">
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
                  <Camera className="text-white w-4 h-4" />
                </label>
              )}
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">
              {formData.firstName} {formData.lastName}
            </h2>
            <p className="text-gray-500 text-center">{formData.userType}</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
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
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                        onClick={() => setFormData(prev => ({ ...prev, identityProof: null }))}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Camera className="mx-auto w-8 h-8 mb-2" />
                      <p>No identity proof uploaded</p>
                    </div>
                  )}
                  <div className="mt-4 text-center">
                    <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                      <Camera className="w-4 h-4 mr-2" />
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
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Government ID Number</label>
                  <input
                    type="text"
                    name="govtIdNumber"
                    value={formData.govtIdNumber}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Aadhaar/PAN/Passport number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profession</label>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nationality</label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Details</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600">Account Number</label>
                    <input
                      type="text"
                      name="bankDetails.accountNumber"
                      value={formData.bankDetails.accountNumber}
                      onChange={handleInputChange}
                      className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Bank Name</label>
                    <input
                      type="text"
                      name="bankDetails.bankName"
                      value={formData.bankDetails.bankName}
                      onChange={handleInputChange}
                      className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">IFSC Code</label>
                    <input
                      type="text"
                      name="bankDetails.ifscCode"
                      value={formData.bankDetails.ifscCode}
                      onChange={handleInputChange}
                      className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Account Holder Name</label>
                    <input
                      type="text"
                      name="bankDetails.accountHolderName"
                      value={formData.bankDetails.accountHolderName}
                      onChange={handleInputChange}
                      className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </form>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{formData.email}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{formData.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">
                      {formData.address.city ? `${formData.address.city}, ${formData.address.state}` : 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Marital Status</p>
                    <p className="font-medium">{formData.maritalStatus || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Government ID Number</p>
                    <p className="font-medium">{formData.govtIdNumber || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Verification Status</p>
                    <p className="font-medium capitalize">{formData.verificationStatus || 'Not verified'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Profession</p>
                    <p className="font-medium">{formData.profession || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Nationality</p>
                    <p className="font-medium">{formData.nationality || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Bank Details</p>
                    <div className="mt-1">
                      <p className="font-medium">Account Number: {formData.bankDetails.accountNumber || 'Not provided'}</p>
                      <p className="font-medium">Bank Name: {formData.bankDetails.bankName || 'Not provided'}</p>
                      <p className="font-medium">IFSC Code: {formData.bankDetails.ifscCode || 'Not provided'}</p>
                      <p className="font-medium">Account Holder: {formData.bankDetails.accountHolderName || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                {formData.bio && (
                  <div className="flex items-start">
                    <User className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Bio</p>
                      <p className="font-medium">{formData.bio}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;