import propertyService from '../services/propertyService.js';
import Property from '../models/propertymodel.js';

export const getAllProperties = async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const properties = await propertyService.getAllProperties(filters, page, limit);
    res.status(200).json({
      success: true,
      data: properties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await propertyService.getPropertyById(id);

    res.json({
      success: true,
      property: property
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const createProperty = async (req, res) => {
  try {
    const images = req.files ? req.files.map(file => file.path) : [];
    const amenities = req.body.amenities ? JSON.parse(req.body.amenities) : [];
    
    const propertyData = {
      title: req.body.title,
      type: req.body.type.toLowerCase(),
      price: Number(req.body.price),
      location: req.body.location,
      description: req.body.description,
      beds: Number(req.body.beds),
      baths: Number(req.body.baths),
      sqft: Number(req.body.sqft),
      phone: req.body.phone,
      listingType: req.body.listingType.toLowerCase(),
      amenities: amenities,
      images: images,
      userId: req.body.userId || req.user?._id,
      createdBy: req.body.createdBy || req.user?._id,
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
      floorArea: Number(req.body.sqft) || 0
    };

    const property = await propertyService.createProperty(propertyData);

    res.status(201).json({
      success: true,
      data: property,
      message: 'Property created successfully'
    });
  } catch (error) {
    console.error('Property creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create property'
    });
  }
};

export const updateProperty = async (req, res) => {
  try {
    const property = await propertyService.updateProperty(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteProperty = async (req, res) => {
  try {
    await propertyService.deleteProperty(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const searchProperties = async (req, res) => {
  try {
    const {
      search,
      type,
      listingType,
      minPrice,
      maxPrice,
      beds,
      baths,
      minArea,
      maxArea,
      amenities,
      sort,
      verified,
      page = 1,
      limit = 12
    } = req.query;


    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    
    if (type) {
      filter.type = new RegExp(type, 'i');
    }
    
    if (listingType) {
      filter.listingType = new RegExp(listingType, 'i');
    }

    if (beds) filter.beds = { $gte: parseInt(beds) };
    if (baths) filter.baths = { $gte: parseInt(baths) };
    if (verified) filter.verified = true;
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    if (minArea || maxArea) {
      filter.sqft = {};
      if (minArea) filter.sqft.$gte = parseInt(minArea);
      if (maxArea) filter.sqft.$lte = parseInt(maxArea);
    }

    if (amenities) {
      const amenitiesList = JSON.parse(amenities);
      if (amenitiesList.length > 0) {
        filter.amenities = { $all: amenitiesList };
      }
    }


    let sortObj = { createdAt: -1 };
    if (sort) {
      switch (sort) {
        case 'price-asc':
          sortObj = { price: 1 };
          break;
        case 'price-desc':
          sortObj = { price: -1 };
          break;
        case 'area-asc':
          sortObj = { sqft: 1 };
          break;
        case 'area-desc':
          sortObj = { sqft: -1 };
          break;
        case 'newest':
          sortObj = { createdAt: -1 };
          break;
      }
    }

    const skip = (page - 1) * limit;

    const properties = await Property.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Property.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasMore: skip + properties.length < total
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error searching properties'
    });
  }
};
