import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pool from '../config/postgres.js';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Lisa', 'William', 'Mary'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];
const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal'];
const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'];
const userTypes = ['individual', 'corporate', 'dealer'];
const genders = ['male', 'female', 'other', 'prefer_not_to_say'];
const maritalStatuses = ['Bachelor', 'Married', 'Divorced', 'Widowed'];

const generatePhoneNumber = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

const generateEmail = (firstName, lastName) => {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@${domain}`;
};

const generateDateOfBirth = () => {
    const today = new Date();
    const minAge = 18;
    const maxAge = 70;
    const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
    return new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
};

const generateRandomUser = async () => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const userType = userTypes[Math.floor(Math.random() * userTypes.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    
    // Hash the default password
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    const user = {
        first_name: firstName,
        last_name: lastName,
        email: generateEmail(firstName, lastName),
        password: hashedPassword,
        phone: generatePhoneNumber(),
        gender: genders[Math.floor(Math.random() * genders.length)],
        role_id: Math.random() > 0.9 ? 1 : 2, // Assuming 1 is admin, 2 is user
        user_type: userType,
        city,
        state,
        bio: `Hi, I'm ${firstName} ${lastName}. I'm looking for a place to stay.`,
        profile_image: 'default-profile.jpg',
        is_active: true
    };

    // Add corporate-specific fields
    if (userType === 'corporate') {
        user.company_name = `${firstName} ${lastName} Enterprises`;
        user.registration_number = `REG${Math.floor(10000000 + Math.random() * 90000000)}`;
    }

    // Add dealer-specific fields
    if (userType === 'dealer') {
        user.dealer_license = `DL${Math.floor(10000000 + Math.random() * 90000000)}`;
    }

    return user;
};

const createRolesTable = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Insert default roles if they don't exist
        await client.query(`
            INSERT INTO roles (name, description)
            VALUES 
                ('admin', 'Administrator with full access'),
                ('user', 'Regular user with limited access')
            ON CONFLICT (name) DO NOTHING;
        `);
        
        await client.query('COMMIT');
        console.log('Roles table created and populated successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating roles table:', error);
        throw error;
    } finally {
        client.release();
    }
};

const seedUsers = async (count = 20) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Create roles table and insert default roles
        await createRolesTable();
        
        // Clear existing users
        await client.query('TRUNCATE TABLE users CASCADE');
        console.log('Cleared existing users');
        
        // Generate and insert new users
        for (let i = 0; i < count; i++) {
            const user = await generateRandomUser();
            const columns = Object.keys(user).join(', ');
            const values = Object.values(user);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
            
            await client.query(
                `INSERT INTO users (${columns}) VALUES (${placeholders})`,
                values
            );
        }
        
        await client.query('COMMIT');
        console.log(`Successfully seeded ${count} users`);
        
        return { success: true, message: `Successfully seeded ${count} users` };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error seeding users:', error);
        return { success: false, message: error.message };
    } finally {
        client.release();
    }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const count = parseInt(process.argv[2]) || 20;
    seedUsers(count)
        .then(result => {
            console.log(result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}

export default seedUsers; 