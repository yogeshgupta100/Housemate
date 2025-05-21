import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Edit, Trash2, Bed, Bath, Square, Heart } from 'lucide-react';

const PropertyCard = ({ property, isCompact = false }) => {
  const { id, title, type, status, price, bedrooms, bathrooms, area, location, city, state, images } = property;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusClass = () => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Sold':
        return 'bg-blue-100 text-blue-800';
      case 'Rented':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="relative">
        <img
          src={images[0]}
          alt={title}
          className={`w-full ${isCompact ? 'h-36' : 'h-48'} object-cover`}
        />
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass()}`}>
            {status}
          </span>
        </div>
        {!isCompact && (
          <div className="absolute top-4 right-4">
            <button className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <div className={`p-${isCompact ? '4' : '5'}`}>
        <div className="mb-2">
          <span className="text-xs font-medium text-blue-600">{type}</span>
        </div>
        <h3 className={`${isCompact ? 'text-base' : 'text-lg'} font-semibold mb-1`}>{title}</h3>
        <p className="text-gray-600 text-sm mb-3">
          {location}, {city}, {state}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <p className={`font-bold ${isCompact ? 'text-lg' : 'text-xl'} text-blue-600`}>
            {formatCurrency(price)}
          </p>
          {type === 'Rent' && <span className="text-sm text-gray-500">/month</span>}
        </div>

        <div className="flex items-center mb-4 space-x-4">
          {bedrooms !== undefined && (
            <div className="flex items-center text-gray-600">
              <Bed className="w-4 h-4 mr-1" />
              <span className="text-sm">{bedrooms} Beds</span>
            </div>
          )}
          {bathrooms !== undefined && (
            <div className="flex items-center text-gray-600">
              <Bath className="w-4 h-4 mr-1" />
              <span className="text-sm">{bathrooms} Baths</span>
            </div>
          )}
          <div className="flex items-center text-gray-600">
            <Square className="w-4 h-4 mr-1" />
            <span className="text-sm">{area} sqft</span>
          </div>
        </div>

        {!isCompact && (
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <div className="flex space-x-2">
              <button className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                <Edit className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-500 hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <Link 
              to={`/properties/${id}`}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
            >
              View Details
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}
        
        {isCompact && (
          <div className="pt-2">
            <Link 
              to={`/properties/${id}`}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
            >
              View Details
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;