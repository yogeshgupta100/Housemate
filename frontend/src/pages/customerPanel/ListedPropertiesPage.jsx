import React, { useState } from 'react';
import { Search, Filter, Home, Plus } from 'lucide-react';
import PageHeader from '../../components/customerPanel/common/PageHeader';
import PropertyCard from '../../components/customerPanel/profile/ProfileCard';

const mockProperties = [
  {
    id: '101',
    title: 'Modern Apartment in Downtown',
    description: 'A beautiful modern apartment in the heart of downtown',
    type: 'Apartment',
    status: 'Active',
    price: 450000,
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    location: 'Downtown',
    city: 'New York',
    state: 'NY',
    images: ['https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750'],
    features: ['Parking', 'Gym', 'Pool'],
    ownerId: '1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-02-15T00:00:00.000Z',
  },
  {
    id: '102',
    title: 'Luxury Villa with Pool',
    description: 'Spacious luxury villa with a private pool',
    type: 'Villa',
    status: 'Sold',
    price: 1200000,
    bedrooms: 4,
    bathrooms: 3,
    area: 3000,
    location: 'Suburbs',
    city: 'Los Angeles',
    state: 'CA',
    images: ['https://images.pexels.com/photos/53610/large-home-residential-house-architecture-53610.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750'],
    features: ['Pool', 'Garden', 'Garage'],
    ownerId: '1',
    createdAt: '2023-02-01T00:00:00.000Z',
    updatedAt: '2023-03-01T00:00:00.000Z',
  },
  {
    id: '103',
    title: 'Cozy House Near Park',
    description: 'A cozy house located near a beautiful park',
    type: 'House',
    status: 'Active',
    price: 350000,
    bedrooms: 3,
    bathrooms: 2,
    area: 1800,
    location: 'Suburban',
    city: 'Chicago',
    state: 'IL',
    images: ['https://images.pexels.com/photos/206172/pexels-photo-206172.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750'],
    features: ['Backyard', 'Renovated Kitchen', 'Fireplace'],
    ownerId: '1',
    createdAt: '2023-03-01T00:00:00.000Z',
    updatedAt: '2023-03-15T00:00:00.000Z',
  },
];

const ListedPropertiesPage = () => {
  const [properties, setProperties] = useState(mockProperties);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          property.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || property.type === filterType;
    const matchesStatus = !filterStatus || property.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div>
      <PageHeader 
        title="My Properties" 
        description="View and manage your listed properties"
        actions={
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add New Property
          </button>
        }
      />
      
      <div className="mt-6 mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Villa">Villa</option>
              <option value="Commercial">Commercial</option>
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Sold">Sold</option>
              <option value="Rented">Rented</option>
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Found</h3>
          <p className="text-gray-500 mb-6">
            You haven't added any properties yet, or none match your search criteria.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ListedPropertiesPage;