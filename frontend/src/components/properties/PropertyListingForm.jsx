import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Backendurl } from '../../App';
import {
  Home,
  IndianRupee,
  Phone,
  Mail,
  Building,
  Upload,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PROPERTY_TYPES = ['house', 'apartment', 'office', 'villa', 'pg', 'flat', 'rk'];
const AVAILABILITY_TYPES = ['rent', 'sale', 'buy'];
const AMENITIES = ['Lake View', 'Fireplace', 'Central heating and air conditioning', 'Dock', 'Pool', 'Garage', 'Garden', 'Gym', 'Security system', 'Master bathroom', 'Guest bathroom', 'Home theater', 'Exercise room/gym', 'Covered parking', 'High-speed internet ready'];

const PropertyListingForm = () => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    price: '',
    location: '',
    description: '',
    beds: '',
    baths: '',
    sqft: '',
    phone: '',
    availability: '',
    amenities: [],
    images: [],
    listingType: 'rent'
  });

  const [previewUrls, setPreviewUrls] = useState([]);

  // Check if user is allowed to list property and load draft if exists
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    // Check if user is corporate
    if (user?.userType === "corporate") {
      setError("Corporate users cannot list properties. Please contact support for assistance.");
      return;
    }

    // Set default contact information based on user type
    if (user) {
      setFormData(prev => ({
        ...prev,
        contact: {
          name: user.name || "",
          phone: user.phone || "",
          email: user.email || "",
        }
      }));
    }

    // Load draft if draftId exists
    if (draftId) {
      loadDraft(draftId);
    }
  }, [isLoggedIn, user, navigate, draftId]);

  const loadDraft = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${Backendurl}/api/properties/drafts/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setFormData(response.data.draft);
      toast.info('Draft loaded successfully');
    } catch (err) {
      console.error('Error loading draft:', err);
      toast.error('Failed to load draft');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const handleSaveDraft = async () => {
    if (!isLoggedIn) {
      toast.info("Please login to save a draft");
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to save a draft');
        navigate("/login");
        return;
      }

      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'images') {
          value.forEach(file => {
            formDataToSend.append('images', file);
          });
        } else if (typeof value === 'object') {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, value);
        }
      });

      const url = draftId 
        ? `${Backendurl}/api/properties/drafts/${draftId}`
        : `${Backendurl}/api/properties/drafts`;

      const method = draftId ? 'put' : 'post';

      const response = await axios[method](
        url,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success(draftId ? 'Draft updated successfully!' : 'Draft saved successfully!');
        navigate('/dashboard/draft-properties');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setError(error.response?.data?.message || 'Failed to save draft');
      toast.error(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      toast.info("Please login to list a property");
      navigate("/login");
      return;
    }

    if (user?.userType === "corporate") {
      setError("Corporate users cannot list properties. Please contact support for assistance.");
      toast.error("Corporate users cannot list properties");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to list a property');
        navigate("/login");
        return;
      }

      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'images') {
          value.forEach(file => {
            formDataToSend.append('images', file);
          });
        } else if (typeof value === 'object') {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, value);
        }
      });

      const response = await axios.post(
        `${Backendurl}/api/properties/add`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        toast.success('Property listed successfully!');
        // navigate(`/properties/${response.data.property._id}`);
      }
    } catch (error) {
      console.error('Error listing property:', error);
      setError(error.response?.data?.message || 'Failed to list property');
      toast.error(error.response?.data?.message || 'Failed to list property');
    } finally {
      setLoading(false);
    }
  };

  //will user latwr

  const getUserSpecificFields = () => {
    if (!user) return null;

    switch (user.userType) {
      case "dealer":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Dealer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">License Number</label>
                <input
                  type="text"
                  name="dealerLicense"
                  value={formData.dealerLicense || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
                <input
                  type="number"
                  name="dealerExperience"
                  value={formData.dealerExperience || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>
        );
      case "admin":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Admin Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Property Status</label>
                <select
                  name="status"
                  value={formData.status || "active"}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Verification Status</label>
                <select
                  name="verified"
                  value={formData.verified || false}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={true}>Verified</option>
                  <option value={false}>Unverified</option>
                </select>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  if (user?.userType === "corporate") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800">Access Restricted</h2>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 pt-16"
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">List Your Property</h1>
          <p className="mt-2 text-gray-600">Fill in the details to list your property</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-xl shadow-lg p-6 md:p-8">
          {/* Basic Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter property title"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter property location"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the property..."
              />
            </div>
          </div>

          {/* Property Details Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Property Details</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  {PROPERTY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="₹"
                />
              </div>
              <div>
                <label htmlFor="beds" className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrooms
                </label>
                <input
                  type="number"
                  id="beds"
                  name="beds"
                  required
                  value={formData.beds}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="baths" className="block text-sm font-medium text-gray-700 mb-1">
                  Bathrooms
                </label>
                <input
                  type="number"
                  id="baths"
                  name="baths"
                  required
                  value={formData.baths}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 pb-2 border-b">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sqft" className="block text-sm font-medium text-gray-700 mb-1">
                  Square Feet
                </label>
                <input
                  type="number"
                  id="sqft"
                  name="sqft"
                  required
                  value={formData.sqft}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
                  Availability Status
                </label>
                <select
                  id="availability"
                  name="availability"
                  required
                  value={formData.availability}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Status</option>
                  {AVAILABILITY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Amenities Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Amenities</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {AMENITIES.map(amenity => (
                <label key={amenity} className="flex items-center space-x-2 text-sm hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    value={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => {
                      const value = amenity;
                      setFormData(prev => ({
                        ...prev,
                        amenities: formData.amenities.includes(value)
                          ? formData.amenities.filter(item => item !== value)
                          : [...formData.amenities, value]
                      }));
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Property Images</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group aspect-video">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="h-full w-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        images: prev.images.filter((_, i) => i !== index)
                      }));
                      setPreviewUrls(prev => prev.filter((_, i) => i !== index));
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Upload Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 flex gap-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {draftId ? 'Update Draft' : 'Save as Draft'}
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'List Property'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default PropertyListingForm;