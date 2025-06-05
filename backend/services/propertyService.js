import propertyRepository from '../repositories/propertyRepository.js';
import { isValidUUID } from '../utils/validateUUID.js';
import pool from '../config/postgres.js';

class PropertyService {
  async getAllProperties(filters = {}, page = 1, limit = 10) {
    try {
      const pgFilters = {};
  
      if (filters.$or) {
        const searchTerms = filters.$or.map(term => {
          const field = Object.keys(term)[0];
          const value = term[field].$regex;
          return `${field} ILIKE '%${value}%'`;
        });
        pgFilters.search = searchTerms.join(' OR ');
      }
  
      ['type', 'listing_type', 'beds', 'baths', 'verified'].forEach(field => {
        if (filters[field] !== undefined) {
          pgFilters[field] = filters[field];
        }
      });
  
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
  
      if (filters.price) {
        pgFilters.price = {};
        if (filters.price.$gte !== undefined) pgFilters.price.min = filters.price.$gte;
        if (filters.price.$lte !== undefined) pgFilters.price.max = filters.price.$lte;
      }
  
      if (filters.sqft) {
        pgFilters.sqft = {};
        if (filters.sqft.$gte !== undefined) pgFilters.sqft.min = filters.sqft.$gte;
        if (filters.sqft.$lte !== undefined) pgFilters.sqft.max = filters.sqft.$lte;
      }
  
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
        const { rows: [property] } = await client.query(
          'SELECT * FROM properties WHERE id = $1',
          [id]
        );

        if (!property) {
          throw new Error('Property not found');
        }

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

      if (!propertyData.slug) {
        propertyData.slug = `${propertyData.title}-${Date.now()}`
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
      }

      if (propertyData.listing_type === 'rent' && !propertyData.deposit) {
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

      const images = Array.isArray(propertyData.images) ? propertyData.images : [];
      const videos = Array.isArray(propertyData.videos) ? propertyData.videos : [];

      // First, insert the property
      const valuesArray = [
        propertyData.title,
        propertyData.subtitle,
        propertyData.description,
        propertyData.slug,
        propertyData.listing_type,
        propertyData.type,
        propertyData.price,
        propertyData.rent_type,
        propertyData.deposit,
        propertyData.property_age,
        propertyData.property_condition,
        propertyData.property_status,
        propertyData.location,
        propertyData.region,
        propertyData.latitude,
        propertyData.longitude,
        propertyData.street,
        propertyData.city,
        propertyData.state,
        propertyData.pincode,
        propertyData.country,
        propertyData.floor_area,
        propertyData.sqft,
        propertyData.floor_no,
        propertyData.total_floors,
        propertyData.beds,
        propertyData.baths,
        propertyData.furnishing,
        propertyData.amenities,
        propertyData.balcony,
        propertyData.central_ac,
        propertyData.power_backup,
        propertyData.parking,
        propertyData.security,
        propertyData.swimming_pool,
        propertyData.gym,
        propertyData.garden,
        propertyData.lift,
        propertyData.phone,
        propertyData.availability,
        images,
        videos,
        propertyData.status,
        propertyData.featured,
        propertyData.user_id,
        propertyData.created_by
      ];

      const { rows: [property] } = await client.query(
        `INSERT INTO properties (
          title, subtitle, description, slug, listing_type, type, price, rent_type, deposit, property_age, property_condition, property_status, location, region, latitude, longitude, street, city, state, pincode, country, floor_area, sqft, floor_no, total_floors, beds, baths, furnishing, amenities, balcony, central_ac, power_backup, parking, security, swimming_pool, gym, garden, lift, images, videos, status, featured, user_id, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44
        ) RETURNING *`,
        valuesArray
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

      const { rows: [existingProperty] } = await client.query(
        'SELECT * FROM properties WHERE id = $1',
        [id]
      );

      if (!existingProperty) {
        throw new Error('Property not found');
      }

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      const safeJsonParse = (value) => {
        if (!value) return null;
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (e) {
            console.log('JSON parse failed, trying comma-separated string');
            if (value.includes(',')) {
              const items = value.split(',').map(item => item.trim());
              console.log('Parsed comma-separated items:', items);
              return items;
            }
            return [value];
          }
        }
        return value;
      };

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

      const transformedData = {};

      const handleNumericField = (value) => {
        if (value === '' || value === undefined || value === null) return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
      };

      if (updateData.title !== undefined) transformedData.title = updateData.title;
      if (updateData.subtitle !== undefined) transformedData.subtitle = updateData.subtitle;
      if (updateData.slug !== undefined) transformedData.slug = updateData.slug;
      if(updateData.phone !== undefined) transformedData.phone = updateData.phone;
      if(updateData.availability !== undefined) transformedData.availability = updateData.availability;
      if (updateData.description !== undefined) transformedData.description = updateData.description;
      if (updateData.listing_type !== undefined) transformedData.listing_type = updateData.listing_type;
      if (updateData.type !== undefined) transformedData.type = updateData.type;
      if (updateData.price !== undefined) transformedData.price = handleNumericField(updateData.price);
      if (updateData.rent_type !== undefined) transformedData.rent_type = updateData.rent_type;
      if (updateData.deposit !== undefined) transformedData.deposit = handleNumericField(updateData.deposit);
      if (updateData.property_age !== undefined) transformedData.property_age = handleNumericField(updateData.property_age);
      if (updateData.property_condition !== undefined) transformedData.property_condition = updateData.property_condition || null;
      if (updateData.property_status !== undefined) transformedData.property_status = updateData.property_status || null;
      if (updateData.location !== undefined) transformedData.location = updateData.location;
      if (updateData.region !== undefined) transformedData.region = updateData.region;
      if (updateData.latitude !== undefined) transformedData.latitude = handleNumericField(updateData.latitude);
      if (updateData.longitude !== undefined) transformedData.longitude = handleNumericField(updateData.longitude);
      if (updateData.street !== undefined) transformedData.street = updateData.street;
      if (updateData.city !== undefined) transformedData.city = updateData.city;
      if (updateData.state !== undefined) transformedData.state = updateData.state;
      if (updateData.pincode !== undefined) transformedData.pincode = updateData.pincode;
      if (updateData.country !== undefined) transformedData.country = updateData.country;
      if (updateData.floor_area !== undefined) transformedData.floor_area = handleNumericField(updateData.floor_area);
      if (updateData.sqft !== undefined) transformedData.sqft = handleNumericField(updateData.sqft);
      if (updateData.floor_no !== undefined) transformedData.floor_no = handleNumericField(updateData.floor_no);
      if (updateData.total_floors !== undefined) transformedData.total_floors = handleNumericField(updateData.total_floors);
      if (updateData.beds !== undefined) transformedData.beds = handleNumericField(updateData.beds);
      if (updateData.baths !== undefined) transformedData.baths = handleNumericField(updateData.baths);
      if (updateData.furnishing !== undefined) transformedData.furnishing = updateData.furnishing;
      
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
      if (updateData.central_ac !== undefined) transformedData.central_ac = updateData.central_ac;
      if (updateData.power_backup !== undefined) transformedData.power_backup = updateData.power_backup;
      if (updateData.parking !== undefined) transformedData.parking = updateData.parking;
      if (updateData.security !== undefined) transformedData.security = updateData.security;
      if (updateData.swimming_pool !== undefined) transformedData.swimming_pool = updateData.swimming_pool;
      if (updateData.gym !== undefined) transformedData.gym = updateData.gym;
      if (updateData.garden !== undefined) transformedData.garden = updateData.garden;
      if (updateData.lift !== undefined) transformedData.lift = updateData.lift;
      if (updateData.images !== undefined) transformedData.images = Array.isArray(updateData.images) ? updateData.images : [updateData.images];
      if (updateData.videos !== undefined) transformedData.videos = Array.isArray(updateData.videos) ? updateData.videos : safeJsonParse(updateData.videos);
      if (updateData.status !== undefined) transformedData.status = updateData.status;
      if (updateData.featured !== undefined) transformedData.featured = updateData.featured;

      console.log('Transformed data:', transformedData);

      Object.entries(transformedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'amenities') {
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

      values.push(id);

      const updateQuery = `
        UPDATE properties 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      console.log('Update query:', updateQuery);
      console.log('Update values:', values);

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
