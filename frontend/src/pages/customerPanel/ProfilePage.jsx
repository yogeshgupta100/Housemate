import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Edit } from 'lucide-react';
import ProfileCard from '../../components/customerPanel/profile/ProfileCard';
import ProfileForm from '../../components/customerPanel/profile/ProfileForm';
import PageHeader from '../../components/customerPanel/common/PageHeader';

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1 234 567 890',
  avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200',
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zip: '10001',
  country: 'USA',
  createdAt: '2023-01-01T00:00:00.000Z',
};

const ProfilePage = () => {
  const [user, setUser] = useState(mockUser);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (updatedUser) => {
    setUser(updatedUser);
    setIsEditing(false);
    // Here you would typically make an API call to update the user
  };

  return (
    <div>
      <PageHeader 
        title="My Profile" 
        description="Manage your personal information and preferences"
        actions={
          isEditing ? (
            <button 
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              {/* <X className="w-4 h-4 mr-2" /> */}
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
          <ProfileCard user={user} />
        </div>
        <div className="lg:col-span-2">
          {isEditing ? (
            <ProfileForm user={user} onSave={handleSave} />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">
                      {user.address}, {user.city}, {user.state} {user.zip}, {user.country}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;