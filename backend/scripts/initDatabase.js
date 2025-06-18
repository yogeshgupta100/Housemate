import pool from '../config/postgres.js';
import bcrypt from 'bcryptjs';

const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Drop existing tables in reverse order of dependencies
        await client.query(`
            DROP TABLE IF EXISTS news_subscribers CASCADE;
            DROP TABLE IF EXISTS newsletter_subscribers CASCADE;
            DROP TABLE IF EXISTS stats CASCADE;
            DROP TABLE IF EXISTS forms CASCADE;
            DROP TABLE IF EXISTS appointments CASCADE;
            DROP TABLE IF EXISTS user_favorites CASCADE;
            DROP TABLE IF EXISTS rooms CASCADE;
            DROP TABLE IF EXISTS floors CASCADE;
            DROP TABLE IF EXISTS properties CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
            DROP TABLE IF EXISTS roles CASCADE;
        `);

        // 1. Create roles table first (since other tables depend on it)
        await client.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insert default roles
        const defaultRoles = [
            {
                name: 'individual',
                description: 'Regular individual user',
                isActive: true
            },
            {
                name: 'corporate',
                description: 'Corporate user with additional privileges',
                isActive: true
            },
            {
                name: 'dealer',
                description: 'Property dealer with property management privileges',
                isActive: true
            },
            {
                name: 'admin',
                description: 'System administrator',
                isActive: true
            }
        ];

        for (const role of defaultRoles) {
            await client.query(
                `INSERT INTO roles (name, description, is_active)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (name) 
                 DO UPDATE SET 
                    description = $2,
                    is_active = $3,
                    updated_at = CURRENT_TIMESTAMP`,
                [role.name, role.description, role.isActive]
            );
        }

        // 2. Create users table
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
                marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
                govt_id_number VARCHAR(50),
                id_card_images TEXT[],
                verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
                profession VARCHAR(100),
                nationality VARCHAR(100),
                bank_details JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Create properties table
        await client.query(`
            CREATE TABLE IF NOT EXISTS properties (
                id SERIAL PRIMARY KEY,
                title VARCHAR(100) NOT NULL CHECK (length(title) >= 5),
                subtitle VARCHAR(200),
                description TEXT,
                slug VARCHAR(255) UNIQUE,
                listing_type VARCHAR(10) NOT NULL CHECK (listing_type IN ('sale', 'rent')),
                type VARCHAR(50) NOT NULL CHECK (
                    (listing_type = 'sale' AND type IN ('house', 'apartment', 'office', 'villa', 'flat', 'commercial', 'residential plot', 'commercial plot')) OR
                    (listing_type = 'rent' AND type IN ('house', 'apartment', 'office', 'villa', 'pg', 'flat', 'rk', 'commercial', 'residential plot', 'commercial plot'))
                ),
                price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
                rent_type VARCHAR(10) CHECK (rent_type IN ('monthly', 'yearly', 'daily')) DEFAULT 'monthly',
                deposit DECIMAL(12,2) CHECK (deposit >= 0),
                
                -- Sale-specific fields
                property_age INTEGER CHECK (property_age >= 0),
                property_condition VARCHAR(20) CHECK (property_condition IN ('new', 'good', 'average', 'needs_repair')),
                property_status VARCHAR(20) CHECK (property_status IN ('ready_to_move', 'under_construction', 'renovated')),
                availability JSONB,
                
                -- Location
                location VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
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
        `);

        // Create property indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);
            CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
            CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
            CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
            CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
            CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);
            CREATE INDEX IF NOT EXISTS idx_properties_updated_by ON properties(updated_by);
            CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
            CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
        `);

        // 4. Create floors table
        await client.query(`
            CREATE TABLE IF NOT EXISTS floors (
                id SERIAL PRIMARY KEY,
                property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
                floor_number INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(property_id, floor_number)
            );
        `);

        // Create floor index
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_floors_property_id ON floors(property_id);
        `);

        // 5. Create rooms table
        await client.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id SERIAL PRIMARY KEY,
                floor_id INTEGER REFERENCES floors(id) ON DELETE CASCADE,
                room_number INTEGER NOT NULL,
                room_type VARCHAR(50),
                area DECIMAL(10,2),
                description TEXT,
                rent_amount DECIMAL(12,2) NOT NULL CHECK (rent_amount >= 0),
                available_from DATE,
                has_balcony BOOLEAN DEFAULT false,
                capacity INTEGER DEFAULT 1 CHECK (capacity > 0),
                occupied INTEGER DEFAULT 0 CHECK (occupied >= 0),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(floor_id, room_number)
            );
        `);

        // Create room indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_rooms_floor_id ON rooms(floor_id);
            CREATE INDEX IF NOT EXISTS idx_rooms_rent_amount ON rooms(rent_amount);
            CREATE INDEX IF NOT EXISTS idx_rooms_available_from ON rooms(available_from);
        `);

        // 6. Create user_favorites table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_favorites (
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, property_id)
            );
        `);

        // 7. Create room_availability_requests table
        await client.query(`
            CREATE TABLE IF NOT EXISTS room_availability_requests (
                id SERIAL PRIMARY KEY,
                room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
                property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
                owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create room_availability_requests indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_room_availability_requests_room_id ON room_availability_requests(room_id);
            CREATE INDEX IF NOT EXISTS idx_room_availability_requests_property_id ON room_availability_requests(property_id);
            CREATE INDEX IF NOT EXISTS idx_room_availability_requests_owner_id ON room_availability_requests(owner_id);
            CREATE INDEX IF NOT EXISTS idx_room_availability_requests_status ON room_availability_requests(status);
        `);

        // 8. Create appointments table
        await client.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id SERIAL PRIMARY KEY,
                property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                preferred_date DATE NOT NULL,
                preferred_time TIME NOT NULL,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                feedback TEXT,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                CONSTRAINT valid_appointment_time CHECK (preferred_time >= '09:00' AND preferred_time <= '17:00')
            );

            CREATE INDEX IF NOT EXISTS idx_appointments_property_id ON appointments(property_id);
            CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
            CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
            CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(preferred_date);
        `);

        // 9. Create forms table
        await client.query(`
            CREATE TABLE IF NOT EXISTS forms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                message TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 10. Create stats table
        await client.query(`
            CREATE TABLE IF NOT EXISTS stats (
                id SERIAL PRIMARY KEY,
                endpoint VARCHAR(255) NOT NULL,
                method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD')),
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                response_time INTEGER NOT NULL,
                status_code INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_stats_endpoint_timestamp ON stats(endpoint, timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_stats_method ON stats(method);
            CREATE INDEX IF NOT EXISTS idx_stats_status_code ON stats(status_code);
        `);

        // 11. Create newsletter_subscribers table
        await client.query(`
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                is_active BOOLEAN DEFAULT true,
                subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                unsubscribed_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
        `);

        // 12. Create news_subscribers table
        await client.query(`
            CREATE TABLE IF NOT EXISTS news_subscribers (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_news_subscribers_email ON news_subscribers(email);
        `);

        // 13. Create default admin user
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        await client.query(`
            INSERT INTO users (
                first_name, last_name, email, password, phone, gender,
                role_id, user_type, is_active
            )
            SELECT 
                'Admin', 'User', 'admin@housemate.com', $1, '1234567890', 'other',
                r.id, 'admin', true
            FROM roles r
            WHERE r.name = 'admin'
            ON CONFLICT (email) DO NOTHING;
        `, [hashedPassword]);

        await client.query('COMMIT');
        console.log('Database initialized successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Run the initialization
initializeDatabase().catch(console.error);