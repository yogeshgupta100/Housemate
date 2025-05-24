import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pool from '../config/postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const propertyTypes = ['PG', 'flat', 'RK', 'house', 'apartment', 'villa'];
const listingTypes = ['sale', 'rent'];
const furnishingTypes = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
const propertyConditions = ['new', 'good', 'average', 'needs_repair'];
const propertyStatuses = ['ready_to_move', 'under_construction', 'renovated'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];
const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal'];

const createPropertiesTable = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS properties (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                subtitle TEXT,
                slug VARCHAR(255) UNIQUE,
                listing_type VARCHAR(20) CHECK (listing_type IN ('sale', 'rent')),
                type VARCHAR(50) NOT NULL,
                price DECIMAL(12,2) NOT NULL,
                rent_type VARCHAR(20),
                deposit DECIMAL(12,2),
                property_age INTEGER,
                property_condition VARCHAR(50),
                property_status VARCHAR(50),
                location TEXT,
                region VARCHAR(100),
                latitude DECIMAL(10,8),
                longitude DECIMAL(11,8),
                street VARCHAR(255),
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(10),
                country VARCHAR(100),
                floor_area INTEGER,
                sqft INTEGER,
                floor_no INTEGER,
                total_floors INTEGER,
                beds INTEGER,
                baths INTEGER,
                furnishing VARCHAR(50),
                amenities TEXT[],
                balcony BOOLEAN,
                central_ac BOOLEAN,
                power_backup BOOLEAN,
                lift BOOLEAN,
                fire_safety BOOLEAN,
                security_room BOOLEAN,
                pantry BOOLEAN,
                reception_area BOOLEAN,
                office_cabins INTEGER,
                conference_rooms INTEGER,
                open_workstations INTEGER,
                showroom_area INTEGER,
                storage_area INTEGER,
                car_parking_available BOOLEAN,
                car_parking_count INTEGER,
                bike_parking_available BOOLEAN,
                bike_parking_count INTEGER,
                images TEXT[],
                image_url TEXT,
                description TEXT,
                contact_phone VARCHAR(20),
                contact_email VARCHAR(255),
                owner_id INTEGER REFERENCES users(id),
                created_by INTEGER REFERENCES users(id),
                available_from TIMESTAMP WITH TIME ZONE,
                min_lease_period VARCHAR(50),
                status VARCHAR(20) DEFAULT 'active',
                tag VARCHAR(100),
                is_verified BOOLEAN DEFAULT false,
                is_featured BOOLEAN DEFAULT false,
                views INTEGER DEFAULT 0,
                minimum_lease INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        await client.query('COMMIT');
        console.log('Properties table created successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating properties table:', error);
        throw error;
    } finally {
        client.release();
    }
};

const generateRandomProperty = async () => {
    // First, get a random user to set as owner and creator
    const { rows: users } = await pool.query(
        "SELECT id, phone, email FROM users WHERE user_type IN ('individual', 'corporate')"
    );
    
    if (users.length === 0) {
        throw new Error('No users found to set as property owners. Please seed users first.');
    }
    
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const listingType = listingTypes[Math.floor(Math.random() * listingTypes.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    
    const title = `${type.charAt(0).toUpperCase() + type.slice(1)} for ${listingType} in ${city}`;
    const price = Math.floor(Math.random() * 10000000) + 1000000; // Between 10L and 1Cr
    const sqft = Math.floor(Math.random() * 5000) + 500; // Between 500 and 5500 sqft
    
    const amenities = [
        'Parking',
        'Security',
        'Power Backup',
        'Lift',
        'Gym',
        'Swimming Pool',
        'Club House'
    ].slice(0, Math.floor(Math.random() * 7) + 1);
    
    return {
        title,
        subtitle: `Beautiful ${type} in prime location`,
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        listing_type: listingType,
        type,
        price,
        rent_type: listingType === 'rent' ? 'monthly' : null,
        deposit: listingType === 'rent' ? Math.floor(price * 0.1) : null,
        property_age: Math.floor(Math.random() * 20),
        property_condition: propertyConditions[Math.floor(Math.random() * propertyConditions.length)],
        property_status: propertyStatuses[Math.floor(Math.random() * propertyStatuses.length)],
        location: `${city}, ${state}`,
        region: state,
        latitude: 12.9716 + (Math.random() - 0.5) * 10,
        longitude: 77.5946 + (Math.random() - 0.5) * 10,
        street: `${Math.floor(Math.random() * 100) + 1} Main Street`,
        city,
        state,
        pincode: Math.floor(100000 + Math.random() * 900000).toString(),
        country: 'India',
        floor_area: sqft,
        sqft,
        floor_no: Math.floor(Math.random() * 20),
        total_floors: Math.floor(Math.random() * 30) + 5,
        beds: Math.floor(Math.random() * 5) + 1,
        baths: Math.floor(Math.random() * 4) + 1,
        furnishing: furnishingTypes[Math.floor(Math.random() * furnishingTypes.length)],
        amenities,
        balcony: Math.random() > 0.5,
        central_ac: Math.random() > 0.5,
        power_backup: Math.random() > 0.5,
        lift: Math.random() > 0.5,
        fire_safety: Math.random() > 0.5,
        security_room: Math.random() > 0.5,
        pantry: Math.random() > 0.5,
        reception_area: Math.random() > 0.5,
        office_cabins: Math.floor(Math.random() * 10),
        conference_rooms: Math.floor(Math.random() * 5),
        open_workstations: Math.floor(Math.random() * 20),
        showroom_area: Math.floor(Math.random() * 1000),
        storage_area: Math.floor(Math.random() * 500),
        car_parking_available: Math.random() > 0.3,
        car_parking_count: Math.floor(Math.random() * 3) + 1,
        bike_parking_available: Math.random() > 0.3,
        bike_parking_count: Math.floor(Math.random() * 5) + 1,
        images: [
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
            'https://images.unsplash.com/photo-1560449017-7c4a30d9829b',
            'https://images.unsplash.com/photo-1560448204-5f9c0c3f5c0c'
        ],
        image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
        description: `This beautiful ${type} is located in the heart of ${city}. It offers ${sqft} sqft of living space with ${beds} bedrooms and ${baths} bathrooms. The property is ${propertyConditions.join(' ')} and ${propertyStatuses.join(' ')}. It comes with various amenities including ${amenities.slice(0, 3).join(', ')}.`,
        contact_phone: randomUser.phone,
        contact_email: randomUser.email,
        owner_id: randomUser.id,
        created_by: randomUser.id,
        available_from: listingType === 'rent' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
        min_lease_period: listingType === 'rent' ? '12 months' : null,
        status: 'active',
        tag: `${type}-${listingType}`,
        is_verified: Math.random() > 0.3,
        is_featured: Math.random() > 0.7,
        views: Math.floor(Math.random() * 1000),
        minimum_lease: listingType === 'rent' ? 12 : null
    };
};

const seedProperties = async (count = 20) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Create properties table if it doesn't exist
        await createPropertiesTable();
        
        // Clear existing properties
        await client.query('TRUNCATE TABLE properties CASCADE');
        console.log('Cleared existing properties');
        
        // Generate and insert new properties
        for (let i = 0; i < count; i++) {
            const property = await generateRandomProperty();
            const columns = Object.keys(property).join(', ');
            const values = Object.values(property);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
            
            await client.query(
                `INSERT INTO properties (${columns}) VALUES (${placeholders})`,
                values
            );
        }
        
        await client.query('COMMIT');
        console.log(`Successfully seeded ${count} properties`);
        
        return { success: true, message: `Successfully seeded ${count} properties` };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error seeding properties:', error);
        return { success: false, message: error.message };
    } finally {
        client.release();
    }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const count = parseInt(process.argv[2]) || 20;
    seedProperties(count)
        .then(result => {
            console.log(result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}

export default seedProperties; 