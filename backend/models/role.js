import pool from '../config/postgres.js';

const createRolesTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (error) {
        console.error('Error creating roles table:', error);
        throw error;
    }
};

createRolesTable();

export default {
    async findOne(filter) {
        const { rows } = await pool.query(
            'SELECT * FROM roles WHERE name = $1',
            [filter.name]
        );
        return rows[0];
    },

    async bulkWrite(operations) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            for (const op of operations) {
                const { name, description, isActive } = op.updateOne.update.$set;
                await client.query(
                    `INSERT INTO roles (name, description, is_active)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (name) 
                     DO UPDATE SET 
                        description = $2,
                        is_active = $3,
                        updated_at = CURRENT_TIMESTAMP`,
                    [name, description, isActive]
                );
            }
            
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};
