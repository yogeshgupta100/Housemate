import { Home, IndianRupee, Filter, Bed, Bath, Calendar, MapPin, Building, Star } from "lucide-react";
import { motion } from "framer-motion";

const propertyTypes = ["House", "Apartment", "Villa", "Office", "PG", "Flat", "RK"];
const availabilityTypes = ["Rent", "Buy", "Lease"];
const furnishingTypes = ["Furnished", "Semi-Furnished", "Unfurnished"];
const propertyConditions = ["New", "Good", "Average", "Needs Repair"];
const propertyStatuses = ["Ready to Move", "Under Construction", "Renovated"];

const priceRanges = [
  { min: 0, max: 5000000, label: "Under ₹50L" },
  { min: 5000000, max: 10000000, label: "₹50L - ₹1Cr" },
  { min: 10000000, max: 20000000, label: "₹1Cr - ₹2Cr" },
  { min: 20000000, max: Number.MAX_SAFE_INTEGER, label: "Above ₹2Cr" }
];

const FilterSection = ({ filters, setFilters, onApplyFilters }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePriceRangeChange = (min, max) => {
    setFilters(prev => ({
      ...prev,
      priceRange: [min, max]
    }));
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white p-6 rounded-xl shadow-lg max-h-[80vh] overflow-y-auto"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10">
        <div className="flex items-center space-x-2">
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
          <div className="grid grid-cols-2 gap-2">
            {priceRanges.map(({ min, max, label }) => (
              <button
                key={label}
                onClick={() => handlePriceRangeChange(min, max)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${filters.priceRange[0] === min && filters.priceRange[1] === max
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {label}
              </button>
            ))}
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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
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