import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Backendurl } from '../../config/index.js';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaCopy, FaUserPlus, FaBuilding } from 'react-icons/fa';
import './Coupons.css';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage', // percentage or fixed
    value: '',
    minPurchase: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    description: '',
    applicableFor: 'all', // all, residential, commercial
    assignType: 'manual', // manual, automatic, bulk
    assignTo: [], // user IDs or corporate IDs
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Backendurl}/api/coupons`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCoupons(response.data.coupons);
      setError(null);
    } catch (err) {
      setError('Failed to fetch coupons. Please try again later.');
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCoupon) {
        await axios.put(`${Backendurl}/api/coupons/${selectedCoupon._id}`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      } else {
        await axios.post(`${Backendurl}/api/coupons`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      setShowModal(false);
      fetchCoupons();
      resetForm();
    } catch (err) {
      setError('Failed to save coupon. Please try again later.');
      console.error('Error saving coupon:', err);
    }
  };

  const handleDelete = async (couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await axios.delete(`${Backendurl}/api/coupons/${couponId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchCoupons();
      } catch (err) {
        setError('Failed to delete coupon. Please try again later.');
        console.error('Error deleting coupon:', err);
      }
    }
  };

  const handleEdit = (coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minPurchase: coupon.minPurchase,
      maxDiscount: coupon.maxDiscount,
      startDate: coupon.startDate.split('T')[0],
      endDate: coupon.endDate.split('T')[0],
      usageLimit: coupon.usageLimit,
      description: coupon.description,
      applicableFor: coupon.applicableFor,
      assignType: coupon.assignType,
      assignTo: coupon.assignTo,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setSelectedCoupon(null);
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      minPurchase: '',
      maxDiscount: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      description: '',
      applicableFor: 'all',
      assignType: 'manual',
      assignTo: [],
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading coupons...</p>
      </div>
    );
  }

  return (
    <div className="coupons-container">
      <div className="coupons-header">
        <h2>Coupon Management</h2>
        <button 
          className="add-coupon-btn"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <FaPlus /> Create New Coupon
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="coupons-grid">
        {coupons.map((coupon) => (
          <div key={coupon._id} className="coupon-card">
            <div className="coupon-header">
              <h3>{coupon.code}</h3>
              <span className={`coupon-type ${coupon.type}`}>
                {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
              </span>
            </div>
            <div className="coupon-details">
              <p>{coupon.description}</p>
              <div className="coupon-info">
                <span>Min. Purchase: ₹{coupon.minPurchase}</span>
                <span>Max. Discount: ₹{coupon.maxDiscount}</span>
                <span>Usage Limit: {coupon.usageLimit}</span>
              </div>
              <div className="coupon-dates">
                <span>Valid: {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}</span>
              </div>
              <div className="coupon-applicable">
                <span>Applicable for: {coupon.applicableFor}</span>
                <span>Assign Type: {coupon.assignType}</span>
              </div>
            </div>
            <div className="coupon-actions">
              <button 
                className="action-btn copy" 
                title="Copy Code"
                onClick={() => copyToClipboard(coupon.code)}
              >
                <FaCopy />
              </button>
              <button 
                className="action-btn edit" 
                title="Edit Coupon"
                onClick={() => handleEdit(coupon)}
              >
                <FaEdit />
              </button>
              <button 
                className="action-btn delete" 
                title="Delete Coupon"
                onClick={() => handleDelete(coupon._id)}
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{selectedCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Coupon Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div className="form-group">
                <label>Value</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Minimum Purchase</label>
                <input
                  type="number"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData({...formData, minPurchase: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Maximum Discount</label>
                <input
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Usage Limit</label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Applicable For</label>
                <select
                  value={formData.applicableFor}
                  onChange={(e) => setFormData({...formData, applicableFor: e.target.value})}
                  required
                >
                  <option value="all">All Properties</option>
                  <option value="residential">Residential Only</option>
                  <option value="commercial">Commercial Only</option>
                </select>
              </div>
              <div className="form-group">
                <label>Assignment Type</label>
                <select
                  value={formData.assignType}
                  onChange={(e) => setFormData({...formData, assignType: e.target.value})}
                  required
                >
                  <option value="manual">Manual Assignment</option>
                  <option value="automatic">Automatic Assignment</option>
                  <option value="bulk">Bulk Assignment</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit">{selectedCoupon ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons; 