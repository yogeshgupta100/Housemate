import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt } from 'react-icons/fa';
import './Favorites.css';
import {Backendurl} from "@/App.jsx";
import axios from "axios";
import { backendurl } from '../../../../../admin/src/App';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFavoriteProperties = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${Backendurl}/api/favorites`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                    },
                }
            );

            if (response.data && Array.isArray(response.data.favorites)) {
                setFavorites(response.data.favorites);
            } else {
                setFavorites([]);
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
            setError('Failed to load favorite properties');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("useEffect called");
        fetchFavoriteProperties();
        // eslint-disable-next-line
    }, []);

    const removeFavorite = async (propertyId) => {
        try {
            const response = await axios.delete(
                `${Backendurl}/api/favorites/${propertyId}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                    },
                }
            );
            if (response.data && Array.isArray(response.data.favorites)) {
                setFavorites(response.data.favorites);
            } else {
                setFavorites(prevFavorites =>
                    prevFavorites.filter(property => (property._id || property.id) !== propertyId)
                );
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    };

    if (loading) {
    return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="text-center text-red-600 p-4">
          Error: {error}
        </div>
    );
  }

  return (
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Favorite Properties</h1>

        {favorites?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You haven't saved any properties yet.</p>
              <Link
                  to="/properties"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Properties
              </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites?.map(property => (
                  <div key={property._id || property.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="relative h-48">
                      {property.images?.[0] && property.images.length > 0 ? (
                          <img
                          src={property.images?.[0]}
                              alt={property.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = '/fallback-property-image.jpg';
                              }}
                          />
                      ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">No image available</span>
                          </div>
                      )}
                      <button
                          onClick={() => removeFavorite(property._id || property.id)}
                          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                          aria-label="Remove from favorites"
                      >
                        <FaHeart className="text-red-500 w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2">{property.title}</h3>
                      <p className="text-gray-600 mb-2 flex items-center">
                        <FaMapMarkerAlt className="mr-2" />
                        {property.location || 'Location not specified'}
                      </p>

                      <div className="flex justify-between mb-4">
                  <span className="flex items-center">
                    <FaBed className="mr-1" /> {property.beds || 0}
                  </span>
                        <span className="flex items-center">
                    <FaBath className="mr-1" /> {property.baths || 0}
                  </span>
                        <span className="flex items-center">
                    <FaRulerCombined className="mr-1" /> {property.floorArea || 0} sq ft
                  </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-xl font-bold text-blue-600">
                          ₹{property.price?.toLocaleString() || 0}
                          {property.listingType === 'rent' ? '/month' : ''}
                        </div>
                        <Link
                            to={`/customer-panel/favorites/${property?._id || property?.id}`}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm text-gray-500">
                          {property.propertyStatus === 'ready_to_move' ? 'Ready to Move' : 'Under Construction'}
                        </p>
                        {property.furnishing && (
                            <p className="text-sm text-gray-500">
                              {property.furnishing}
                            </p>
                        )}
                      </div>
                    </div>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
};

export default Favorites;