import pool from '../config/postgres.js';

const createNewsTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS news_subscribers (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Create index for email lookups
            CREATE INDEX IF NOT EXISTS idx_news_subscribers_email ON news_subscribers(email);
        `);
    } catch (error) {
        console.error('Error creating news_subscribers table:', error);
        throw error;
    }
};

// Create the table if it doesn't exist
createNewsTable();

export default {
    async create(subscriberData) {
        const { rows } = await pool.query(
            'INSERT INTO news_subscribers (email) VALUES ($1) RETURNING *',
            [subscriberData.email]
        );
        return rows[0];
    },

    async findByEmail(email) {
        const { rows } = await pool.query(
            'SELECT * FROM news_subscribers WHERE email = $1',
            [email]
        );
        return rows[0];
    },

    async findAll() {
        const { rows } = await pool.query(
            'SELECT * FROM news_subscribers ORDER BY created_at DESC'
        );
        return rows;
    },

    async delete(email) {
        const { rows } = await pool.query(
            'DELETE FROM news_subscribers WHERE email = $1 RETURNING *',
            [email]
        );
        return rows[0];
    }
};