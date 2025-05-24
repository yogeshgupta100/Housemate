import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { backendurl } from '../App';
import { Upload, X, IndianRupee } from 'lucide-react';

const PROPERTY_TYPES = {
  rent: ['house', 'apartment', 'office', 'villa', 'pg', 'flat', 'rk', 'commercial'],
  sale: ['house', 'apartment', 'office', 'villa', 'flat', 'commercial', 
         'residential plot', 'commercial plot']
};

const LISTING_TYPES = ['rent', 'sale'];
const LEASE_PERIODS = ['3 months', '6 months', '12 months', '18 months', '24 months'];
const AMENITIES = ['Lake View', 'Fireplace', 'Central heating and air conditioning', 'Dock', 'Pool', 'Garage', 'Garden', 'Gym', 'Security system', 'Master bathroom', 'Guest bathroom', 'Home theater', 'Exercise room/gym', 'Covered parking', 'High-speed internet ready'];
const PROPERTY_CONDITIONS = ['new', 'good', 'average', 'needs_repair'];
const PROPERTY_STATUSES = ['ready_to_move', 'under_construction', 'renovated'];

const PropertyForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    price: '',
    location: '',
    coordinates: {
      latitude: 0,
      longitude: 0
    },
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    description: '',
    beds: '',
    baths: '',
    sqft: '',
    phone: '',
    availability: {
      status: 'Available',
      availableFrom: '',
      minLeasePeriod: '12 months'
    },
    amenities: [],
    images: [],
    listingType: 'rent',
    propertyAge: '',
    propertyCondition: '',
    propertyStatus: ''
  });

  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculatedDeposit, setCalculatedDeposit] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const locationInputRef = useRef(null);

  // Add Google Places Autocomplete
  useEffect(() => {
    if (!locationInputRef.current || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
      componentRestrictions: { country: 'IN' },
      fields: ['address_components', 'geometry', 'formatted_address']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry) {
        toast.error('Please select a location from the suggestions');
        return;
      }

      // Extract address components
      const addressComponents = {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      };

      place.address_components.forEach(component => {
        const types = component.types;

        if (types.includes('street_number') || types.includes('route')) {
          addressComponents.street += component.long_name + ' ';
        }
        if (types.includes('locality')) {
          addressComponents.city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          addressComponents.state = component.long_name;
        }
        if (types.includes('postal_code')) {
          addressComponents.pincode = component.long_name;
        }
      });

      // Update form data with location details
      setFormData(prev => ({
        ...prev,
        location: place.formatted_address,
        coordinates: {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        },
        address: {
          street: addressComponents.street.trim(),
          city: addressComponents.city,
          state: addressComponents.state,
          pincode: addressComponents.pincode,
          country: 'India'
        }
      }));
    });

    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []);

  // Calculate deposit when price or type changes
  useEffect(() => {
    if (formData.listingType === 'rent' && formData.price && formData.type) {
      const multipliers = {
        'house': 2,
        'apartment': 3,
        'office': 3,
        'villa': 3,
        'commercial': 3,
        'flat': 2,
        'pg': 1,
        'rk': 1
      };
      setCalculatedDeposit(formData.price * (multipliers[formData.type] || 2));
    }
  }, [formData.price, formData.type, formData.listingType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      // Validate numeric fields
      if (type === 'number') {
        const numValue = Number(value);
        if (numValue < 0) return;
        if ((name === 'beds' || name === 'baths') && !Number.isInteger(numValue)) return;
      }

      // Update form data
      if (name === 'listingType') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          type: '',
          propertyAge: value === 'sale' ? '' : undefined,
          propertyCondition: value === 'sale' ? '' : undefined,
          propertyStatus: value === 'sale' ? '' : undefined
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
        }));
      }
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Basic info
      formDataToSend.append('title', formData.title);
      formDataToSend.append('type', formData.type.toLowerCase());
      formDataToSend.append('price', formData.price);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('beds', formData.beds);
      formDataToSend.append('baths', formData.baths);
      formDataToSend.append('sqft', formData.sqft);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('listingType', formData.listingType.toLowerCase());
      formDataToSend.append('amenities', JSON.stringify(formData.amenities));

      // Location data
      formDataToSend.append('coordinates', JSON.stringify(formData.coordinates));
      formDataToSend.append('address', JSON.stringify(formData.address));

      // Images
      formData.images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      if (formData.listingType === 'sale') {
        formDataToSend.append('propertyAge', formData.propertyAge);
        formDataToSend.append('propertyCondition', formData.propertyCondition);
        formDataToSend.append('propertyStatus', formData.propertyStatus);
      }

      if (formData.listingType === 'rent') {
        formDataToSend.append('availability', JSON.stringify({
          status: 'Available',
          availableFrom: new Date(formData.availability.availableFrom).toISOString(),
          minLeasePeriod: formData.availability.minLeasePeriod
        }));
      }

      formDataToSend.append('userId', '657089f229c2df66a7ea7c0d');
      formDataToSend.append('createdBy', '657089f229c2df66a7ea7c0d');

      const response = await axios.post(`${backendurl}/api/properties/add`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        toast.success('Property added successfully');
        // Reset form
        setFormData({
          title: '',
          type: '',
          price: '',
          location: '',
          coordinates: {
            latitude: 0,
            longitude: 0
          },
          address: {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
          },
          description: '',
          beds: '',
          baths: '',
          sqft: '',
          phone: '',
          availability: {
            status: 'Available',
            availableFrom: '',
            minLeasePeriod: '12 months'
          },
          amenities: [],
          images: [],
          listingType: 'rent',
          propertyAge: '',
          propertyCondition: '',
          propertyStatus: ''
        });
        setPreviewUrls([]);
      }
    } catch (error) {
      console.error('Error adding property:', error);
      toast.error(error.response?.data?.message || 'Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        {}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
          <p className="mt-2 text-gray-600">Fill in the details to list a new property</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-xl shadow-lg p-6 md:p-8">
          {}
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
                  ref={locationInputRef}
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
                  {PROPERTY_TYPES[formData.listingType].map(type => (
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
                <label htmlFor="availability.status" className="block text-sm font-medium text-gray-700 mb-1">
                  Availability Status
                </label>
                <select
                  id="availability.status"
                  name="availability.status"
                  required
                  value={formData.availability.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>
              {formData.listingType === 'rent' && (
                <>
                  <div>
                    <label htmlFor="availability.availableFrom" className="block text-sm font-medium text-gray-700 mb-1">
                      Available From
                    </label>
                    <input
                      type="date"
                      id="availability.availableFrom"
                      name="availability.availableFrom"
                      required
                      value={formData.availability.availableFrom}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="availability.minLeasePeriod" className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Lease Period
                    </label>
                    <select
                      id="availability.minLeasePeriod"
                      name="availability.minLeasePeriod"
                      required
                      value={formData.availability.minLeasePeriod}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {LEASE_PERIODS.map(period => (
                        <option key={period} value={period}>{period}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {formData.listingType === 'sale' && (
                <>
                  <div>
                    <label htmlFor="propertyAge" className="block text-sm font-medium text-gray-700 mb-1">
                      Property Age
                    </label>
                    <input
                      type="number"
                      id="propertyAge"
                      name="propertyAge"
                      required
                      value={formData.propertyAge}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="propertyCondition" className="block text-sm font-medium text-gray-700 mb-1">
                      Property Condition
                    </label>
                    <select
                      id="propertyCondition"
                      name="propertyCondition"
                      required
                      value={formData.propertyCondition}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PROPERTY_CONDITIONS.map(condition => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="propertyStatus" className="block text-sm font-medium text-gray-700 mb-1">
                      Property Status
                    </label>
                    <select
                      id="propertyStatus"
                      name="propertyStatus"
                      required
                      value={formData.propertyStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PROPERTY_STATUSES.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

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
                    onChange={() => handleAmenityToggle(amenity)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{amenity}</span>
                </label>
              ))}
            </div>
          </div>

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
                    onClick={() => removeImage(index)}
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
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Property...' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyForm;