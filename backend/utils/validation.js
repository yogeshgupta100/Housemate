// Property validation function
export const validateProperty = (data) => {
  const errors = [];
  
  // Required fields
  const requiredFields = [
    'title',
    'listingType',
    'type',
    'price',
    'address',
    'features',
    'description',
    'amenities'
  ];
  
  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  });
  
  // Validate title length
  if (data.title && (data.title.length < 5 || data.title.length > 100)) {
    errors.push('Title must be between 5 and 100 characters');
  }
  
  // Validate listing type
  const validListingTypes = ['sale', 'rent'];
  if (data.listingType && !validListingTypes.includes(data.listingType)) {
    errors.push('Invalid listing type. Must be either "sale" or "rent"');
  }
  
  // Validate property type
  const validPropertyTypes = ['PG', 'flat', 'RK', 'house', 'apartment', 'villa'];
  if (data.type && !validPropertyTypes.includes(data.type)) {
    errors.push('Invalid property type');
  }
  
  // Validate price
  if (data.price && (isNaN(data.price) || data.price <= 0)) {
    errors.push('Price must be a positive number');
  }
  
  // Validate address
  if (data.address) {
    try {
      const address = typeof data.address === 'string' ? JSON.parse(data.address) : data.address;
      
      if (!address.street || !address.city || !address.state || !address.pincode) {
        errors.push('Address must include street, city, state, and pincode');
      }
      
      if (address.pincode && !/^\d{6}$/.test(address.pincode)) {
        errors.push('Pincode must be a 6-digit number');
      }
    } catch (error) {
      errors.push('Invalid address format');
    }
  }
  
  // Validate features
  if (data.features) {
    try {
      const features = typeof data.features === 'string' ? JSON.parse(data.features) : data.features;
      
      if (!Array.isArray(features)) {
        errors.push('Features must be an array');
      } else if (features.length === 0) {
        errors.push('At least one feature is required');
      }
    } catch (error) {
      errors.push('Invalid features format');
    }
  }
  
  // Validate amenities
  if (data.amenities) {
    try {
      const amenities = typeof data.amenities === 'string' ? JSON.parse(data.amenities) : data.amenities;
      
      if (!Array.isArray(amenities)) {
        errors.push('Amenities must be an array');
      }
    } catch (error) {
      errors.push('Invalid amenities format');
    }
  }
  
  // Validate description length
  if (data.description && (data.description.length < 50 || data.description.length > 2000)) {
    errors.push('Description must be between 50 and 2000 characters');
  }
  
  // Validate images
  if (data.images) {
    if (!Array.isArray(data.images)) {
      errors.push('Images must be an array');
    } else if (data.images.length > 5) {
      errors.push('Maximum 5 images allowed');
    }
  }
  
  // Validate property condition
  if (data.propertyCondition) {
    const validConditions = ['new', 'good', 'average', 'needs_repair'];
    if (!validConditions.includes(data.propertyCondition)) {
      errors.push('Invalid property condition');
    }
  }
  
  // Validate property status
  if (data.propertyStatus) {
    const validStatuses = ['Active', 'Inactive', 'Sold', 'Rented'];
    if (!validStatuses.includes(data.propertyStatus)) {
      errors.push('Invalid property status');
    }
  }
  
  // Validate minimum lease (for rental properties)
  if (data.listingType === 'rent' && data.minimumLease) {
    if (isNaN(data.minimumLease) || data.minimumLease < 1) {
      errors.push('Minimum lease must be at least 1 month');
    }
  }
  
  // Validate deposit (for rental properties)
  if (data.listingType === 'rent' && data.deposit) {
    if (isNaN(data.deposit) || data.deposit < 0) {
      errors.push('Deposit must be a non-negative number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 