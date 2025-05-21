import pool from '../config/postgres.js';

export const initializeRoles = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create roles table if it doesn't exist
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

        // Insert default roles if they don't exist
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

        await client.query('COMMIT');
        console.log('Roles table created and initialized successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error initializing roles:', error);
        throw error;
    } finally {
        client.release();
    }
};
