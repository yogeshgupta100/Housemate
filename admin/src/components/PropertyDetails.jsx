import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Calendar, 
  Building, 
  BedDouble, 
  Bath, 
  Maximize, 
  Users,
  ArrowLeft,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { backendurl } from '../App';
import { toast } from 'react-hot-toast';

const PropertyDetails = ({ property, onRemove }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const navigate = useNavigate();

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/placeholder.jpg";
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${backendurl}/uploads/${imageUrl.split('/uploads/').pop()}`;
  };

  const handleRemoveProperty = async () => {
    if (window.confirm(`Are you sure you want to remove "${property.title}"?`)) {
      try {
        const response = await fetch(`${backendurl}/api/properties/${property.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();

        if (data.success) {
          toast.success("Property removed successfully");
          navigate('/list');
        } else {
          toast.error(data.message || "Failed to remove property");
        }
      } catch (error) {
        console.error("Error removing property:", error);
        toast.error("Failed to remove property");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-8 my-14"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/list"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Listings
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to={`/update/${property.id}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-5 h-5 mr-2" />
              Edit Property
            </Link>
            <button
              onClick={handleRemoveProperty}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Remove Property
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative h-96">
                <img
                  src={getImageUrl(property.images?.[activeImageIndex])}
                  alt={property.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/placeholder.jpg";
                  }}
                />
                {property.images?.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {property.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === activeImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              {property.images?.length > 1 && (
                <div className="p-4 grid grid-cols-4 gap-2">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative h-20 rounded-lg overflow-hidden ${
                        index === activeImageIndex ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${property.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{property.title}</h1>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                {property.location}
              </div>
              <div className="flex items-center text-gray-600 mb-6">
                <Phone className="w-5 h-5 mr-2" />
                {property.phone}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {property.beds > 0 && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <BedDouble className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">{property.beds} Beds</span>
                  </div>
                )}
                {property.baths > 0 && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Bath className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">{property.baths} Baths</span>
                  </div>
                )}
                {property.sqft > 0 && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Maximize className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">{property.sqft} sqft</span>
                  </div>
                )}
                {property.type === 'pg' && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">{property.pg_type} PG</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-600 whitespace-pre-line">{property.description}</p>
              </div>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Building className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-gray-600">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Details and Status */}
          <div className="space-y-6">
            {/* Price and Status */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-blue-600 mb-2">
                  ₹{parseFloat(property.price).toLocaleString()}
                  {property.listing_type === 'rent' && (
                    <span className="text-sm font-normal text-gray-500">/{property.rent_type}</span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    property.listing_type === 'rent' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    For {property.listing_type === 'rent' ? 'Rent' : 'Sale'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    property.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {property.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Property Type</span>
                  <span className="font-medium">{property.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Furnishing</span>
                  <span className="font-medium">{property.furnishing}</span>
                </div>
                {property.deposit > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Deposit</span>
                    <span className="font-medium">₹{parseFloat(property.deposit).toLocaleString()}</span>
                  </div>
                )}
                {property.property_age && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Property Age</span>
                    <span className="font-medium">{property.property_age} years</span>
                  </div>
                )}
                {property.property_condition && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Condition</span>
                    <span className="font-medium">{property.property_condition}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Availability */}
            {property.availability && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Availability</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`inline-flex items-center ${
                      property.availability.status === 'Available' 
                        ? 'text-green-600' 
                        : 'text-yellow-600'
                    }`}>
                      {property.availability.status === 'Available' ? (
                        <CheckCircle2 className="w-5 h-5 mr-1" />
                      ) : (
                        <Clock className="w-5 h-5 mr-1" />
                      )}
                      {property.availability.status}
                    </span>
                  </div>
                  {property.availability.availableFrom && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Available From</span>
                      <span className="font-medium">
                        {new Date(property.availability.availableFrom).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {property.availability.minLeasePeriod && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Minimum Lease Period</span>
                      <span className="font-medium">{property.availability.minLeasePeriod}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Features */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Features</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  {property.balcony ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-gray-600">Balcony</span>
                </div>
                <div className="flex items-center">
                  {property.central_ac ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-gray-600">Central AC</span>
                </div>
                <div className="flex items-center">
                  {property.power_backup ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-gray-600">Power Backup</span>
                </div>
                <div className="flex items-center">
                  {property.parking ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-gray-600">Parking</span>
                </div>
                <div className="flex items-center">
                  {property.security ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-gray-600">Security</span>
                </div>
                <div className="flex items-center">
                  {property.lift ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-gray-600">Lift</span>
                </div>
              </div>
            </div>

            {/* Listing Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Listing Information</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Listed On</span>
                  <span className="font-medium">
                    {new Date(property.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-medium">
                    {new Date(property.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Listing ID</span>
                  <span className="font-medium">{property.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyDetails; 