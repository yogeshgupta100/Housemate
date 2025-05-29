import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Backendurl } from '../../config/index.js';
import { useAuth } from '../../context/AuthContext';
import { FaEdit, FaTrash, FaEye, FaPlus } from 'react-icons/fa';
import './MyProperties.css';

const MyProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Backendurl}/api/products/user-properties`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setProperties(response.data.property);
      setError(null);
    } catch (err) {
      setError('Failed to fetch properties. Please try again later.');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await axios.delete(`${Backendurl}/api/products/${propertyId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchProperties();
      } catch (err) {
        setError('Failed to delete property. Please try again later.');
        console.error('Error deleting property:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading properties...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchProperties}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="my-properties-container">
      <div className="properties-header">
        <h2>My Properties</h2>
        <button className="add-property-btn">
          <FaPlus /> Add New Property
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="no-properties">
          <p>You haven't listed any properties yet.</p>
          <button className="add-property-btn">
            <FaPlus /> List Your First Property
          </button>
        </div>
      ) : (
        <div className="properties-grid">
          {properties.map((property) => (
            <div key={property._id} className="property-card">
              <div className="property-image">
                <img src={property.images[0]} alt={property.title} />
              </div>
              <div className="property-details">
                <h3>{property.title}</h3>
                <p className="property-price">₹{property.price.toLocaleString()}</p>
                <p className="property-location">{property.location}</p>
                <div className="property-stats">
                  <span>{property.beds} Beds</span>
                  <span>{property.baths} Baths</span>
                  <span>{property.floorArea} sq.ft</span>
                </div>
                <div className="property-status">
                  <span className={`status ${property.status.toLowerCase()}`}>
                    {property.status}
                  </span>
                </div>
              </div>
              <div className="property-actions">
                <button className="action-btn view" title="View Details">
                  <FaEye />
                </button>
                <button className="action-btn edit" title="Edit Property">
                  <FaEdit />
                </button>
                <button 
                  className="action-btn delete" 
                  title="Delete Property"
                  onClick={() => handleDelete(property._id)}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProperties; 