import Property from '../models/propertymodel.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { validateProperty } from '../utils/validation.js';

// Create a new property
export const createProperty = async (req, res) => {
  try {
    // Validate property data
    const validationResult = validateProperty(req.body);
    if (!validationResult.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid property data', 
        errors: validationResult.errors 
      });
    }

    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.path));
      const uploadResults = await Promise.all(uploadPromises);
      imageUrls = uploadResults.map(result => result.secure_url);
    }

    // Create property object
    const propertyData = {
      ...req.body,
      images: imageUrls,
      address: JSON.parse(req.body.address),
      features: JSON.parse(req.body.features),
      amenities: JSON.parse(req.body.amenities),
      createdBy: req.user._id // Add the user who created the property
    };

    // Create and save the property
    const property = new Property(propertyData);
    await property.save();

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property
    });
  } catch (error) {
    console.error('Error creating property:', error);
    
    // Handle duplicate slug error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
      return res.status(400).json({
        success: false,
        message: 'A property with this title already exists. Please choose a different title.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create property',
      error: error.message
    });
  }
};

// Get all properties with pagination and filtering
export const getProperties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object based on query parameters
    const filter = {};
    
    if (req.query.listingType) {
      filter.listingType = req.query.listingType;
    }
    
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    if (req.query.city) {
      filter['address.city'] = req.query.city;
    }
    
    if (req.query.minPrice) {
      filter.price = { $gte: parseInt(req.query.minPrice) };
    }
    
    if (req.query.maxPrice) {
      filter.price = { ...filter.price, $lte: parseInt(req.query.maxPrice) };
    }
    
    if (req.query.featured === 'true') {
      filter.featured = true;
    }
    
    // Get total count for pagination
    const total = await Property.countDocuments(filter);
    
    // Get properties with pagination
    const properties = await Property.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: properties
    });
  } catch (error) {
    console.error('Error getting properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get properties',
      error: error.message
    });
  }
};

// Get a single property by ID or slug
export const getProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if id is a valid ObjectId or a slug
    const property = await Property.findOne(
      /^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { slug: id }
    );
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error('Error getting property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get property',
      error: error.message
    });
  }
};

// Update a property
export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the property
    const property = await Property.findById(id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Check if user is authorized to update the property
    if (property.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this property'
      });
    }
    
    // Handle image uploads if new images are provided
    let imageUrls = [...property.images];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.path));
      const uploadResults = await Promise.all(uploadPromises);
      const newImageUrls = uploadResults.map(result => result.secure_url);
      imageUrls = [...imageUrls, ...newImageUrls];
    }
    
    // Update property data
    const updateData = {
      ...req.body,
      images: imageUrls,
      address: req.body.address ? JSON.parse(req.body.address) : property.address,
      features: req.body.features ? JSON.parse(req.body.features) : property.features,
      amenities: req.body.amenities ? JSON.parse(req.body.amenities) : property.amenities
    };
    
    // Update the property
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property',
      error: error.message
    });
  }
};

// Delete a property
export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the property
    const property = await Property.findById(id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Check if user is authorized to delete the property
    if (property.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this property'
      });
    }
    
    // Delete the property
    await Property.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property',
      error: error.message
    });
  }
};

// Get properties by user
export const getUserProperties = async (req, res) => {
  try {
    const properties = await Property.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    console.error('Error getting user properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user properties',
      error: error.message
    });
  }
};

// Get featured properties
export const getFeaturedProperties = async (req, res) => {
  try {
    const properties = await Property.find({ featured: true, status: 'Active' })
      .sort({ createdAt: -1 })
      .limit(6);
    
    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    console.error('Error getting featured properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get featured properties',
      error: error.message
    });
  }
};

// Get properties by category
export const getPropertiesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {
      type: category,
      status: 'Active'
    };
    
    // Get total count for pagination
    const total = await Property.countDocuments(filter);
    
    // Get properties with pagination
    const properties = await Property.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: properties
    });
  } catch (error) {
    console.error('Error getting properties by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get properties by category',
      error: error.message
    });
  }
}; 