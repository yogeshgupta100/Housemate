import pool from '../config/postgres.js';

class PropertyRepository {
  async create(propertyData) {
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
      if (propertyData.listing_type === 'rent' && !propertyData.deposit) {
        const multipliers = {
          'house': 2,
          'apartment': 3,
          'office': 3,
          'villa': 3,
          'commercial': 3,
          'flat': 2,
          'pg': 1,
          'rk': 1
        };
        propertyData.deposit = propertyData.price * (multipliers[propertyData.type] || 2);
      }

      const { rows } = await client.query(
        `INSERT INTO properties (
          title, subtitle, slug, listing_type, type, price, rent_type,
          deposit, property_age, property_condition, property_status,
          location, region, latitude, longitude, street, city, state,
          pincode, country, floor_area, sqft, floor_no, total_floors,
          beds, baths, furnishing, amenities, balcony, central_ac,
          power_backup, parking, security, swimming_pool, gym, garden,
          lift, images, videos, status, featured, user_id, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
          $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38,
          $39, $40, $41, $42
        ) RETURNING *`,
        [
          propertyData.title,
          propertyData.subtitle,
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
          propertyData.images,
          propertyData.videos,
          propertyData.status || 'Active',
          propertyData.featured || false,
          propertyData.user_id,
          propertyData.created_by
        ]
      );
      
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT p.*, 
              u.first_name as owner_first_name, u.last_name as owner_last_name,
              c.first_name as creator_first_name, c.last_name as creator_last_name
       FROM properties p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN users c ON p.created_by = c.id
       WHERE p.id = $1`,
      [id]
    );
    return rows[0];
  }

  async findBySlug(slug) {
    const { rows } = await pool.query(
      `SELECT p.*, 
              u.first_name as owner_first_name, u.last_name as owner_last_name,
              c.first_name as creator_first_name, c.last_name as creator_last_name
       FROM properties p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN users c ON p.created_by = c.id
       WHERE p.slug = $1`,
      [slug]
    );
    return rows[0];
  }

  async findAll(filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Build filter conditions
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          conditions.push(`${key} = ANY($${paramCount})`);
          values.push(value);
        } else {
          conditions.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT p.*, 
              u.first_name as owner_first_name, u.last_name as owner_last_name,
              c.first_name as creator_first_name, c.last_name as creator_last_name
       FROM properties p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN users c ON p.created_by = c.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset]
    );

    return rows;
  }

  async countDocuments(filter) {
    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM properties WHERE ${Object.entries(filter).map(([key, value]) => `${key} = $${Object.keys(filter).indexOf(key) + 1}`).join(' AND ')}`,
      Object.values(filter)
    );
    return parseInt(rows[0].count);
  }

  async findByIdAndUpdate(id, updateData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const setClause = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          setClause.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (setClause.length === 0) return null;

      values.push(id);
      const { rows } = await client.query(
        `UPDATE properties 
         SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );
      
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findByIdAndDelete(id) {
    const { rows } = await pool.query(
      'DELETE FROM properties WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0];
  }

  async findByUser(userId) {
    const { rows } = await pool.query(
      `SELECT p.*, 
              u.first_name as owner_first_name, u.last_name as owner_last_name,
              c.first_name as creator_first_name, c.last_name as creator_last_name
       FROM properties p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN users c ON p.created_by = c.id
       WHERE p.created_by = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return rows;
  }

  async findFeatured(limit = 6) {
    const { rows } = await pool.query(
      `SELECT p.*, 
              u.first_name as owner_first_name, u.last_name as owner_last_name,
              c.first_name as creator_first_name, c.last_name as creator_last_name
       FROM properties p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN users c ON p.created_by = c.id
       WHERE p.featured = true AND p.status = 'Active'
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  }

  async searchProperties(query, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Add search conditions
    if (query) {
      conditions.push(`(
        p.title ILIKE $${paramCount} OR
        p.subtitle ILIKE $${paramCount} OR
        p.location ILIKE $${paramCount} OR
        p.city ILIKE $${paramCount} OR
        p.state ILIKE $${paramCount}
      )`);
      values.push(`%${query}%`);
      paramCount++;
    }

    // Add filter conditions
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          conditions.push(`${key} = ANY($${paramCount})`);
          values.push(value);
        } else {
          conditions.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT p.*, 
              u.first_name as owner_first_name, u.last_name as owner_last_name,
              c.first_name as creator_first_name, c.last_name as creator_last_name
       FROM properties p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN users c ON p.created_by = c.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset]
    );

    return rows;
  }

  async getSimilarProperties(propertyId, limit = 5) {
    const property = await this.findById(propertyId);
    if (!property) return [];

    const { rows } = await pool.query(
      `SELECT p.*, 
              u.first_name as owner_first_name, u.last_name as owner_last_name,
              c.first_name as creator_first_name, c.last_name as creator_last_name
       FROM properties p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN users c ON p.created_by = c.id
       WHERE p.id != $1
       AND p.listing_type = $2
       AND p.type = $3
       AND p.city = $4
       AND p.status = 'Active'
       ORDER BY p.created_at DESC
       LIMIT $5`,
      [propertyId, property.listing_type, property.type, property.city, limit]
    );
    return rows;
  }
}

export default new PropertyRepository();
