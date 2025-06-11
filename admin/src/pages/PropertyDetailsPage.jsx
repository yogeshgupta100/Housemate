import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader } from 'lucide-react';
import PropertyDetails from '../components/PropertyDetails';
import { backendurl } from '../App';

const PropertyDetailsPage = () => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${backendurl}/api/properties/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          setProperty(response.data.property);
        } else {
          toast.error(response.data.message || "Failed to fetch property details");
          navigate('/list');
        }
      } catch (error) {
        console.error("Error fetching property:", error);
        toast.error("Failed to fetch property details");
        navigate('/list');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, navigate]);

  const handleRemoveProperty = async (propertyId) => {
    try {
      const response = await axios.delete(`${backendurl}/api/properties/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        toast.success("Property removed successfully");
        navigate('/list');
      } else {
        toast.error(response.data.message || "Failed to remove property");
      }
    } catch (error) {
      console.error("Error removing property:", error);
      toast.error("Failed to remove property");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Property not found</p>
          <button
            onClick={() => navigate('/list')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  return <PropertyDetails property={property} onRemove={handleRemoveProperty} />;
};

export default PropertyDetailsPage; 