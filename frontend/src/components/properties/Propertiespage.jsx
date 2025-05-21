import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Grid, List, SlidersHorizontal, MapPin } from "lucide-react";
import SearchBar from "./Searchbar.jsx";
import FilterSection from "./Filtersection.jsx";
import PropertyCard from "./Propertycard.jsx";
import { Backendurl } from "../../config/index.js";

const PropertiesPage = () => {
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
  });

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setViewState((prev) => ({ ...prev, isGridView: true }))}
              className={`p-2 rounded-lg transition-colors ${
                viewState.isGridView ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewState((prev) => ({ ...prev, isGridView: false }))}
              className={`p-2 rounded-lg transition-colors ${
                !viewState.isGridView ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setViewState((prev) => ({ ...prev, showFilters: !prev.showFilters }))}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              viewState.showFilters ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <AnimatePresence mode="wait">
            {viewState.showFilters && (
              <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="lg:col-span-1">
                <FilterSection filters={filters} setFilters={setFilters} onApplyFilters={handleFilterChange} />
              </motion.aside>
            )}
          </AnimatePresence>

          <div className={`${viewState.showFilters ? "lg:col-span-3" : "lg:col-span-4"}`}>
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <SearchBar
                  onInputChange={handleSearchInputChange}
                  onSearch={handleSearch}
                  className="flex-1"
                  locationSuggestions={locationSuggestions}
                  loadingSuggestions={loadingSuggestions}
                />

                <div className="flex items-center gap-4">
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters((prev) => ({
                      ...prev,
                        sortBy: e.target.value,
                      }))
                    }
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Sort By</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                    <option value="area-asc">Area: Low to High</option>
                    <option value="area-desc">Area: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {propertyState.loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading properties...</p>
              </div>
            ) : propertyState.error ? (
              <div className="text-center py-12 bg-red-50 rounded-lg">
                <p className="text-red-600">{propertyState.error}</p>
              </div>
            ) : (
              <motion.div layout className={`grid gap-6 ${viewState.isGridView ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                <AnimatePresence>
                  {propertyState.properties.length > 0 ? (
                    propertyState.properties.map((property) => (
                      <PropertyCard key={property.id} property={property} viewType={viewState.isGridView ? "grid" : "list"} />
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm"
                    >
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                      <p className="text-gray-600">Try adjusting your filters or search criteria</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertiesPage;
