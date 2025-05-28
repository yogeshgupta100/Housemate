import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Backendurl } from '../../config/index.js';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import './DraftProperties.css';

const DraftProperties = () => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDraftProperties();
  }, []);

  const fetchDraftProperties = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Backendurl}/api/properties/drafts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDrafts(response.data.drafts);
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An error occurred. Please try again.";
      setError(errorMessage);
      console.error('Error fetching draft properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (draftId) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      try {
        await axios.delete(`${Backendurl}/api/properties/drafts/${draftId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchDraftProperties();
      } catch (err) {
        const errorMessage = err.response?.data?.message || "An error occurred. Please try again.";
        setError(errorMessage);
        console.error('Error deleting draft:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading draft properties...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchDraftProperties}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="draft-properties-container">
      <div className="draft-properties-header">
        <h2>Draft Properties</h2>
        <Link to="/list-property" className="new-property-btn">
          Create New Property
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="no-drafts">
          <p>You don't have any draft properties.</p>
          <Link to="/list-property" className="create-first-btn">
            Create Your First Property
          </Link>
        </div>
      ) : (
        <div className="drafts-grid">
          {drafts.map((draft) => (
            <div key={draft._id} className="draft-card">
              <div className="draft-image">
                {draft.images && draft.images[0] ? (
                  <img src={draft.images[0]} alt={draft.title} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
              <div className="draft-details">
                <h3>{draft.title}</h3>
                <p className="draft-price">₹{draft.price.toLocaleString()}</p>
                <p className="draft-location">
                  <i className="fas fa-map-marker-alt"></i>
                  {draft.location}
                </p>
                <p className="draft-type">{draft.propertyType}</p>
                <div className="draft-meta">
                  <span>Last updated: {new Date(draft.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="draft-actions">
                <Link 
                  to={`/list-property?draft=${draft._id}`}
                  className="action-btn edit"
                  title="Edit Draft"
                >
                  <FaEdit />
                  <span>Edit</span>
                </Link>
                <Link 
                  to={`/properties/single/${draft._id}`}
                  className="action-btn view"
                  title="Preview"
                >
                  <FaEye />
                  <span>Preview</span>
                </Link>
                <button 
                  className="action-btn delete"
                  title="Delete Draft"
                  onClick={() => handleDelete(draft._id)}
                >
                  <FaTrash />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DraftProperties; 