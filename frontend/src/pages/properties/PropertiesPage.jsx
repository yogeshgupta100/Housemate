import { useState, useEffect } from 'react';
import axios from 'axios';
import PropertyCard from '../../components/PropertyCard';
import PropertyFilters from '../../components/PropertyFilters';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-toastify';
const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    listingType: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    city: '',
    state: '',
    beds: '',
    baths: '',
    furnishing: '',
    sortBy: 'newest'
  });

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/properties`, {
        params: filters
      });
      setProperties(response.data.data || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred. Please try again.";
      console.error('Error fetching properties:', errorMessage);
      toast.error(errorMessage);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {}
        <div className="w-full md:w-1/4">
          <PropertyFilters filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {}
        <div className="w-full md:w-3/4">
          {loading ? (
            <LoadingSpinner size="large" />
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map(property => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Try adjusting your filters to find more properties.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertiesPage; 