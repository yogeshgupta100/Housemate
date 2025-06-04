import React, { useState, useEffect } from 'react';
import { Search, Filter, Home, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Backendurl } from '../../App.jsx';
import PageHeader from '../../components/customerPanel/common/PageHeader';
import PropertyListing from '../../components/properties/PropertyListing';
import { useAuth } from '../../context/AuthContext';

const ListedPropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    types: [],
    statuses: [],
    cities: [],
    priceRange: { min: 0, max: 0 }
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log({user});

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await axios.get(`${Backendurl}/api/properties/filter-options`);
        if (response.data.success) {
          setFilterOptions(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!user?.data?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${Backendurl}/api/properties/user/${user?.data?.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('API Response:', response.data);
        console.log('Properties:', response.data.data.properties);

        if (response.data.success) {
          setProperties(response.data.data.properties || []);
        } else {
          setError('Failed to fetch properties');
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [user]);

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
          <button onClick={() => {navigate('/list-property')}} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add New Property
          </button>
        }
      />
      
      <PropertyListing
        properties={filteredProperties}
        loading={loading}
        error={error}
        isGridView={true}
      >
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
                {filterOptions.types.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
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
                {filterOptions.statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
        </div>
      </PropertyListing>
    </div>
  );
};

export default ListedPropertiesPage;