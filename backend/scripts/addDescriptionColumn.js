import pool from '../config/postgres.js';

const addDescriptionColumn = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Add description column if it doesn't exist
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'properties' 
                    AND column_name = 'description'
                ) THEN
                    ALTER TABLE properties ADD COLUMN description TEXT;
                END IF;
            END $$;
        `);

        await client.query('COMMIT');
        console.log('Successfully added description column to properties table');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding description column:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Run the migration
addDescriptionColumn().catch(console.error); 