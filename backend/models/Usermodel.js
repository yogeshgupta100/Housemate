import pool from '../config/postgres.js';

const createUserTable = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create users table first
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL CHECK (length(first_name) >= 2),
                last_name VARCHAR(50) NOT NULL CHECK (length(last_name) >= 2),
                email VARCHAR(255) NOT NULL UNIQUE CHECK (email ~* '^[\\w.-]+@[\\w.-]+\\.[\\w]{2,3}$'),
                password VARCHAR(255) NOT NULL CHECK (length(password) >= 6),
                phone VARCHAR(10) NOT NULL CHECK (phone ~ '^[0-9]{10}$'),
                gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
                role_id INTEGER REFERENCES roles(id),
                user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('individual', 'corporate', 'dealer', 'admin')) DEFAULT 'individual',
                company_name VARCHAR(255),
                registration_number VARCHAR(255),
                dealer_license VARCHAR(255),
                city VARCHAR(100),
                state VARCHAR(100),
                reset_password_token VARCHAR(255),
                reset_password_expire TIMESTAMP WITH TIME ZONE,
                email_verification_token VARCHAR(255),
                last_login TIMESTAMP WITH TIME ZONE,
                password_changed_at TIMESTAMP WITH TIME ZONE,
                is_active BOOLEAN DEFAULT true,
                bio TEXT,
                profile_image VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query('COMMIT');
        console.log('Users table created successfully');

        // Check if properties table exists before creating user_favorites
        const { rows: tableCheck } = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'properties'
            );
        `);

        if (tableCheck[0].exists) {
            await client.query('BEGIN');
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_favorites (
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, property_id)
                );
            `);
            await client.query('COMMIT');
            console.log('User favorites table created successfully');
        } else {
            console.log('Waiting for properties table to be created before creating user_favorites table...');
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating users table:', error);
        // Don't throw the error, just log it and let the application continue
    } finally {
        client.release();
    }
};

createUserTable();

setInterval(async () => {
    try {
        const { rows: tableCheck } = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'user_favorites'
            );
        `);
        
        if (!tableCheck[0].exists) {
            const client = await pool.connect();
            try {
                const { rows: propertiesCheck } = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'properties'
                    );
                `);

                if (propertiesCheck[0].exists) {
                    await client.query('BEGIN');
                    await client.query(`
                        CREATE TABLE IF NOT EXISTS user_favorites (
                            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                            property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (user_id, property_id)
                        );
                    `);
                    await client.query('COMMIT');
                    console.log('User favorites table created successfully');
                }
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error creating user_favorites table:', error);
            } finally {
                client.release();
            }
        }
    } catch (error) {
        console.error('Error checking user_favorites table:', error);
    }
}, 5000);

export default {
    async create(userData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            const { rows } = await client.query(
                `INSERT INTO users (
                    first_name, last_name, email, password, phone, gender,
                    role_id, user_type, company_name, registration_number,
                    dealer_license, city, state, bio
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *`,
                [
                    userData.firstName,
                    userData.lastName,
                    userData.email,
                    hashedPassword,
                    userData.phone,
                    userData.gender,
                    userData.role,
                    userData.userType,
                    userData.companyName,
                    userData.registrationNumber,
                    userData.dealerLicense,
                    userData.address?.city,
                    userData.address?.state,
                    userData.bio
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
    },

    async findByEmail(email) {
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return rows[0];
    },

    async findById(id) {
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return rows[0];
    },

    async update(id, updateData) {
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
                `UPDATE users 
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
    },

    async addFavorite(userId, propertyId) {
        const { rows } = await pool.query(
            `INSERT INTO user_favorites (user_id, property_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, property_id) DO NOTHING
             RETURNING *`,
            [userId, propertyId]
        );
        return rows[0];
    },

    async removeFavorite(userId, propertyId) {
        const { rows } = await pool.query(
            `DELETE FROM user_favorites 
             WHERE user_id = $1 AND property_id = $2
             RETURNING *`,
            [userId, propertyId]
        );
        return rows[0];
    },

    async getFavorites(userId) {
        const { rows } = await pool.query(
            `SELECT p.* FROM properties p
             INNER JOIN user_favorites uf ON p.id = uf.property_id
             WHERE uf.user_id = $1
             ORDER BY uf.created_at DESC`,
            [userId]
        );
        return rows;
    }
};
