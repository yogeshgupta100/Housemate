import React from 'react';
import { Calendar } from 'lucide-react';

const ProfileCard= ({ user }) => {
  // Format the date
  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 h-24"></div>
      <div className="px-6 pb-6">
        <div className="flex justify-center -mt-12">
          <div className="relative">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full border-4 border-white object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {user.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="text-center mt-4">
          <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            Member since {formatDate(user.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;