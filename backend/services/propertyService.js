import propertyRepository from '../repositories/propertyRepository.js';
import { isValidUUID } from '../utils/validateUUID.js';
import pool from '../config/postgres.js';

class PropertyService {
  async getAllProperties(filters = {}, page = 1, limit = 10) {
    try {
      const pgFilters = {};
  
      // Text search conversion
      if (filters.$or) {
        const searchTerms = filters.$or.map(term => {
          const field = Object.keys(term)[0];
          const value = term[field].$regex;
          return `${field} ILIKE '%${value}%'`;
        });
        pgFilters.search = searchTerms.join(' OR ');
      }
  
      // Exact matches with validation for UUID fields
      ['type', 'listing_type', 'beds', 'baths', 'verified'].forEach(field => {
        if (filters[field] !== undefined) {
          pgFilters[field] = filters[field];
        }
      });
  
      // Validate UUID filters strictly
      if (filters.user_id) {
        if (typeof filters.user_id === 'string' && isValidUUID(filters.user_id)) {
          pgFilters.user_id = filters.user_id;
        } else {
          console.warn('Invalid user_id filter ignored:', filters.user_id);
        }
      }
  
      if (filters.created_by) {
        if (typeof filters.created_by === 'string' && isValidUUID(filters.created_by)) {
          pgFilters.created_by = filters.created_by;
        } else {
          console.warn('Invalid created_by filter ignored:', filters.created_by);
        }
      }
  
      // Range filters for price
      if (filters.price) {
        pgFilters.price = {};
        if (filters.price.$gte !== undefined) pgFilters.price.min = filters.price.$gte;
        if (filters.price.$lte !== undefined) pgFilters.price.max = filters.price.$lte;
      }
  
      // Range filters for sqft
      if (filters.sqft) {
        pgFilters.sqft = {};
        if (filters.sqft.$gte !== undefined) pgFilters.sqft.min = filters.sqft.$gte;
        if (filters.sqft.$lte !== undefined) pgFilters.sqft.max = filters.sqft.$lte;
      }
  
      // Amenities array filter
      if (filters.amenities) {
        pgFilters.amenities = filters.amenities;
      }
  
      const properties = await propertyRepository.findAll(pgFilters, page, limit);
      return properties;
    } catch (error) {
      console.error('Error in getAllProperties:', error);
      throw new Error(`Failed to fetch properties: ${error.message}`);
    }
  }

  async getPropertyById(id) {
    try {
      const client = await pool.connect();
      try {
        // Get property details
        const { rows: [property] } = await client.query(
          'SELECT * FROM properties WHERE id = $1',
          [id]
        );

        if (!property) {
          throw new Error('Property not found');
        }

        // Get floors and rooms for this property
        const { rows: floors } = await client.query(
          `SELECT f.*, 
           json_agg(
             json_build_object(
               'id', r.id,
               'roomNumber', r.room_number,
               'capacity', r.capacity,
               'occupied', r.occupied,
               'rent', r.rent_amount,
               'availableFrom', r.available_from,
               'hasBalcony', r.has_balcony
             )
           ) as rooms
           FROM floors f
           LEFT JOIN rooms r ON f.id = r.floor_id
           WHERE f.property_id = $1
           GROUP BY f.id
           ORDER BY f.floor_number`,
          [id]
        );

        // Format the response
        return {
          ...property,
          floorDetails: floors.map(floor => ({
            id: floor.id,
            floorNumber: floor.floor_number,
            rooms: floor.rooms[0] === null ? [] : floor.rooms
          }))
        };
      } finally {
        client.release();
      }
    } catch (error) {
      throw new Error(`Error fetching property: ${error.message}`);
    }
  }

  async createProperty(propertyData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate slug if not provided
      if (!propertyData.slug) {
        propertyData.slug = `${propertyData.title}-${Date.now()}`
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
      }

      // Calculate deposit if not provided for rent
      if (propertyData.listingType === 'rent' && !propertyData.deposit) {
        const multipliers = {
          house: 2,
          apartment: 3,
          office: 3,
          villa: 3,
          commercial: 3,
          flat: 2,
          pg: 1,
          rk: 1
        };
        propertyData.deposit = propertyData.price * (multipliers[propertyData.type] || 2);
      }

      // Ensure images is an array of strings (S3 URLs)
      const images = Array.isArray(propertyData.images) ? propertyData.images : [];

      // First, insert the property
      const { rows: [property] } = await client.query(
        `INSERT INTO properties (
          title, type, price, location, description, beds, baths,
          sqft, phone, listing_type, amenities, images, latitude,
          longitude, street, city, state, pincode, country,
          floor_area, property_age, property_condition, property_status,
          availability, status, slug, user_id, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
          $25, $26, $27, $28
        ) RETURNING *`,
        [
          propertyData.title,
          propertyData.type,
          propertyData.price || 0,
          propertyData.location,
          propertyData.description,
          propertyData.beds || 0,
          propertyData.baths || 0,
          propertyData.sqft || 0,
          propertyData.phone,
          propertyData.listingType,
          propertyData.amenities,
          images,
          propertyData.coordinates?.latitude || 0,
          propertyData.coordinates?.longitude || 0,
          propertyData.address?.street || '',
          propertyData.address?.city || '',
          propertyData.address?.state || '',
          propertyData.address?.pincode || '',
          propertyData.address?.country || 'India',
          propertyData.floorArea || 0,
          propertyData.propertyAge || 0,
          propertyData.propertyCondition || '',
          propertyData.propertyStatus || '',
          propertyData.availability ? JSON.stringify(propertyData.availability) : null,
          propertyData.status || 'Active',
          propertyData.slug,
          propertyData.userId,
          propertyData.createdBy
        ]
      );

      // If floor details are provided, insert them
      if (propertyData.floorDetails && Array.isArray(propertyData.floorDetails)) {
        for (const floor of propertyData.floorDetails) {
          // Insert floor
          const { rows: [floorRecord] } = await client.query(
            `INSERT INTO floors (property_id, floor_number)
             VALUES ($1, $2)
             RETURNING *`,
            [property.id, floor.floorNumber]
          );

          // Insert rooms for this floor
          if (floor.rooms && Array.isArray(floor.rooms)) {
            for (const room of floor.rooms) {
              await client.query(
                `INSERT INTO rooms (floor_id, room_number, capacity, occupied, rent_amount, available_from, has_balcony)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  floorRecord.id,
                  room.roomNumber,
                  room.capacity,
                  room.occupied || 0,
                  room.rent_amount ?? 0,
                  room.availableFrom || null,
                  room.hasBalcony || false
                ]
              );
            }
          }
        }
      }

      await client.query('COMMIT');
      return property;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateProperty(id, updateData) {
    // Prevent user_id changes for ownership protection
    delete updateData.user_id;

    if (updateData.created_by && !isValidUUID(updateData.created_by)) {
      updateData.created_by = '00000000-0000-0000-0000-000000000000';
    }

    return await propertyRepository.findByIdAndUpdate(id, updateData);
  }
}

export default new PropertyService();
