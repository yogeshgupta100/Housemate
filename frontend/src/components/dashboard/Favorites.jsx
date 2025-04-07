import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt } from 'react-icons/fa';
import './Favorites.css';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/user/favorites');
      const data = await response.json();
      
      if (response.ok) {
        setFavorites(data);
      } else {
        throw new Error(data.message || 'Failed to fetch favorites');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (propertyId) => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/api/user/favorites/${propertyId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setFavorites(prev => prev.filter(fav => fav._id !== propertyId));
      } else {
        throw new Error('Failed to remove favorite');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="favorites-loading">Loading...</div>;
  }

  if (error) {
    return <div className="favorites-error">{error}</div>;
  }

  return (
    <div className="favorites-container">
      <h1>Favorite Properties</h1>
      
      {favorites.length === 0 ? (
        <div className="no-favorites">
          <p>You haven't saved any properties yet.</p>
          <Link to="/properties" className="browse-button">
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map(property => (
            <div key={property._id} className="favorite-card">
              <div className="property-image">
                <img src={property.images[0]} alt={property.title} />
                <button 
                  className="remove-favorite"
                  onClick={() => removeFavorite(property._id)}
                >
                  <FaHeart />
                </button>
              </div>
              
              <div className="property-details">
                <h3>{property.title}</h3>
                <p className="property-location">
                  <FaMapMarkerAlt /> {property.location.address}
                </p>
                
                <div className="property-features">
                  <span>
                    <FaBed /> {property.bedrooms}
                  </span>
                  <span>
                    <FaBath /> {property.bathrooms}
                  </span>
                  <span>
                    <FaRulerCombined /> {property.floorArea} sq ft
                  </span>
                </div>
                
                <div className="property-price">
                  ₹{property.price.toLocaleString()}
                  {property.listingType === 'rent' ? '/month' : ''}
                </div>
                
                <Link 
                  to={`/properties/${property._id}`}
                  className="view-details-button"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites; 