import {
  Home,
  IndianRupee,
  Filter,
  Bed,
  Bath,
  Calendar,
  MapPin,
  Building,
  Star,
  Check,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import React, { useRef, useEffect, useCallback, useState } from "react";
import axios from "axios";
import { Backendurl } from "../../App.jsx";

const sharingTypes = ["Single", "Double", "Triple", "Quad"];

const FilterSection = ({ filters, setFilters, onApplyFilters, onReset }) => {
  const [filterOptions, setFilterOptions] = useState({
    types: [],
    listingTypes: [],
    pgTypes: [],
    furnishingTypes: [],
    propertyConditions: [],
    propertyStatuses: [],
    amenities: [],
    priceRange: { min: 0, max: 10000000 },
    areaRange: { min: 0, max: 10000 },
  });
  const [loading, setLoading] = useState(true);

  // Fetch filter options from backend
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${Backendurl}/api/properties/filter-options`
        );
        if (response.data.success) {
          setFilterOptions(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
        // Fallback to default options if API fails
        setFilterOptions({
          types: [
            "house",
            "apartment",
            "office",
            "villa",
            "pg",
            "flat",
            "rk",
            "commercial",
            "residential plot",
            "commercial plot",
            "builder floor",
          ],
          listingTypes: ["rent", "sale"],
          pgTypes: ["boys", "girls", "co-living"],
          furnishingTypes: ["Furnished", "Semi-Furnished", "Unfurnished"],
          propertyConditions: ["new", "good", "average", "needs_repair"],
          propertyStatuses: [
            "ready_to_move",
            "under_construction",
            "renovated",
          ],
          amenities: [
            "Parking",
            "Security",
            "Power Backup",
            "Lift",
            "Gym",
            "Swimming Pool",
            "Club House",
            "Garden",
          ],
          priceRange: { min: 0, max: 10000000 },
          areaRange: { min: 0, max: 10000 },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedFilters = {
      ...filters,
      [name]: type === "checkbox" ? checked : value,
    };
    setFilters(updatedFilters);
    onApplyFilters(updatedFilters);
  };

  const handleButtonChange = (name, value) => {
    const updatedFilters = {
      ...filters,
      [name]: value,
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
    debounce((minPrice, maxPrice) => {
      const updatedFilters = {
        ...filters,
        priceRange: [minPrice, maxPrice],
      };
      setFilters(updatedFilters);
      onApplyFilters(updatedFilters);
    }, 500),
    [filters, setFilters, onApplyFilters]
  );

  const handlePriceSlider = (e, isMin = false) => {
    const value = Number(e.target.value);
    const currentMin = filters.priceRange[0];
    const currentMax = filters.priceRange[1];

    if (isMin) {
      // Ensure min doesn't exceed max
      const newMin = Math.min(value, currentMax);
      debouncedPriceUpdate(newMin, currentMax);
    } else {
      // Ensure max doesn't go below min
      const newMax = Math.max(value, currentMin);
      debouncedPriceUpdate(currentMin, newMax);
    }
  };

  const handlePriceInputChange = (e, isMin = false) => {
    const value = Number(e.target.value) || 0;
    const currentMin = filters.priceRange[0];
    const currentMax = filters.priceRange[1];

    if (isMin) {
      // Ensure min doesn't exceed max
      const newMin = Math.min(value, currentMax);
      setFilters((prev) => ({
        ...prev,
        priceRange: [newMin, currentMax],
      }));
      debouncedPriceUpdate(newMin, currentMax);
    } else {
      // Ensure max doesn't go below min
      const newMax = Math.max(value, currentMin);
      setFilters((prev) => ({
        ...prev,
        priceRange: [currentMin, newMax],
      }));
      debouncedPriceUpdate(currentMin, newMax);
    }
  };

  const formatPrice = (price) => {
    if (price === 0 || price === Number.MAX_SAFE_INTEGER) return "";
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(1)}Cr`;
    } else if (price >= 100000) {
      return `${(price / 100000).toFixed(1)}L`;
    } else {
      return price.toLocaleString();
    }
  };

  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const cleanStr = priceStr.replace(/[^\d.]/g, "");
    const num = parseFloat(cleanStr);
    if (priceStr.toLowerCase().includes("cr")) {
      return num * 10000000;
    } else if (priceStr.toLowerCase().includes("l")) {
      return num * 100000;
    }
    return num;
  };

  const handleAmenityChange = (amenity) => {
    const updatedAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity];

    const updatedFilters = {
      ...filters,
      amenities: updatedAmenities,
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Filters
            </h2>
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
        {/* Buy/Rent Filter */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4 mr-2" />
            Buy/Rent
          </label>
          <div className="grid grid-cols-2 gap-2">
            {filterOptions.listingTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleButtonChange("availability", type)}
                className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  filters.availability === type
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {type === "sale" ? "Buy" : "Rent"}
              </button>
            ))}
          </div>
        </div>

        {/* Property Type */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Home className="w-4 h-4 mr-2" />
            Property Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {filterOptions.types.map((type) => (
              <button
                key={type}
                onClick={() => handleButtonChange("propertyType", type)}
                className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  filters.propertyType === type
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
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
                {filterOptions.pgTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleButtonChange("pgType", type)}
                    className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      filters.pgType === type
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
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
                    onClick={() =>
                      handleButtonChange("sharingType", type.toLowerCase())
                    }
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
                <span className="text-sm font-medium text-gray-700">
                  Room Has Balcony
                </span>
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

          {/* Price Input Fields */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Min Price
              </label>
              <input
                type="text"
                value={formatPrice(filters.priceRange[0])}
                onChange={(e) => {
                  const value = parsePrice(e.target.value);
                  handlePriceInputChange({ target: { value } }, true);
                }}
                placeholder="Min"
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Max Price
              </label>
              <input
                type="text"
                value={formatPrice(filters.priceRange[1])}
                onChange={(e) => {
                  const value = parsePrice(e.target.value);
                  handlePriceInputChange({ target: { value } }, false);
                }}
                placeholder="Max"
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Price Range Display */}
          <div className="text-center text-sm text-gray-600">
            ₹{formatPrice(filters.priceRange[0])} - ₹
            {formatPrice(filters.priceRange[1])}
          </div>

          {/* Dual Range Sliders */}
          <div className="relative space-y-4">
            {/* Min Price Slider */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">
                Min Price
              </label>
              <input
                type="range"
                min={filterOptions.priceRange.min}
                max={filterOptions.priceRange.max}
                step={Math.max(
                  1000,
                  Math.floor(filterOptions.priceRange.max / 1000)
                )}
                value={filters.priceRange[0]}
                onChange={(e) => handlePriceSlider(e, true)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Max Price Slider */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">
                Max Price
              </label>
              <input
                type="range"
                min={filterOptions.priceRange.min}
                max={filterOptions.priceRange.max}
                step={Math.max(
                  1000,
                  Math.floor(filterOptions.priceRange.max / 1000)
                )}
                value={filters.priceRange[1]}
                onChange={(e) => handlePriceSlider(e, false)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Range Labels */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>₹{formatPrice(filterOptions.priceRange.min)}</span>
              <span>₹{formatPrice(filterOptions.priceRange.max)}</span>
            </div>
          </div>

          {/* Quick Price Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const newMin = Math.max(
                  filterOptions.priceRange.min,
                  filters.priceRange[1] - 5000000
                );
                handlePriceInputChange({ target: { value: newMin } }, true);
              }}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              -50L
            </button>
            <button
              onClick={() => {
                const newMax = Math.min(
                  filterOptions.priceRange.max,
                  filters.priceRange[0] + 5000000
                );
                handlePriceInputChange({ target: { value: newMax } }, false);
              }}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              +50L
            </button>
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
              {filterOptions.propertyConditions.map((condition) => (
                <option key={condition} value={condition}>
                  {condition.charAt(0).toUpperCase() +
                    condition.slice(1).replace("_", " ")}
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
              {filterOptions.propertyStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() +
                    status.slice(1).replace("_", " ")}
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
            {filterOptions.furnishingTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleButtonChange("furnishing", type)}
                className={`py-2 rounded-lg text-xs sm:text-sm font-medium px-1 sm:px-2 transition-all duration-200 flex justify-center items-center ${
                  filters.furnishing === type
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {filterOptions.amenities.map((amenity) => (
              <label
                key={amenity}
                className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
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
            <span className="text-sm font-medium text-gray-700">
              Verified Properties Only
            </span>
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
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border: 2px solid white;
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-webkit-slider-track {
          background: linear-gradient(
            to right,
            #e5e7eb 0%,
            #e5e7eb 50%,
            #d1d5db 50%,
            #d1d5db 100%
          );
          border-radius: 8px;
          height: 8px;
        }

        .slider::-moz-range-track {
          background: linear-gradient(
            to right,
            #e5e7eb 0%,
            #e5e7eb 50%,
            #d1d5db 50%,
            #d1d5db 100%
          );
          border-radius: 8px;
          height: 8px;
          border: none;
        }
      `}</style>
    </motion.div>
  );
};

export default FilterSection;
