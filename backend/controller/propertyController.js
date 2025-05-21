import Property from '../models/propertymodel.js';
import aiService from '../services/aiService.js';

export const searchProperties = async (req, res) => {
    try {
        const { city, maxPrice, propertyCategory, propertyType, limit = 6 } = req.body;

        if (!city || !maxPrice) {
            return res.status(400).json({ success: false, message: 'City and maxPrice are required' });
        }

        // Find properties from our database
        const properties = await Property.find({
            'address.city': { $regex: new RegExp(city, 'i') },
            price: { $lte: maxPrice },
            type: propertyType || { $exists: true },
            status: 'Active'
        }).limit(Math.min(limit, 6));

        // Analyze the properties using AI
        const analysis = await aiService.analyzeProperties(
            properties,
            city,
            maxPrice,
            propertyCategory || 'Residential',
            propertyType || 'Flat'
        );

        res.json({
            success: true,
            properties,
            analysis
        });
    } catch (error) {
        console.error('Error searching properties:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to search properties',
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

/**
 * Get all properties with pagination
 */
export const getAllProperties = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Build filter based on query parameters
        const filter = { status: 'Active' };
        
        if (req.query.listingType) {
            filter.listingType = req.query.listingType;
        }
        
        if (req.query.type) {
            filter.type = req.query.type;
        }
        
        if (req.query.minPrice) {
            filter.price = { ...filter.price, $gte: parseFloat(req.query.minPrice) };
        }
        
        if (req.query.maxPrice) {
            filter.price = { ...filter.price, $lte: parseFloat(req.query.maxPrice) };
        }
        
        if (req.query.city) {
            filter['address.city'] = { $regex: new RegExp(req.query.city, 'i') };
        }

        
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
        console.error('Error fetching properties:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch properties',
            error: error.message
        });
    }
};

/**
 * Get a single property by ID
 */
export const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ success: false, message: 'Property ID is required' });
        }
        
        const property = await Property.findById(id).select('-__v');
        
        if (!property) {
            return res.status(404).json({ success: false, message: 'Property not found' });
        }
        
        res.json({
            success: true,
            property
        });
    } catch (error) {
        console.error('Error fetching property:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch property',
            error: error.message
        });
    }
};

/**
 * Get featured properties
 */
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

/**
 * Get properties by category
 */
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