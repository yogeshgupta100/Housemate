import { Home, IndianRupee, Filter, Bed, Bath, Calendar, MapPin, Building, Star } from "lucide-react";
import { motion } from "framer-motion";
import React, { useRef, useEffect, useCallback } from "react";

const propertyTypes = ["House", "Apartment", "Villa", "Office", "PG", "Flat", "RK"];
const availabilityTypes = ["Rent", "Buy", "Lease"];
const furnishingTypes = ["Furnished", "Semi-Furnished", "Unfurnished"];
const propertyConditions = ["New", "Good", "Average", "Needs Repair"];
const propertyStatuses = ["Ready to Move", "Under Construction", "Renovated"];

const MIN_PRICE = 0;
const MAX_PRICE = 50000000;
const STEP = 50000;

const FilterSection = ({ filters, setFilters, onApplyFilters }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const debouncedPriceUpdate = useCallback(
    debounce((value) => {
      setFilters(prev => ({
        ...prev,
        priceRange: [MIN_PRICE, value]
      }));
    }, 300),
    []
  );

  const handlePriceSlider = (e) => {
    const value = Number(e.target.value);

    document.getElementById('maxPriceDisplay').textContent = value.toLocaleString();
    
    debouncedPriceUpdate(value);
  };

  const handleAmenityChange = (amenity) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleReset = () => {
    setFilters({
      propertyType: "",
      priceRange: [0, Number.MAX_SAFE_INTEGER],
      bedrooms: "0",
      bathrooms: "0",
      availability: "",
      searchQuery: "",
      sortBy: "",
      furnishing: "",
      propertyCondition: "",
      propertyStatus: "",
      amenities: [],
      minArea: "",
      maxArea: "",
      floorNo: "",
      totalFloors: "",
      verifiedOnly: false
    });
  };

  const rangeRef = useRef(null);

  // Ensure min <= max and max >= min
  const minValue = Math.min(filters.priceRange[0], filters.priceRange[1]);
  const maxValue = Math.max(filters.priceRange[0], filters.priceRange[1]);

  const handleRangeChange = (e) => {
    const [min, max] = e.target.value.split(',').map(Number);
    setFilters(prev => ({
      ...prev,
      priceRange: [min, max]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white p-6 pt-0 rounded-xl shadow-lg max-h-[80vh] overflow-y-auto"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-6 sticky top-0 bg-white h-full z-10">
        <div className="flex items-center space-x-2 w-full">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        <button
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Reset All
        </button>
      </div>

      <div className="space-y-6">
        {/* Property Type */}
        <div className="filter-group">
          <label className="filter-label">
            <Home className="w-4 h-4 mr-2" />
            Property Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {propertyTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleChange({
                  target: { name: "propertyType", value: type.toLowerCase() }
                })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${filters.propertyType === type.toLowerCase()
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="filter-group">
          <label className="filter-label">
            <IndianRupee className="w-4 h-4 mr-2" />
            Price Range
          </label>
          <div className="flex flex-col gap-2">
            <input
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={STEP}
              value={filters.priceRange[1]}
              onChange={handlePriceSlider}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>₹{MIN_PRICE.toLocaleString()}</span>
              <span>₹<span id="maxPriceDisplay">{Number(filters.priceRange[1]).toLocaleString()}</span></span>
            </div>
          </div>
        </div>

        {/* Beds & Baths */}
        <div className="grid grid-cols-2 gap-4">
          <div className="filter-group">
            <label className="filter-label">
              <Bed className="w-4 h-4 mr-2" />
              Bedrooms
            </label>
            <select
              name="bedrooms"
              value={filters.bedrooms}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Bath className="w-4 h-4 mr-2" />
              Bathrooms
            </label>
            <select
              name="bathrooms"
              value={filters.bathrooms}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
        </div>

        {/* Area Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="filter-group">
            <label className="filter-label">
              <Building className="w-4 h-4 mr-2" />
              Min Area (sq ft)
            </label>
            <input
              type="number"
              name="minArea"
              value={filters.minArea}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              placeholder="Min area"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Building className="w-4 h-4 mr-2" />
              Max Area (sq ft)
            </label>
            <input
              type="number"
              name="maxArea"
              value={filters.maxArea}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              placeholder="Max area"
            />
          </div>
        </div>

        {/* Property Condition & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="filter-group">
            <label className="filter-label">
              <Star className="w-4 h-4 mr-2" />
              Condition
            </label>
            <select
              name="propertyCondition"
              value={filters.propertyCondition}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any</option>
              {propertyConditions.map(condition => (
                <option key={condition} value={condition.toLowerCase()}>
                  {condition}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Calendar className="w-4 h-4 mr-2" />
              Status
            </label>
            <select
              name="propertyStatus"
              value={filters.propertyStatus}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any</option>
              {propertyStatuses.map(status => (
                <option key={status} value={status.toLowerCase().replace(' ', '_')}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Furnishing */}
        <div className="filter-group">
          <label className="filter-label">
            <Home className="w-4 h-4 mr-2" />
            Furnishing
          </label>
          <div className="grid grid-cols-3 gap-2">
            {furnishingTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleChange({
                  target: { name: "furnishing", value: type.toLowerCase() }
                })}
                className={`py-2 rounded-lg text-sm font-medium px-2 transition-all flex justify-center items-center
                  ${filters.furnishing === type.toLowerCase()
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="filter-group">
          <label className="filter-label">
            <Star className="w-4 h-4 mr-2" />
            Amenities
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Parking', 'Gym', 'Swimming Pool', 'Garden',
              'Security', 'Power Backup', 'Lift', 'Park',
              'Club House', 'Play Area', 'Sports Facility'
            ].map((amenity) => (
              <label key={amenity} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.amenities.includes(amenity)}
                  onChange={() => handleAmenityChange(amenity)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Verified Only */}
        <div className="filter-group">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="verifiedOnly"
              checked={filters.verifiedOnly}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Verified Properties Only</span>
          </label>
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={() => onApplyFilters(filters)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 
              transition-colors font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FilterSection;