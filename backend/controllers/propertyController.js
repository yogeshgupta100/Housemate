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

    const coordinates = req.body.coordinates ? JSON.parse(req.body.coordinates) : null;
    const address = req.body.address ? JSON.parse(req.body.address) : null;

    const defaultAdminId = '657089f229c2df66a7ea7c0d'; //for case of admin , will replace it after admin auth fix.

    const propertyData = {
      title: req.body.title?.toString(),
      type: req.body.type?.toString()?.toLowerCase(),
      price: Number(req.body.price),
      location: req.body.location?.toString(),
      description: req.body.description?.toString(),
      beds: Number(req.body.beds),
      baths: Number(req.body.baths),
      sqft: Number(req.body.sqft),
      phone: req.body.phone?.toString(),
      listingType: req.body.listingType?.toString()?.toLowerCase(),
      amenities: amenities,
      images: images,
      userId: req.body.userId || defaultAdminId,
      createdBy: req.body.createdBy || defaultAdminId,
      coordinates: coordinates || {
        latitude: 0,
        longitude: 0
      },
      address: address || {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      floorArea: Number(req.body.sqft) || 0
    };

    // Adding sale-specific fields only if listingType is 'sale'
    if (req.body.listingType?.toString()?.toLowerCase() === 'sale') {
      propertyData.propertyAge = Number(req.body.propertyAge);
      propertyData.propertyCondition = req.body.propertyCondition?.toString();
      propertyData.propertyStatus = req.body.propertyStatus?.toString();
    }

    // Adding rental-specific fields only if listingType is 'rent'
    if (req.body.listingType?.toString()?.toLowerCase() === 'rent') {
      const availability = req.body.availability ? JSON.parse(req.body.availability) : {};
      propertyData.availability = {
        status: 'Available',
        availableFrom: new Date(availability.availableFrom),
        minLeasePeriod: availability.minLeasePeriod || '12 months'
      };
    }

    if (!propertyData.title || !propertyData.type) {
      throw new Error('Title and type are required fields');
    }

    if (coordinates && (!coordinates.latitude || !coordinates.longitude)) {
      throw new Error('Invalid coordinates provided');
    }

    if (address && (!address.city || !address.state)) {
      throw new Error('City and state are required in address');
    }

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

export const searchPropertiesByCoordinates = async (req, res) => {
  try {
    const { location, coordinates, city, state, country } = req.query;

    let lat, lng;
    try {
      const coords = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
      lat = parseFloat(coords.latitude);
      lng = parseFloat(coords.longitude);
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates format'
      });
    }

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates values'
      });
    }

    // Define the search radius (in kilometers)
    const radiusInKm = 5;

    // First try to find properties by coordinates
    let properties = await Property.find({
      coordinates: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: radiusInKm * 1000 // Convert km to meters
        }
      }
    }).limit(20);

    if (properties.length === 0 && (city || state)) {
      const textQuery = {
        $or: []
      };

      if (city) {
        textQuery.$or.push({
          'address.city': {
            $regex: new RegExp(city, 'i')
          }
        });
      }

      if (state) {
        textQuery.$or.push({
          'address.state': {
            $regex: new RegExp(state, 'i')
          }
        });
      }

      properties = await Property.find(textQuery).limit(20);
    }

    res.json({
      success: true,
      properties,
      count: properties.length
    });

  } catch (error) {
    console.error('Search properties error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
