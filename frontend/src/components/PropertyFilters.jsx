import React from 'react';
import PropTypes from 'prop-types';

const PropertyFilters = ({ filters, onFilterChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: value });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>
      
      {/* Listing Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Listing Type
        </label>
        <select
          name="listingType"
          value={filters.listingType}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">All</option>
          <option value="sale">For Sale</option>
          <option value="rent">For Rent</option>
        </select>
      </div>

      {/* Property Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Property Type
        </label>
        <select
          name="type"
          value={filters.type}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">All</option>
          <option value="pg">PG</option>
          <option value="flat">Flat</option>
          <option value="rk">RK</option>
          <option value="house">House</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price Range
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            name="minPrice"
            value={filters.minPrice}
            onChange={handleChange}
            placeholder="Min"
            className="w-1/2 border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="number"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleChange}
            placeholder="Max"
            className="w-1/2 border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      {/* Location */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City
        </label>
        <input
          type="text"
          name="city"
          value={filters.city}
          onChange={handleChange}
          placeholder="Enter city"
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </div>

      {/* Beds & Baths */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Beds & Baths
        </label>
        <div className="flex gap-2">
          <select
            name="beds"
            value={filters.beds}
            onChange={handleChange}
            className="w-1/2 border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Any Beds</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
          <select
            name="baths"
            value={filters.baths}
            onChange={handleChange}
            className="w-1/2 border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Any Baths</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>
      </div>

      {/* Furnishing */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Furnishing
        </label>
        <select
          name="furnishing"
          value={filters.furnishing}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">All</option>
          <option value="furnished">Furnished</option>
          <option value="semi-furnished">Semi-Furnished</option>
          <option value="unfurnished">Unfurnished</option>
        </select>
      </div>

      {/* Sort By */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sort By
        </label>
        <select
          name="sortBy"
          value={filters.sortBy}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="newest">Newest First</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="sqft_low">Area: Low to High</option>
          <option value="sqft_high">Area: High to Low</option>
        </select>
      </div>
    </div>
  );
};

PropertyFilters.propTypes = {
  filters: PropTypes.shape({
    listingType: PropTypes.string,
    type: PropTypes.string,
    minPrice: PropTypes.string,
    maxPrice: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    beds: PropTypes.string,
    baths: PropTypes.string,
    furnishing: PropTypes.string,
    sortBy: PropTypes.string
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired
};

export default PropertyFilters; 