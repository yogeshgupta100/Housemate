import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Edit, Trash2, MapPin, Bed, Bath, Square, Calendar, CheckSquare, Share } from 'lucide-react';
import PageHeader from '../../components/customerPanel/common/PageHeader';

// Mock data
const mockProperties = [
  {
    id: '101',
    title: 'Modern Apartment in Downtown',
    description: 'A beautiful modern apartment in the heart of downtown with stunning views of the city skyline. This newly renovated space features high-end finishes, stainless steel appliances, and hardwood floors throughout. The open floor plan creates a spacious feel, perfect for entertaining. The building includes amenities such as a fitness center, rooftop pool, and 24-hour concierge service.',
    type: 'Apartment',
    status: 'Active',
    price: 450000,
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    location: 'Downtown',
    city: 'New York',
    state: 'NY',
    images: [
      'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
      'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    ],
    features: ['Parking', 'Gym', 'Pool', 'Elevator', 'Security', 'Concierge', 'Central AC', 'Pet Friendly'],
    ownerId: '1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-02-15T00:00:00.000Z',
  },
  {
    id: '102',
    title: 'Luxury Villa with Pool',
    description: 'Spacious luxury villa with a private pool located in an exclusive neighborhood. This magnificent property offers luxurious living with high ceilings, marble floors, and expansive windows that flood the space with natural light. The gourmet kitchen features top-of-the-line appliances and custom cabinetry. Outside, enjoy the private pool, landscaped gardens, and covered patio perfect for outdoor entertaining.',
    type: 'Villa',
    status: 'Sold',
    price: 1200000,
    bedrooms: 4,
    bathrooms: 3,
    area: 3000,
    location: 'Suburbs',
    city: 'Los Angeles',
    state: 'CA',
    images: [
      'https://images.pexels.com/photos/53610/large-home-residential-house-architecture-53610.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
      'https://images.pexels.com/photos/7031607/pexels-photo-7031607.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
      'https://images.pexels.com/photos/7031406/pexels-photo-7031406.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    ],
    features: ['Pool', 'Garden', 'Garage', 'Security System', 'Home Office', 'Wine Cellar', 'Fireplace', 'Smart Home'],
    ownerId: '1',
    createdAt: '2023-02-01T00:00:00.000Z',
    updatedAt: '2023-03-01T00:00:00.000Z',
  },
  {
    id: '103',
    title: 'Cozy House Near Park',
    description: 'A cozy house located near a beautiful park in a family-friendly neighborhood. This charming home offers a perfect blend of classic character and modern updates. The inviting living room features a fireplace and built-in bookshelves. The updated kitchen includes granite countertops and a breakfast nook. The fenced backyard provides a private space for outdoor activities and gardening.',
    type: 'House',
    status: 'Active',
    price: 350000,
    bedrooms: 3,
    bathrooms: 2,
    area: 1800,
    location: 'Suburban',
    city: 'Chicago',
    state: 'IL',
    images: [
      'https://images.pexels.com/photos/206172/pexels-photo-206172.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
      'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
      'https://images.pexels.com/photos/1643384/pexels-photo-1643384.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    ],
    features: ['Backyard', 'Renovated Kitchen', 'Fireplace', 'Hardwood Floors', 'Basement', 'Porch', 'Garage', 'Near Park'],
    ownerId: '1',
    createdAt: '2023-03-01T00:00:00.000Z',
    updatedAt: '2023-03-15T00:00:00.000Z',
  },
];

const PropertyDetailPage = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // In a real app, you would fetch the property from an API
  useEffect(() => {
    const foundProperty = mockProperties.find(p => p.id === id);
    if (foundProperty) {
      setProperty(foundProperty);
    }
  }, [id]);

  if (!property) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading property details...</p>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusClass = () => {
    switch (property.status) {
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
    <div>
      <PageHeader 
        title="Property Details" 
        description={property.title}
        backLink={
          <Link to="/properties" className="flex items-center text-blue-600 hover:text-blue-800">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Properties
          </Link>
        }
        actions={
          <div className="flex space-x-2">
            <button className="text-gray-500 hover:text-blue-600 transition-colors p-2 bg-white rounded-md shadow-sm">
              <Share className="w-5 h-5" />
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
              <Edit className="w-4 h-4 mr-2" />
              Edit Property
            </button>
            <button className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-md flex items-center">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        }
      />

      <div className="mt-6 flex flex-wrap gap-2 mb-6">
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {property.type}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass()}`}>
          {property.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="relative">
              <img
                src={property.images[activeImageIndex]}
                alt={property.title}
                className="w-full h-96 object-cover"
              />
              {property.images.length > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-16 h-16 rounded-md overflow-hidden border-2 ${
                        index === activeImageIndex ? 'border-blue-600' : 'border-transparent'
                      }`}
                    >
                      <img src={image} alt={`${property.title} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 text-gray-500 mr-2" />
                <p className="text-gray-600">
                  {property.location}, {property.city}, {property.state}
                </p>
              </div>
              <h1 className="text-2xl font-bold mb-2">{property.title}</h1>
              <p className="text-3xl font-bold text-blue-600 mb-6">{formatCurrency(property.price)}</p>
              
              <div className="flex flex-wrap gap-4 mb-6">
                {property.bedrooms !== undefined && (
                  <div className="flex items-center">
                    <Bed className="w-5 h-5 text-gray-600 mr-2" />
                    <span>
                      <span className="font-bold">{property.bedrooms}</span> Bedrooms
                    </span>
                  </div>
                )}
                {property.bathrooms !== undefined && (
                  <div className="flex items-center">
                    <Bath className="w-5 h-5 text-gray-600 mr-2" />
                    <span>
                      <span className="font-bold">{property.bathrooms}</span> Bathrooms
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <Square className="w-5 h-5 text-gray-600 mr-2" />
                  <span>
                    <span className="font-bold">{property.area}</span> sq ft
                  </span>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-600 mb-6">{property.description}</p>
              
              <h2 className="text-xl font-semibold mb-3">Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {property.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckSquare className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Property Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Property ID</span>
                <span className="font-medium">{property.id}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Property Type</span>
                <span className="font-medium">{property.type}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Status</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${getStatusClass()}`}>
                  {property.status}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Area</span>
                <span className="font-medium">{property.area} sq ft</span>
              </div>
              {property.bedrooms !== undefined && (
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Bedrooms</span>
                  <span className="font-medium">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms !== undefined && (
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Bathrooms</span>
                  <span className="font-medium">{property.bathrooms}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Location</span>
                <span className="font-medium">{property.location}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">City</span>
                <span className="font-medium">{property.city}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">State</span>
                <span className="font-medium">{property.state}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Listing Information</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Listed Date</p>
                  <p className="font-medium">{formatDate(property.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">{formatDate(property.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;