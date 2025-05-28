import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Backendurl } from '../../config/index.js';
import { useAuth } from '../../context/AuthContext';
import { FaCopy, FaCheck } from 'react-icons/fa';
import './MyCoupons.css';

const MyCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchUserCoupons();
  }, []);

  const fetchUserCoupons = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Backendurl}/api/coupons/user-coupons`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCoupons(response.data.coupons);
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An error occurred. Please try again.";
      setError(errorMessage);
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your coupons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchUserCoupons}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="my-coupons-container">
      <div className="my-coupons-header">
        <h2>My Coupons</h2>
        <p className="subtitle">Available offers and discounts for your account</p>
      </div>

      {coupons.length === 0 ? (
        <div className="no-coupons">
          <p>You don&apos;t have any active coupons at the moment.</p>
          <p className="hint">Check back later for new offers!</p>
        </div>
      ) : (
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
                </div>
              </div>
              <div className="coupon-actions">
                <button 
                  className={`action-btn copy ${copiedCode === coupon.code ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(coupon.code)}
                >
                  {copiedCode === coupon.code ? <FaCheck /> : <FaCopy />}
                  <span>{copiedCode === coupon.code ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCoupons; 