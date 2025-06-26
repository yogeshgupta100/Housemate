import pool from "../config/postgres.js";

const createPropertyTable = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS properties (
                id SERIAL PRIMARY KEY,
                title VARCHAR(100) NOT NULL CHECK (length(title) >= 5),
                subtitle VARCHAR(200),
                description TEXT,
                slug VARCHAR(255) UNIQUE,
                listing_type VARCHAR(10) NOT NULL CHECK (listing_type IN ('sale', 'rent')),
                type VARCHAR(50) NOT NULL CHECK (
                    (listing_type = 'sale' AND type IN ('house', 'apartment', 'office', 'villa', 'flat', 'commercial', 'residential plot', 'commercial plot', 'builder floor')) OR
                    (listing_type = 'rent' AND type IN ('house', 'apartment', 'office', 'villa', 'pg', 'flat', 'rk', 'commercial', 'residential plot', 'commercial plot', 'builder floor'))
                ),
                price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
                rent_type VARCHAR(10) CHECK (rent_type IN ('monthly', 'yearly', 'daily')) DEFAULT 'monthly',
                deposit DECIMAL(12,2) CHECK (deposit >= 0),
                
                -- Sale-specific fields
                property_age INTEGER CHECK (property_age >= 0),
                property_condition VARCHAR(20) CHECK (property_condition IN ('new', 'good', 'average', 'needs_repair')),
                property_status VARCHAR(20) CHECK (property_status IN ('ready_to_move', 'under_construction', 'renovated')),
                
                -- Location
                location VARCHAR(255) NOT NULL,
                region VARCHAR(100),
                latitude DECIMAL(10,8) NOT NULL,
                longitude DECIMAL(11,8) NOT NULL,
                street VARCHAR(255),
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(20),
                country VARCHAR(100) DEFAULT 'India',
                
                -- Property Features
                floor_area DECIMAL(10,2) DEFAULT 0,
                sqft DECIMAL(10,2) NOT NULL CHECK (sqft >= 0),
                floor_no INTEGER CHECK (floor_no >= 0),
                total_floors INTEGER CHECK (total_floors >= 1),
                beds INTEGER CHECK (beds >= 0),
                baths INTEGER CHECK (baths >= 0),
                
                -- Furnishing and Amenities
                furnishing VARCHAR(20) CHECK (furnishing IN ('Furnished', 'Semi-Furnished', 'Unfurnished')) DEFAULT 'Unfurnished',
                amenities TEXT[] DEFAULT '{}',
                
                -- Commercial Property Features
                balcony BOOLEAN DEFAULT false,
                central_ac BOOLEAN DEFAULT false,
                power_backup BOOLEAN DEFAULT false,
                
                -- Additional Features
                parking BOOLEAN DEFAULT false,
                security BOOLEAN DEFAULT false,
                swimming_pool BOOLEAN DEFAULT false,
                gym BOOLEAN DEFAULT false,
                garden BOOLEAN DEFAULT false,
                lift BOOLEAN DEFAULT false,
                
                -- New Office-specific fields
                office_area DECIMAL(10,2) CHECK (office_area >= 0),
                office_floors INTEGER CHECK (office_floors >= 1),
                office_capacity INTEGER CHECK (office_capacity >= 0),
                office_cabins INTEGER CHECK (office_cabins >= 0),
                meeting_rooms INTEGER CHECK (meeting_rooms >= 0),
                head_cabins INTEGER CHECK (head_cabins >= 0),
                office_amenities TEXT[] DEFAULT '{}',
                
                -- New Plot-specific fields
                plot_area DECIMAL(10,2) CHECK (plot_area >= 0),
                nearby_area VARCHAR(255),
                under_committee BOOLEAN DEFAULT false,
                passed_building_land BOOLEAN DEFAULT false,
                estimated_rental_income DECIMAL(12,2) CHECK (estimated_rental_income >= 0),
                
                -- New Builder Floor/House-specific fields
                builder_floors INTEGER CHECK (builder_floors >= 1),
                house_area DECIMAL(10,2) CHECK (house_area >= 0),
                house_bedrooms INTEGER CHECK (house_bedrooms >= 0),
                house_bathrooms INTEGER CHECK (house_bathrooms >= 0),
                house_balcony INTEGER CHECK (house_balcony >= 0),
                house_parking INTEGER CHECK (house_parking >= 0),
                house_amenities TEXT[] DEFAULT '{}',
                house_location VARCHAR(255),
                
                -- Images and Media
                images TEXT[] DEFAULT '{}',
                videos TEXT[] DEFAULT '{}',
                
                -- Status and Ownership
                status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Sold', 'Rented')),
                featured BOOLEAN DEFAULT false,
                user_id INTEGER REFERENCES users(id),
                created_by INTEGER REFERENCES users(id),
                updated_by INTEGER REFERENCES users(id),
                
                -- Timestamps
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Create indexes for better performance
            CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);
            CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
            CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
            CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
            CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
            CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);
            CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
            CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
        `);
  } catch (error) {
    console.error("Error creating properties table:", error);
    throw error;
  }
};

createPropertyTable();

export default {
  async create(propertyData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Generate slug if not provided
      if (!propertyData.slug) {
        propertyData.slug = `${propertyData.title}-${Date.now()}`
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
      }

      // Calculate deposit if not provided for rent
      if (propertyData.listing_type === "rent" && !propertyData.deposit) {
        const multipliers = {
          house: 2,
          apartment: 3,
          office: 3,
          villa: 3,
          commercial: 3,
          flat: 2,
          pg: 1,
          rk: 1,
        };
        propertyData.deposit =
          propertyData.price * (multipliers[propertyData.type] || 2);
      }

      // Ensure property_condition is valid or null
      const allowedConditions = ["new", "good", "average", "needs_repair"];
      if (
        !allowedConditions.includes(propertyData.property_condition) ||
        propertyData.property_condition === "" ||
        propertyData.property_condition === undefined
      ) {
        propertyData.property_condition = null;
      }
      console.log('property_condition to insert:', propertyData.property_condition, typeof propertyData.property_condition);

      const { rows } = await client.query(
        `INSERT INTO properties (
                    title, subtitle, description, slug, listing_type, type, price, rent_type,
                    deposit, property_age, property_condition, property_status,
                    location, region, latitude, longitude, street, city, state,
                    pincode, country, floor_area, sqft, floor_no, total_floors,
                    beds, baths, furnishing, amenities, balcony, central_ac,
                    power_backup, parking, security, swimming_pool, gym, garden,
                    lift, office_area, office_floors, office_capacity, office_cabins,
                    meeting_rooms, head_cabins, office_amenities, plot_area, nearby_area,
                    under_committee, passed_building_land, estimated_rental_income,
                    builder_floors, house_area, house_bedrooms, house_bathrooms,
                    house_balcony, house_parking, house_amenities, house_location,
                    images, videos, status, featured, user_id, created_by, updated_by
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                    $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
                    $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38,
                    $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
                    $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62,
                    $63, $64, $65, $66, $67, $68, $69, $70, $71, $72, $73, $74
                ) RETURNING *`,
        [
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
          propertyData.office_area,
          propertyData.office_floors,
          propertyData.office_capacity,
          propertyData.office_cabins,
          propertyData.meeting_rooms,
          propertyData.head_cabins,
          propertyData.office_amenities,
          propertyData.plot_area,
          propertyData.nearby_area,
          propertyData.under_committee,
          propertyData.passed_building_land,
          propertyData.estimated_rental_income,
          propertyData.builder_floors,
          propertyData.house_area,
          propertyData.house_bedrooms,
          propertyData.house_bathrooms,
          propertyData.house_balcony,
          propertyData.house_parking,
          propertyData.house_amenities,
          propertyData.house_location,
          propertyData.images,
          propertyData.videos,
          propertyData.featured || false,
          propertyData.user_id,
          propertyData.created_by,
          propertyData.updated_by,
        ]
      );

      await client.query("COMMIT");
      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

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
  },

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
  },

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

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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
    console.log('Final query:', query);
console.log('With values:', values);

    return rows;
  },

  async update(id, updateData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

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
                 SET ${setClause.join(", ")}, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $${paramCount}
                 RETURNING *`,
        values
      );

      await client.query("COMMIT");
      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async delete(id) {
    const { rows } = await pool.query(
      "DELETE FROM properties WHERE id = $1 RETURNING *",
      [id]
    );
    return rows[0];
  },

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
      [String(userId)] // 👈 ensure UUID is passed correctly
    );
    return rows;
  },

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
  },
};
