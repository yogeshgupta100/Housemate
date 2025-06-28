import { Home, IndianRupee, Filter, Bed, Bath, Calendar, MapPin, Building, Star, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import React, { useRef, useEffect, useCallback } from "react";

const propertyTypes = ["House", "Apartment", "Villa", "Office", "PG", "Flat", "RK"];
const availabilityTypes = ["Rent", "Buy", "Lease"];
const furnishingTypes = ["Furnished", "Semi-Furnished", "Unfurnished"];
const propertyConditions = ["New", "Good", "Average", "Needs Repair"];
const propertyStatuses = ["Ready to Move", "Under Construction", "Renovated"];
const pgTypes = ["Boys", "Girls", "Co-living"];
const sharingTypes = ["Single", "Double", "Triple", "Quad"];

const MIN_PRICE = 0;
const MAX_PRICE = 50000000;
const STEP = 50000;

const FilterSection = ({ filters, setFilters, onApplyFilters, onReset }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedFilters = {
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    };
    setFilters(updatedFilters);
    onApplyFilters(updatedFilters);
  };

  const handleButtonChange = (name, value) => {
    const updatedFilters = {
      ...filters,
      [name]: value
    };
    setFilters(updatedFilters);
    onApplyFilters(updatedFilters);
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
      const updatedFilters = {
        ...filters,
        priceRange: [MIN_PRICE, value]
      };
      setFilters(updatedFilters);
      onApplyFilters(updatedFilters);
    }, 500),
    [filters, setFilters, onApplyFilters]
  );

  const handlePriceSlider = (e) => {
    const value = Number(e.target.value);
    document.getElementById('maxPriceDisplay').textContent = value.toLocaleString();
    debouncedPriceUpdate(value);
  };

  const handleAmenityChange = (amenity) => {
    const updatedAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    
    const updatedFilters = {
      ...filters,
      amenities: updatedAmenities
    };
    setFilters(updatedFilters);
    onApplyFilters(updatedFilters);
  };

  const handleReset = () => {
    const resetFilters = {
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
      verifiedOnly: false,
      pgType: "",
      sharingType: "",
      hasBalcony: false,
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
    if (onReset) onReset();
  };

  const rangeRef = useRef(null);

  // Ensure min <= max and max >= min
  const minValue = Math.min(filters.priceRange[0], filters.priceRange[1]);
  const maxValue = Math.max(filters.priceRange[0], filters.priceRange[1]);

  const handleRangeChange = (e) => {
    const [min, max] = e.target.value.split(',').map(Number);
    const updatedFilters = {
      ...filters,
      priceRange: [min, max]
    };
    setFilters(updatedFilters);
    onApplyFilters(updatedFilters);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-xl shadow-lg"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <button
            onClick={handleReset}
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Property Type */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Home className="w-4 h-4 mr-2" />
            Property Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {propertyTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleButtonChange("propertyType", type.toLowerCase())}
                className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  filters.propertyType === type.toLowerCase()
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* PG Specific Filters */}
        {filters.propertyType === "pg" && (
          <>
            <div className="space-y-3">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Home className="w-4 h-4 mr-2" />
                PG Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {pgTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleButtonChange("pgType", type.toLowerCase())}
                    className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      filters.pgType === type.toLowerCase()
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Home className="w-4 h-4 mr-2" />
                Room Capacity
              </label>
              <div className="grid grid-cols-2 gap-2">
                {sharingTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleButtonChange("sharingType", type.toLowerCase())}
                    className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      filters.sharingType === type.toLowerCase()
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  name="hasBalcony"
                  checked={filters.hasBalcony}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Room Has Balcony</span>
              </label>
            </div>
          </>
        )}

        {/* Price Range */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <IndianRupee className="w-4 h-4 mr-2" />
            Price Range
          </label>
          <div className="space-y-3">
            <input
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={STEP}
              value={filters.priceRange[1]}
              onChange={handlePriceSlider}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>₹{MIN_PRICE.toLocaleString()}</span>
              <span>₹<span id="maxPriceDisplay">{Number(filters.priceRange[1]).toLocaleString()}</span></span>
            </div>
          </div>
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-3">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Bed className="w-4 h-4 mr-2" />
              Bedrooms
            </label>
            <select
              name="bedrooms"
              value={filters.bedrooms}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            >
              <option value="0">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Bath className="w-4 h-4 mr-2" />
              Bathrooms
            </label>
            <select
              name="bathrooms"
              value={filters.bathrooms}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
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
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-3">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Building className="w-4 h-4 mr-2" />
              Min Area (sq ft)
            </label>
            <input
              type="number"
              name="minArea"
              value={filters.minArea}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              placeholder="Min area"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Building className="w-4 h-4 mr-2" />
              Max Area (sq ft)
            </label>
            <input
              type="number"
              name="maxArea"
              value={filters.maxArea}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              placeholder="Max area"
            />
          </div>
        </div>

        {/* Property Condition & Status */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-3">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Star className="w-4 h-4 mr-2" />
              Condition
            </label>
            <select
              name="propertyCondition"
              value={filters.propertyCondition}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            >
              <option value="">Any</option>
              {propertyConditions.map(condition => (
                <option key={condition} value={condition.toLowerCase()}>
                  {condition}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4 mr-2" />
              Status
            </label>
            <select
              name="propertyStatus"
              value={filters.propertyStatus}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
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
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Home className="w-4 h-4 mr-2" />
            Furnishing
          </label>
          <div className="grid grid-cols-3 gap-2">
            {furnishingTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleButtonChange("furnishing", type.toLowerCase())}
                className={`py-2 rounded-lg text-xs sm:text-sm font-medium px-1 sm:px-2 transition-all duration-200 flex justify-center items-center ${
                  filters.furnishing === type.toLowerCase()
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Star className="w-4 h-4 mr-2" />
            Amenities
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Parking', 'Gym', 'Swimming Pool', 'Garden',
              'Security', 'Power Backup', 'Lift', 'Park',
              'Club House', 'Play Area', 'Sports Facility'
            ].map((amenity) => (
              <label key={amenity} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
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

        {/* Verified Properties Only */}
        <div className="space-y-3">
          <label className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
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
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </motion.div>
  );
};

export default FilterSection;