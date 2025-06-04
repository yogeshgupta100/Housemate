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
          title, type, price, deposit, location, description, beds, baths,
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
          propertyData.price,
          propertyData.deposit,
          propertyData.location,
          propertyData.description,
          propertyData.beds,
          propertyData.baths,
          propertyData.sqft,
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
          propertyData.floorArea,
          propertyData.propertyAge,
          propertyData.propertyCondition,
          propertyData.propertyStatus,
          propertyData.availability ? JSON.stringify(propertyData.availability) : null,
          propertyData.status || 'Active',
          propertyData.slug,
          propertyData.userId,
          propertyData.createdBy
        ]
      );

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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // First, check if the property exists
      const { rows: [existingProperty] } = await client.query(
        'SELECT * FROM properties WHERE id = $1',
        [id]
      );

      if (!existingProperty) {
        throw new Error('Property not found');
      }

      // Prepare the update fields and values
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Helper function to safely parse JSON
      const safeJsonParse = (value) => {
        if (!value) return null;
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (e) {
            console.log('JSON parse failed, trying comma-separated string');
            // If parsing fails, try to handle as comma-separated string
            if (value.includes(',')) {
              const items = value.split(',').map(item => item.trim());
              console.log('Parsed comma-separated items:', items);
              return items;
            }
            return [value]; // Return as single-item array if no commas
          }
        }
        return value;
      };

      // Helper function to safely stringify JSON
      const safeJsonStringify = (value) => {
        if (!value) return null;
        if (typeof value === 'object') {
          try {
            return JSON.stringify(value);
          } catch (e) {
            console.error('JSON stringify failed:', e);
            return null;
          }
        }
        return value;
      };

      // Transform the data before updating
      const transformedData = {};

      // Helper function to handle numeric fields
      const handleNumericField = (value) => {
        if (value === '' || value === undefined || value === null) return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
      };

      // Handle each field explicitly
      if (updateData.title !== undefined) transformedData.title = updateData.title;
      if (updateData.subtitle !== undefined) transformedData.subtitle = updateData.subtitle;
      if (updateData.description !== undefined) transformedData.description = updateData.description;
      if (updateData.listingType !== undefined) transformedData.listing_type = updateData.listingType;
      if (updateData.type !== undefined) transformedData.type = updateData.type;
      if (updateData.price !== undefined) transformedData.price = handleNumericField(updateData.price);
      if (updateData.deposit !== undefined) transformedData.deposit = handleNumericField(updateData.deposit);
      if (updateData.rentType !== undefined) transformedData.rent_type = updateData.rentType;
      if (updateData.propertyAge !== undefined) transformedData.property_age = handleNumericField(updateData.propertyAge);
      if (updateData.propertyCondition !== undefined) transformedData.property_condition = updateData.propertyCondition || null;
      if (updateData.propertyStatus !== undefined) transformedData.property_status = updateData.propertyStatus || null;
      if (updateData.availability !== undefined) transformedData.availability = safeJsonStringify(updateData.availability);
      if (updateData.location !== undefined) transformedData.location = updateData.location;
      if (updateData.phone !== undefined) transformedData.phone = updateData.phone;
      if (updateData.region !== undefined) transformedData.region = updateData.region;
      if (updateData.latitude !== undefined) transformedData.latitude = handleNumericField(updateData.latitude);
      if (updateData.longitude !== undefined) transformedData.longitude = handleNumericField(updateData.longitude);
      if (updateData.street !== undefined) transformedData.street = updateData.street;
      if (updateData.city !== undefined) transformedData.city = updateData.city;
      if (updateData.state !== undefined) transformedData.state = updateData.state;
      if (updateData.pincode !== undefined) transformedData.pincode = updateData.pincode;
      if (updateData.country !== undefined) transformedData.country = updateData.country;
      if (updateData.floorArea !== undefined) transformedData.floor_area = handleNumericField(updateData.floorArea);
      if (updateData.sqft !== undefined) transformedData.sqft = handleNumericField(updateData.sqft);
      if (updateData.floorNo !== undefined) transformedData.floor_no = handleNumericField(updateData.floorNo);
      if (updateData.totalFloors !== undefined) transformedData.total_floors = handleNumericField(updateData.totalFloors);
      if (updateData.beds !== undefined) transformedData.beds = handleNumericField(updateData.beds);
      if (updateData.baths !== undefined) transformedData.baths = handleNumericField(updateData.baths);
      if (updateData.furnishing !== undefined) transformedData.furnishing = updateData.furnishing;
      
      // Handle amenities with detailed logging
      if (updateData.amenities !== undefined) {
        console.log('Processing amenities:', updateData.amenities);
        if (Array.isArray(updateData.amenities)) {
          console.log('Amenities is already an array');
          transformedData.amenities = updateData.amenities;
        } else if (typeof updateData.amenities === 'string') {
          console.log('Amenities is a string, attempting to parse');
          if (updateData.amenities.includes(',')) {
            console.log('Splitting comma-separated string');
            transformedData.amenities = updateData.amenities.split(',').map(item => item.trim());
          } else {
            console.log('Single amenity string');
            transformedData.amenities = [updateData.amenities];
          }
        } else {
          console.log('Attempting to parse amenities as JSON');
          transformedData.amenities = safeJsonParse(updateData.amenities);
        }
        console.log('Final transformed amenities:', transformedData.amenities);
      }

      if (updateData.balcony !== undefined) transformedData.balcony = updateData.balcony;
      if (updateData.centralAc !== undefined) transformedData.central_ac = updateData.centralAc;
      if (updateData.powerBackup !== undefined) transformedData.power_backup = updateData.powerBackup;
      if (updateData.parking !== undefined) transformedData.parking = updateData.parking;
      if (updateData.security !== undefined) transformedData.security = updateData.security;
      if (updateData.swimmingPool !== undefined) transformedData.swimming_pool = updateData.swimmingPool;
      if (updateData.gym !== undefined) transformedData.gym = updateData.gym;
      if (updateData.garden !== undefined) transformedData.garden = updateData.garden;
      if (updateData.lift !== undefined) transformedData.lift = updateData.lift;
      if (updateData.images !== undefined) transformedData.images = Array.isArray(updateData.images) ? updateData.images : [updateData.images];
      if (updateData.videos !== undefined) transformedData.videos = Array.isArray(updateData.videos) ? updateData.videos : safeJsonParse(updateData.videos);
      if (updateData.status !== undefined) transformedData.status = updateData.status;
      if (updateData.featured !== undefined) transformedData.featured = updateData.featured;

      console.log('Transformed data:', transformedData);

      // Build the update query dynamically
      Object.entries(transformedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'amenities') {
            // Handle amenities array specifically
            updateFields.push(`${key} = ARRAY[${value.map(v => `'${v}'`).join(',')}]::text[]`);
          } else {
            updateFields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }
      });

      if (updateFields.length === 0) {
        console.log('No fields to update. Update data:', updateData);
        console.log('Transformed data:', transformedData);
        throw new Error('No valid fields to update');
      }

      // Add the property ID to the values array
      values.push(id);

      const updateQuery = `
        UPDATE properties 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      console.log('Update query:', updateQuery);
      console.log('Update values:', values);

      // Update the property
      const { rows: [updatedProperty] } = await client.query(updateQuery, values);

      console.log('Updated property:', updatedProperty);

      await client.query('COMMIT');
      return updatedProperty;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating property:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new PropertyService();
