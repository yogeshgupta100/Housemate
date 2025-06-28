import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Grid, List, SlidersHorizontal, MapPin, X, Info } from "lucide-react";
import SearchBar from "./Searchbar.jsx";
import FilterSection from "./Filtersection.jsx";
import PropertyListing from "./PropertyListing.jsx";
import { Backendurl } from "../../App.jsx";
import { useAuth } from "../../context/AuthContext";

const PropertiesPage = () => {
  const { isLoggedIn } = useAuth();
  const [viewState, setViewState] = useState({
    isGridView: true,
    showFilters: false,
    showMap: false,
  });

  const [propertyState, setPropertyState] = useState({
    properties: [],
    loading: true,
    error: null,
    selectedProperty: null,
  });

  const [filters, setFilters] = useState({
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
  });

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  const typingTimeoutRef = useRef(null);

  const fetchProperties = async (appliedFilters = filters) => {
    try {
      setPropertyState((prev) => ({ ...prev, loading: true }));
      
      const urlParams = new URLSearchParams(window.location.search);
      const lat = urlParams.get("lat");
      const lng = urlParams.get("lng");
      const location = urlParams.get("location");

      let response;

      if (lat && lng) {
        const geocoder = new window.google.maps.Geocoder();
        const geocodeResult = await new Promise((resolve, reject) => {
          geocoder.geocode(
            { location: { lat: parseFloat(lat), lng: parseFloat(lng) } },
            (results, status) => {
              if (status === "OK") {
              resolve(results[0]);
            } else {
                reject(new Error("Location not found"));
              }
            }
          );
        });

        const addressComponents = {
          city: "",
          state: "",
          country: "",
        };

        geocodeResult.address_components.forEach((component) => {
          if (component.types.includes("locality")) {
            addressComponents.city = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            addressComponents.state = component.long_name;
          }
          if (component.types.includes("country")) {
            addressComponents.country = component.long_name;
          }
        });

        response = await axios.get(`${Backendurl}/api/properties/searchByCoordinates`, {
          params: {
            location,
            coordinates: {
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
            },
            city: addressComponents.city,
            state: addressComponents.state,
            country: addressComponents.country,
          },
        });
      } else {
        const queryParams = new URLSearchParams();
        
        if (appliedFilters.searchQuery) {
          queryParams.append("search", appliedFilters.searchQuery);
        }

        if (appliedFilters.propertyType) {
          queryParams.append("type", appliedFilters.propertyType);
        }

        if (appliedFilters.availability) {
          queryParams.append("listing_type", appliedFilters.availability);
        }

        if (appliedFilters.bedrooms && appliedFilters.bedrooms !== "0") {
          queryParams.append("beds", appliedFilters.bedrooms);
        }

        if (appliedFilters.bathrooms && appliedFilters.bathrooms !== "0") {
          queryParams.append("baths", appliedFilters.bathrooms);
        }

        if (appliedFilters.priceRange[0] > 0) {
          queryParams.append("minPrice", appliedFilters.priceRange[0]);
        }
        if (appliedFilters.priceRange[1] < Number.MAX_SAFE_INTEGER) {
          queryParams.append("maxPrice", appliedFilters.priceRange[1]);
        }

        if (appliedFilters.minArea) {
          queryParams.append("minArea", appliedFilters.minArea);
        }
        if (appliedFilters.maxArea) {
          queryParams.append("maxArea", appliedFilters.maxArea);
        }

        if (appliedFilters.amenities && appliedFilters.amenities.length > 0) {
          appliedFilters.amenities.forEach((a) => queryParams.append("amenities", a));
        }

        if (appliedFilters.sortBy) {
          queryParams.append("sort", appliedFilters.sortBy);
        }

        if (appliedFilters.furnishing) {
          queryParams.append("furnishing", appliedFilters.furnishing);
        }

        if (appliedFilters.verifiedOnly) {
          queryParams.append("verified", true);
        }

        if (appliedFilters.pgType) {
          queryParams.append("pg_type", appliedFilters.pgType);
        }

        if (appliedFilters.sharingType) {
          queryParams.append("room_capacity", appliedFilters.sharingType);
        }

        if (appliedFilters.hasBalcony) {
          queryParams.append("room_has_balcony", appliedFilters.hasBalcony);
        }

        console.log("Final query:", queryParams.toString());

        response = await axios.get(`${Backendurl}/api/properties/search?${queryParams}`);
      }
      
      if (response.data.success) {
        setPropertyState((prev) => ({
          ...prev,
          properties: response.data.properties || response.data.data,
          error: null,
          loading: false,
        }));
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setPropertyState((prev) => ({
        ...prev,
        error: "Failed to fetch properties. Please try again later.",
        loading: false,
      }));
      console.error("Error fetching properties:", err);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [window.location.search]);

  // Update active filters whenever filters change
  useEffect(() => {
    const newActiveFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "" && value !== "0" && 
          !(Array.isArray(value) && value.length === 0) &&
          !(Array.isArray(value) && value[0] === 0 && value[1] === Number.MAX_SAFE_INTEGER)) {
        newActiveFilters[key] = value;
      }
    });
    setActiveFilters(newActiveFilters);
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchProperties(updatedFilters);
  };

  const handleFilterReset = () => {
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
    fetchProperties(resetFilters);
  };

  const removeFilter = (filterKey) => {
    const updatedFilters = { ...filters };
    if (filterKey === "priceRange") {
      updatedFilters[filterKey] = [0, Number.MAX_SAFE_INTEGER];
    } else if (filterKey === "bedrooms" || filterKey === "bathrooms") {
      updatedFilters[filterKey] = "0";
    } else if (Array.isArray(updatedFilters[filterKey])) {
      updatedFilters[filterKey] = [];
    } else {
      updatedFilters[filterKey] = "";
    }
    setFilters(updatedFilters);
    fetchProperties(updatedFilters);
  };

  const fetchLocations = async (query) => {
    if (!query.trim()) {
      setLocationSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`${Backendurl}/api/properties/locations?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setLocationSuggestions(data.locations || []);
    } catch (e) {
      setLocationSuggestions([]);
    }
    setLoadingSuggestions(false);
  };

  const handleSearchInputChange = (query) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));

    // Clear the previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set a new timeout
    typingTimeoutRef.current = setTimeout(() => {
      fetchLocations(query);
    }, 5000); // 5 seconds debounce
  };

  const handleSearch = (query) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
    fetchProperties({ ...filters, searchQuery: query });
  };

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const getFilterDisplayName = (key, value) => {
    const displayNames = {
      propertyType: "Property Type",
      bedrooms: "Bedrooms",
      bathrooms: "Bathrooms",
      availability: "Availability",
      furnishing: "Furnishing",
      propertyCondition: "Condition",
      propertyStatus: "Status",
      amenities: "Amenities",
      minArea: "Min Area",
      maxArea: "Max Area",
      verifiedOnly: "Verified Only",
      pgType: "PG Type",
      sharingType: "Sharing Type",
      hasBalcony: "Has Balcony",
      priceRange: "Price Range"
    };

    if (key === "priceRange" && Array.isArray(value)) {
      if (value[0] > 0 && value[1] < Number.MAX_SAFE_INTEGER) {
        return `₹${value[0].toLocaleString()} - ₹${value[1].toLocaleString()}`;
      } else if (value[0] > 0) {
        return `Min ₹${value[0].toLocaleString()}`;
      } else if (value[1] < Number.MAX_SAFE_INTEGER) {
        return `Max ₹${value[1].toLocaleString()}`;
      }
    }

    if (key === "amenities" && Array.isArray(value)) {
      return `${value.length} amenities`;
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    return value;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with view controls and filter toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setViewState((prev) => ({ ...prev, isGridView: true }))}
              className={`p-2 rounded-lg transition-colors ${
                viewState.isGridView ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setViewState((prev) => ({ ...prev, isGridView: false }))}
              className={`p-2 rounded-lg transition-colors ${
                !viewState.isGridView ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <button
            onClick={() => setViewState((prev) => ({ ...prev, showFilters: !prev.showFilters }))}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              viewState.showFilters ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Filters</span>
            {Object.keys(activeFilters).length > 0 && (
              <span className="bg-white text-blue-600 rounded-full w-5 h-5 text-xs flex items-center justify-center font-medium">
                {Object.keys(activeFilters).length}
              </span>
            )}
          </button>
        </div>

        {/* Active Filters Display */}
        {Object.keys(activeFilters).length > 0 && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              <button
                onClick={handleFilterReset}
                className="text-sm text-blue-600 hover:text-blue-700 underline self-start sm:self-auto"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(activeFilters).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
                >
                  <span className="truncate max-w-32 sm:max-w-none">{getFilterDisplayName(key, value)}</span>
                  <button
                    onClick={() => removeFilter(key)}
                    className="hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Filter Section - Only visible when showFilters is true */}
          <AnimatePresence mode="wait">
            {viewState.showFilters && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="w-full lg:w-80 lg:flex-shrink-0"
              >
                <FilterSection 
                  filters={filters} 
                  setFilters={setFilters} 
                  onApplyFilters={handleFilterChange}
                  onReset={handleFilterReset}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Properties Section */}
          <div className="flex-1 min-w-0">
            <PropertyListing
              properties={propertyState.properties}
              loading={propertyState.loading}
              error={propertyState.error}
              isGridView={viewState.isGridView}
              onSortChange={(value) => {
                const updatedFilters = { ...filters, sortBy: value };
                setFilters(updatedFilters);
                fetchProperties(updatedFilters);
              }}
              sortBy={filters.sortBy}
            >
              <div className="flex flex-col gap-4">
                {/* Search Bar */}
                <div className="w-full">
                  <SearchBar
                    onInputChange={handleSearchInputChange}
                    onSearch={handleSearch}
                    className="w-full"
                    locationSuggestions={locationSuggestions}
                    loadingSuggestions={loadingSuggestions}
                  />
                </div>

                {/* Sort Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => {
                      const updatedFilters = { ...filters, sortBy: e.target.value };
                      setFilters(updatedFilters);
                      fetchProperties(updatedFilters);
                    }}
                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select sorting option</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                    <option value="area-asc">Area: Low to High</option>
                    <option value="area-desc">Area: High to Low</option>
                  </select>
                </div>
              </div>
            </PropertyListing>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertiesPage;
