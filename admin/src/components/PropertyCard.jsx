import React from 'react';
import { 
  Trash2, 
  Edit3, 
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  Building,
  Link as LinkIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { backendurl } from "../App";

const PropertyCard = ({ property, onRemove }) => {
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/placeholder.jpg";
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${backendurl}/uploads/${imageUrl.split('/uploads/').pop()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <div className="relative h-48">
        <img
          src={getImageUrl(property.images?.[0])}
          alt={property.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/placeholder.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
            {property.type}
          </span>
        </div>
        <div className="absolute top-4 right-4 flex space-x-2">
          <Link 
            to={`/update/${property.id}`}
            className="p-2 bg-white/90 backdrop-blur-sm text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all"
          >
            <Edit3 className="w-4 h-4" />
          </Link>
          <button
            onClick={() => onRemove(property.id, property.title)}
            className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {property.title}
          </h2>
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {property.location}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-2xl font-bold text-blue-600">
            ₹{parseFloat(property.price).toLocaleString()}
            {property.listing_type === 'rent' && (
              <span className="text-sm font-normal text-gray-500">/{property.rent_type}</span>
            )}
          </p>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            property.listing_type === 'rent' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            For {property.listing_type === 'rent' ? 'Rent' : 'Sale'}
          </span>
        </div>

        {property.type === 'pg' && (
          <div className="mb-4">
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              {property.pg_type} PG
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-6">
          {property.beds > 0 && (
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <BedDouble className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-sm text-gray-600">{property.beds} Beds</span>
            </div>
          )}
          {property.baths > 0 && (
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <Bath className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-sm text-gray-600">{property.baths} Baths</span>
            </div>
          )}
          {property.sqft > 0 && (
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <Maximize className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-sm text-gray-600">{property.sqft} sqft</span>
            </div>
          )}
        </div>
        
        {property.amenities && property.amenities.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {property.amenities.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  <Building className="w-3 h-3 mr-1" />
                  {amenity}
                </span>
              ))}
              {property.amenities.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  +{property.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Listed on {new Date(property.created_at).toLocaleDateString()}</span>
            <Link 
              to={`/property/${property.id}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <LinkIcon className="w-4 h-4 mr-1" />
              View Details
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyCard; 