import propertyService from '../services/propertyService.js';
import Property from '../models/propertymodel.js';
import aiService from '../services/aiService.js';
import pool from '../config/postgres.js';

export const getAllProperties = async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const offset = (page - 1) * limit;
    const client = await pool.connect();

    try {
      // Build the WHERE clause based on filters
      let whereClause = 'WHERE status = $1';
      const queryParams = ['Active'];
      let paramIndex = 2;

      // Add filters to the WHERE clause
      if (filters.type) {
        whereClause += ` AND type = $${paramIndex}`;
        queryParams.push(filters.type);
        paramIndex++;
      }

      if (filters.listing_type) {
        whereClause += ` AND listing_type = $${paramIndex}`;
        queryParams.push(filters.listing_type);
        paramIndex++;
      }

      if (filters.beds) {
        whereClause += ` AND beds = $${paramIndex}`;
        queryParams.push(filters.beds);
        paramIndex++;
      }

      if (filters.baths) {
        whereClause += ` AND baths = $${paramIndex}`;
        queryParams.push(filters.baths);
        paramIndex++;
      }

      if (filters.price_min) {
        whereClause += ` AND price >= $${paramIndex}`;
        queryParams.push(filters.price_min);
        paramIndex++;
      }

      if (filters.price_max) {
        whereClause += ` AND price <= $${paramIndex}`;
        queryParams.push(filters.price_max);
        paramIndex++;
      }

      if (filters.sqft_min) {
        whereClause += ` AND sqft >= $${paramIndex}`;
        queryParams.push(filters.sqft_min);
        paramIndex++;
      }

      if (filters.sqft_max) {
        whereClause += ` AND sqft <= $${paramIndex}`;
        queryParams.push(filters.sqft_max);
        paramIndex++;
      }

      if (filters.city) {
        whereClause += ` AND city ILIKE $${paramIndex}`;
        queryParams.push(`%${filters.city}%`);
        paramIndex++;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM properties ${whereClause}`;
      const { rows: [{ count }] } = await client.query(countQuery, queryParams);

      // Get properties with pagination
      const propertiesQuery = `
        SELECT * FROM properties 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      const { rows: properties } = await client.query(
        propertiesQuery,
        [...queryParams, limit, offset]
      );

      res.status(200).json({
        success: true,
        data: {
          properties,
          pagination: {
            total: parseInt(count),
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(parseInt(count) / parseInt(limit))
          }
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in getAllProperties:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch properties: ${error.message}`
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
    // Get images array from request body (now contains S3 URLs)
    const images = req.body.images || [];
    const amenities = req.body.amenities || [];

    // Parse coordinates with proper validation
    let coordinates = null;
    try {
      if (req.body.coordinates) {
        coordinates = typeof req.body.coordinates === 'string' 
          ? JSON.parse(req.body.coordinates) 
          : req.body.coordinates;
        
        // Ensure coordinates are numbers
        coordinates.latitude = parseFloat(coordinates.latitude);
        coordinates.longitude = parseFloat(coordinates.longitude);
        
        // Validate coordinate ranges
        if (isNaN(coordinates.latitude) || isNaN(coordinates.longitude) ||
            coordinates.latitude < -90 || coordinates.latitude > 90 ||
            coordinates.longitude < -180 || coordinates.longitude > 180) {
          throw new Error('Invalid coordinate values');
        }
      }
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates format or values'
      });
    }

    // Parse and validate address
    let address = null;
    try {
      if (req.body.address) {
        address = typeof req.body.address === 'string' 
          ? JSON.parse(req.body.address) 
          : req.body.address;
      }
    } catch (error) {
      console.error('Error parsing address:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid address format'
      });
    }

    // Parse availability for rental properties
    let availability = null;
    try {
      if (req.body.availability) {
        availability = typeof req.body.availability === 'string'
          ? JSON.parse(req.body.availability)
          : req.body.availability;
      }
    } catch (error) {
      console.error('Error parsing availability:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid availability format'
      });
    }

    // Parse floor details if present
    let floorDetails = null;
    try {
      if (req.body.floorDetails) {
        floorDetails = typeof req.body.floorDetails === 'string'
          ? JSON.parse(req.body.floorDetails)
          : req.body.floorDetails;
      }
    } catch (error) {
      console.error('Error parsing floor details:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid floor details format'
      });
    }

    // Get user ID from the authenticated request
    const userId = req.user.id; // This comes from the auth middleware

    const propertyData = normalizePropertyData(req.body, req.user.id);
    const property = await propertyService.createProperty(propertyData);

    if (floorDetails && Array.isArray(floorDetails)) {
      for (const floor of floorDetails) {
        const floorResult = await pool.query(
          'INSERT INTO floors (property_id, floor_number) VALUES ($1, $2) RETURNING id',
          [property.id, floor.floorNumber]
        );
        const floorId = floorResult.rows[0].id;

        if (floor.rooms && Array.isArray(floor.rooms)) {
          for (const room of floor.rooms) {
            console.log('Inserting room:', JSON.stringify(room));
            if (room.rent_amount === undefined || room.rent_amount === null) {
              throw new Error('Each room must have a rent_amount');
            }
            await pool.query(
              `INSERT INTO rooms (
                floor_id, room_number, capacity, occupied,
                rent_amount, available_from, has_balcony
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                floorId,
                room.roomNumber,
                room.capacity || 1,
                room.occupied || 0,
                room.rent_amount,
                room.availableFrom,
                room.hasBalcony || false
              ]
            );
          }
        }
      }
    }

    const { rows: [{ min }] } = await pool.query(
      `SELECT MIN(rent_amount) as min FROM rooms WHERE floor_id IN (
        SELECT id FROM floors WHERE property_id = $1
      )`,
      [property.id]
    );
    if (min !== null && min !== undefined) {
      await pool.query(
        'UPDATE properties SET price = $1 WHERE id = $2',
        [min, property.id]
      );
      property.price = min;
    }

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
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle JSON stringified fields
    if (updateData.availability) {
      try {
        updateData.availability = typeof updateData.availability === 'string' 
          ? JSON.parse(updateData.availability)
          : updateData.availability;
      } catch (error) {
        console.error('Error parsing availability:', error);
        updateData.availability = updateData.availability;
      }
    }

    // Handle floor details
    let floorDetails = null;
    try {
      if (updateData.floorDetails) {
        floorDetails = typeof updateData.floorDetails === 'string'
          ? JSON.parse(updateData.floorDetails)
          : updateData.floorDetails;
      }
    } catch (error) {
      console.error('Error parsing floor details:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid floor details format'
      });
    }

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      const imagePaths = req.files.map(file => file.path);
      updateData.images = imagePaths;
    }

    // Convert numeric fields
    const numericFields = ['price', 'beds', 'baths', 'sqft', 'floor_area', 'property_age'];
    numericFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = updateData[field] === '' ? null : Number(updateData[field]);
      }
    });

    // Update the property
    const property = await propertyService.updateProperty(id, updateData);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Handle floor details update if present
    if (floorDetails && Array.isArray(floorDetails)) {
      // First, delete existing floors and rooms
      await pool.query('DELETE FROM rooms WHERE floor_id IN (SELECT id FROM floors WHERE property_id = $1)', [id]);
      await pool.query('DELETE FROM floors WHERE property_id = $1', [id]);

      // Then insert new floors and rooms
      for (const floor of floorDetails) {
        // Insert floor
        const floorResult = await pool.query(
          'INSERT INTO floors (property_id, floor_number) VALUES ($1, $2) RETURNING id',
          [id, floor.floorNumber]
        );
        const floorId = floorResult.rows[0].id;

        // Insert rooms for this floor
        if (floor.rooms && Array.isArray(floor.rooms)) {
          for (const room of floor.rooms) {
            await pool.query(
              `INSERT INTO rooms (
                floor_id, room_number, capacity, occupied,
                rent_amount, available_from, has_balcony,
                room_type, area, description
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                floorId,
                room.roomNumber,
                room.capacity || 1,
                room.occupied || 0,
                room.rent_amount || 0,
                room.availableFrom || null,
                room.hasBalcony || false,
                room.roomType || null,
                room.area || null,
                room.description || null
              ]
            );
          }
        }
      }

      // Update the property price based on minimum room rent
      const { rows: [{ min }] } = await pool.query(
        `SELECT MIN(rent_amount) as min FROM rooms WHERE floor_id IN (
          SELECT id FROM floors WHERE property_id = $1
        )`,
        [id]
      );
      if (min !== null && min !== undefined) {
        await pool.query(
          'UPDATE properties SET price = $1 WHERE id = $2',
          [min, id]
        );
        property.price = min;
      }
    }

    // Fetch the updated property with floor details
    const updatedProperty = await propertyService.getPropertyById(id);

    res.status(200).json({
      success: true,
      data: updatedProperty,
      message: 'Property updated successfully'
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update property'
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
    const client = await pool.connect();
    try {
        const { search, ...filters } = req.query;
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';

        // Validate PG type if provided
        if (filters.pg_type) {
            const validPGTypes = ['boys', 'girls', 'co-living'];
            if (!validPGTypes.includes(filters.pg_type.toLowerCase())) {
                throw new Error('Invalid PG type. Must be one of: boys, girls, co-living');
            }
        }

        // Build the WHERE clause
        let whereClause = 'WHERE p.status = $1';
        const queryParams = ['Active'];
        let paramIndex = 2;

        // Add search condition
        if (search) {
            whereClause += ` AND (LOWER(p.city) = LOWER($${paramIndex}) OR LOWER(p.state) = LOWER($${paramIndex}))`;
            queryParams.push(search);
            paramIndex++;
        }

        // Add other filters
        if (filters.type) {
            whereClause += ` AND p.type = $${paramIndex}`;
            queryParams.push(filters.type);
            paramIndex++;
        }

        if (filters.listing_type) {
            whereClause += ` AND p.listing_type = $${paramIndex}`;
            queryParams.push(filters.listing_type);
            paramIndex++;
        }

        if (filters.beds) {
            const beds = parseInt(filters.beds);
            if (isNaN(beds) || beds < 0) {
                throw new Error('Invalid number of beds');
            }
            whereClause += ` AND p.beds = $${paramIndex}`;
            queryParams.push(beds);
            paramIndex++;
        }

        if (filters.baths) {
            const baths = parseInt(filters.baths);
            if (isNaN(baths) || baths < 0) {
                throw new Error('Invalid number of baths');
            }
            whereClause += ` AND p.baths = $${paramIndex}`;
            queryParams.push(baths);
            paramIndex++;
        }

        if (filters.minPrice) {
            const minPrice = parseInt(filters.minPrice);
            if (isNaN(minPrice) || minPrice < 0) {
                throw new Error('Invalid minimum price');
            }
            whereClause += ` AND p.price >= $${paramIndex}`;
            queryParams.push(minPrice);
            paramIndex++;
        }

        if (filters.maxPrice) {
            const maxPrice = parseInt(filters.maxPrice);
            if (isNaN(maxPrice) || maxPrice < 0) {
                throw new Error('Invalid maximum price');
            }
            if (filters.minPrice && maxPrice < parseInt(filters.minPrice)) {
                throw new Error('Maximum price cannot be less than minimum price');
            }
            whereClause += ` AND p.price <= $${paramIndex}`;
            queryParams.push(maxPrice);
            paramIndex++;
        }

        if (filters.minArea) {
            const minArea = parseInt(filters.minArea);
            if (isNaN(minArea) || minArea < 0) {
                throw new Error('Invalid minimum area');
            }
            whereClause += ` AND p.area >= $${paramIndex}`;
            queryParams.push(minArea);
            paramIndex++;
        }

        if (filters.maxArea) {
            const maxArea = parseInt(filters.maxArea);
            if (isNaN(maxArea) || maxArea < 0) {
                throw new Error('Invalid maximum area');
            }
            if (filters.minArea && maxArea < parseInt(filters.minArea)) {
                throw new Error('Maximum area cannot be less than minimum area');
            }
            whereClause += ` AND p.area <= $${paramIndex}`;
            queryParams.push(maxArea);
            paramIndex++;
        }

        if (filters.furnishing) {
            const validFurnishing = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
            if (!validFurnishing.includes(filters.furnishing)) {
                throw new Error('Invalid furnishing type. Must be one of: Furnished, Semi-Furnished, Unfurnished');
            }
            whereClause += ` AND p.furnishing = $${paramIndex}`;
            queryParams.push(filters.furnishing);
            paramIndex++;
        }

        if (filters.verified === 'true') {
            whereClause += ` AND p.is_verified = true`;
        }

        if (filters.amenities && !Array.isArray(filters.amenities)) {
            filters.amenities = [filters.amenities];
        }

        if (filters.amenities && filters.amenities.length > 0) {
            const validAmenities = ['parking', 'security', 'power_backup', 'lift', 'garden', 'gym', 'swimming_pool'];
            const invalidAmenities = filters.amenities.filter(amenity => !validAmenities.includes(amenity));
            if (invalidAmenities.length > 0) {
                throw new Error(`Invalid amenities: ${invalidAmenities.join(', ')}`);
            }
            whereClause += ` AND p.amenities && $${paramIndex}::text[]`;
            queryParams.push(filters.amenities);
            paramIndex++;
        }

        if (filters.type === 'pg') {
            whereClause = whereClause.replace('WHERE', 'LEFT JOIN floors f ON p.id = f.property_id LEFT JOIN rooms r ON f.id = r.floor_id WHERE');

            if (filters.pg_type) {
                whereClause += ` AND p.pg_type = $${paramIndex}`;
                queryParams.push(filters.pg_type.toLowerCase());
                paramIndex++;
            }

            if (filters.room_capacity) {
                let capacity;
                const validCapacities = ['single', 'double', 'triple', 'quad'];
                if (validCapacities.includes(filters.room_capacity.toLowerCase())) {
                    switch(filters.room_capacity.toLowerCase()) {
                        case 'single': capacity = 1; break;
                        case 'double': capacity = 2; break;
                        case 'triple': capacity = 3; break;
                        case 'quad': capacity = 4; break;
                    }
                } else {
                    capacity = parseInt(filters.room_capacity);
                    if (isNaN(capacity) || capacity < 1 || capacity > 10) {
                        throw new Error('Invalid room capacity. Must be one of: single, double, triple, quad, or a number between 1-10');
                    }
                }
                whereClause += ` AND r.capacity = $${paramIndex}`;
                queryParams.push(capacity);
                paramIndex++;
            }

            if (filters.room_has_balcony) {
                if (filters.room_has_balcony !== 'true' && filters.room_has_balcony !== 'false') {
                    throw new Error('Invalid balcony value. Must be true or false');
                }
                const hasBalcony = filters.room_has_balcony === 'true';
                whereClause += ` AND r.has_balcony = $${paramIndex}`;
                queryParams.push(hasBalcony);
                paramIndex++;
            }
        }

        // Get properties
        const { rows: properties } = await client.query(
            `SELECT DISTINCT p.* FROM properties p 
            ${whereClause}
            ORDER BY p.created_at DESC`,
            queryParams
        );

        // Add full URLs to images
        const propertiesWithFullUrls = properties.map(property => ({
            ...property,
            images: property.images.map(image => 
                image.startsWith('http') ? image : `${baseUrl}${image}`
            )
        }));

        res.json({
            success: true,
            properties: propertiesWithFullUrls
        });
    } catch (error) {
        // Handle specific error types
        if (error.message.includes('Invalid')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        // Handle database errors
        if (error.code === '22P02') { // Invalid text representation
            return res.status(400).json({
                success: false,
                message: 'Invalid parameter type provided'
            });
        }

        if (error.code === '42703') { // Undefined column
            return res.status(500).json({
                success: false,
                message: 'Database schema error. Please contact support.'
            });
        }

        // Handle other errors
        res.status(500).json({
            success: false,
            message: 'Failed to search properties',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    } finally {
        client.release();
    }
};

export const getLocationSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json({ locations: [] });
    }

    const client = await pool.connect();
    try {
      // Search for locations with more detailed information
      const { rows } = await client.query(
        `SELECT DISTINCT 
          location as area,
          city,
          state,
          country
        FROM properties 
        WHERE 
          LOWER(location) ILIKE $1 OR
          LOWER(city) ILIKE $1 OR
          LOWER(state) ILIKE $1 OR
          LOWER(country) ILIKE $1
        LIMIT 10`,
        [`%${query.toLowerCase()}%`]
      );

      // Format the results
      const locations = rows.map(row => ({
        area: row.area || '',
        city: row.city || '',
        state: row.state || '',
        country: row.country || 'India'
      }));

      res.json({ 
        success: true,
        locations 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in getLocationSuggestions:', error);
    res.status(500).json({ 
      success: false,
      locations: [], 
      error: error.message 
    });
  }
};

export const getLocationTrends = async (req, res) => {
    try {
        const { city } = req.params;
        const { limit = 5 } = req.query;

        if (!city) {
            return res.status(400).json({ success: false, message: 'City parameter is required' });
        }

        // Get location trends from our database
        const locations = await Property.aggregate([
            { $match: { 'address.city': { $regex: new RegExp(city, 'i') }, status: 'Active' } },
            { $group: { 
                _id: '$address.city', 
                count: { $sum: 1 },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }},
            { $sort: { count: -1 } },
            { $limit: Math.min(parseInt(limit), 5) }
        ]);

        // Analyze the location trends using AI
        const analysis = await aiService.analyzeLocationTrends(
            locations,
            city
        );

        res.json({
            success: true,
            locations,
            analysis
        });
    } catch (error) {
        console.error('Error getting location trends:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get location trends',
            error: error.message
        });
    }
};

export const getFeaturedProperties = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        
        const properties = await Property.find({ 
            status: 'Active',
            isFeatured: true 
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('-__v');
        
        res.json({
            success: true,
            properties
        });
    } catch (error) {
        console.error('Error fetching featured properties:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch featured properties',
            error: error.message
        });
    }
};

export const getPropertiesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        if (!category) {
            return res.status(400).json({ success: false, message: 'Category is required' });
        }
        
        // Build filter
        const filter = { 
            status: 'Active',
            type: category
        };
        
        // Execute query with pagination
        const properties = await Property.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v');
            
        // Get total count for pagination
        const total = await Property.countDocuments(filter);
        
        res.json({
            success: true,
            properties,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching properties by category:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch properties by category',
            error: error.message
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

export const getPropertiesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const client = await pool.connect();

    try {
      const { rows: properties } = await client.query(
        `SELECT * FROM properties WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );

      res.status(200).json({
        success: true,
        data: {
          properties
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in getPropertiesByUser:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch user properties: ${error.message}`
    });
  }
};

export const getFilterOptions = async (req, res) => {
  try {
    const client = await pool.connect();

    try {
      // Get unique property types
      const { rows: types } = await client.query(
        'SELECT DISTINCT type FROM properties WHERE type IS NOT NULL ORDER BY type'
      );

      // Get unique statuses
      const { rows: statuses } = await client.query(
        'SELECT DISTINCT status FROM properties WHERE status IS NOT NULL ORDER BY status'
      );

      // Get unique cities
      const { rows: cities } = await client.query(
        'SELECT DISTINCT city FROM properties WHERE city IS NOT NULL ORDER BY city'
      );

      // Get price ranges
      const { rows: [{ min_price, max_price }] } = await client.query(
        'SELECT MIN(price) as min_price, MAX(price) as max_price FROM properties'
      );

      res.status(200).json({
        success: true,
        data: {
          types: types.map(t => t.type),
          statuses: statuses.map(s => s.status),
          cities: cities.map(c => c.city),
          priceRange: {
            min: min_price || 0,
            max: max_price || 0
          }
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in getFilterOptions:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch filter options: ${error.message}`
    });
  }
};

function normalizePropertyData(input, userId) {
  let coordinates = input.coordinates;
  if (typeof coordinates === 'string') coordinates = JSON.parse(coordinates);
  let address = input.address;
  if (typeof address === 'string') address = JSON.parse(address);

  // Handle price based on listing type
  let price = 0;
  if (input.listingType === 'sale') {
    price = input.price ? Number(input.price) : 0;
  } else {
    price = input.price ? Number(input.price) : 0;
  }

  return {
    title: input.title || '',
    subtitle: input.subtitle || '',
    description: input.description || '',
    slug: input.slug || '',
    listing_type: input.listingType || 'rent',
    type: input.type || '',
    price: price,
    rent_type: input.listingType === 'sale' ? null : (input.rentType || 'monthly'),
    deposit: input.listingType === 'sale' ? null : (input.deposit ? Number(input.deposit) : 0),
    property_age: input.propertyAge ? Number(input.propertyAge) : null,
    property_condition: input.propertyCondition || null,
    property_status: input.propertyStatus || null,
    location: input.location || '',
    region: input.region || null,
    latitude: coordinates?.latitude || 0,
    longitude: coordinates?.longitude || 0,
    street: address?.street || '',
    city: address?.city || '',
    state: address?.state || '',
    pincode: address?.pincode || '',
    country: address?.country || 'India',
    floor_area: input.floorArea ? Number(input.floorArea) : 0,
    sqft: input.sqft ? Number(input.sqft) : 0,
    floor_no: input.floorNo ? Number(input.floorNo) : null,
    total_floors: input.totalFloors ? Number(input.totalFloors) : null,
    beds: input.beds ? Number(input.beds) : 0,
    baths: input.baths ? Number(input.baths) : 0,
    furnishing: input.furnishing || 'Unfurnished',
    amenities: Array.isArray(input.amenities) ? input.amenities : [],
    balcony: input.balcony === true,
    central_ac: input.centralAc === true,
    power_backup: input.powerBackup === true,
    parking: input.parking === true,
    security: input.security === true,
    swimming_pool: input.swimmingPool === true,
    gym: input.gym === true,
    garden: input.garden === true,
    lift: input.lift === true,
    images: Array.isArray(input.images) ? input.images : [],
    videos: Array.isArray(input.videos) ? input.videos : [],
    status: input.status || 'Active',
    featured: input.featured === true,
    user_id: userId,
    created_by: userId,
    phone: input.phone || '',
    dial_code: input.dialCode || '+91'
  };
}

// Get all rooms for a property with tenant and rent status
export const getPropertyRoomStatus = async (req, res) => {
  const propertyId = req.params.id;
  const client = await pool.connect();
  try {
    // Get all rooms with their transactions and users in a single query
    const { rows: rooms } = await client.query(
      `SELECT 
        f.floor_number,
        r.id as room_id,
        r.room_number,
        r.description,
        json_agg(
          json_build_object(
            'firstName', u.first_name,
            'lastName', u.last_name,
            'email', u.email,
            'transactionId', t.id,
            'userId', t.user_id,
            'moveInDate', t.move_in_date,
            'status', t.status,
            'description', t.description,
            'createdAt', t.created_at,
            'updatedAt', t.updated_at
          )
        ) as tenants
      FROM floors f
      JOIN rooms r ON f.id = r.floor_id
      LEFT JOIN transactions t ON r.id = t.room_id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE f.property_id = $1
      GROUP BY f.floor_number, r.id, r.room_number, r.description
      ORDER BY f.floor_number, r.room_number`,
      [propertyId]
    );

    // Group rooms by floor
    const grouped = {};
    for (const room of rooms) {
      if (!grouped[room.floor_number]) {
        grouped[room.floor_number] = [];
      }

      // Process tenants array
      let tenantNames = [];
      let rentStatus = 'N/A';

      // Filter out null entries from tenants array (rooms with no transactions)
      const validTenants = room.tenants.filter(t => t.transactionId !== null);
      
      if (validTenants.length > 0) {
        // Get tenant names
        tenantNames = validTenants.map(tenant => {
          const name = `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim();
          return name || tenant.email || 'Occupied';
        });

        // Get rent status from the first tenant (most recent transaction)
        rentStatus = validTenants[0].status;
      }

      grouped[room.floor_number].push({
        roomNumber: room.room_number,
        roomId: room.room_id,
        status: tenantNames,
        rentStatus,
        description: room.description || '',
      });
    }

    // Convert grouped to array of floors
    const result = Object.entries(grouped).map(([floor, rooms]) => ({
      floor,
      rooms
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in getPropertyRoomStatus:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

export const checkDuplicateProperty = async (req, res) => {
  try {
    const { title, location } = req.query;
    const client = await pool.connect();

    try {
      const { rows: existingProperty } = await client.query(
        `SELECT id FROM properties 
         WHERE title = $1 
         AND location = $2 
         AND status = 'Active'`,
        [title, location]
      );

      if (existingProperty.length > 0) {
        return res.json({
          success: false,
          isDuplicate: true,
          message: 'A property with the same title and location already exists'
        });
      }

      return res.json({
        success: true,
        isDuplicate: false,
        message: 'No duplicate property found'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error checking duplicate property:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking for duplicate property'
    });
  }
};

export const updateRoomDescription = async (req, res) => {
  const { roomId } = req.params;
  const { description } = req.body;
  const client = await pool.connect();
  
  try {
    // First verify the room exists and get its details
    const { rows: [room] } = await client.query(
      'SELECT r.*, f.property_id FROM rooms r JOIN floors f ON r.floor_id = f.id WHERE r.id = $1',
      [roomId]
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Update the room description
    const { rows: [updatedRoom] } = await client.query(
      `UPDATE rooms 
       SET description = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [description, roomId]
    );

    // Also update the transaction description if there's an active transaction
    await client.query(
      `UPDATE transactions 
       SET description = $1, updated_at = CURRENT_TIMESTAMP
       WHERE room_id = $2 AND status IN ('active', 'pending')`,
      [description, roomId]
    );
    
    res.json({ 
      success: true, 
      data: updatedRoom,
      message: 'Room description updated successfully'
    });
  } catch (error) {
    console.error('Error updating room description:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

export const updateRoomOccupancy = async (req, res) => {
  const { roomId } = req.params;
  const { increment } = req.body; // true for increment, false for decrement
  const client = await pool.connect();
  
  try {
    // First verify the room exists and get its details
    const { rows: [room] } = await client.query(
      'SELECT r.*, f.property_id FROM rooms r JOIN floors f ON r.floor_id = f.id WHERE r.id = $1',
      [roomId]
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Update the room occupancy by incrementing or decrementing
    const { rows: [updatedRoom] } = await client.query(
      `UPDATE rooms 
       SET occupied = CASE 
         WHEN $1 = true THEN occupied + 1
         ELSE GREATEST(0, occupied - 1)
       END,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [increment, roomId]
    );
    
    res.json({ 
      success: true, 
      data: updatedRoom,
      message: `Room occupancy ${increment ? 'increased' : 'decreased'}`
    });
  } catch (error) {
    console.error('Error updating room occupancy:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};
