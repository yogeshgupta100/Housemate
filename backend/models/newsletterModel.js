import pool from '../config/postgres.js';

const createNewsletterTable = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create newsletter_subscribers table
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

        await client.query('COMMIT');
        console.log('Newsletter subscribers table created successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating newsletter subscribers table:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Create the table if it doesn't exist
createNewsletterTable();

export default {
    async subscribe(email) {
        const { rows } = await pool.query(
            `INSERT INTO newsletter_subscribers (email)
             VALUES ($1)
             ON CONFLICT (email) 
             DO UPDATE SET 
                is_active = true,
                unsubscribed_at = NULL,
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [email]
        );
        return rows[0];
    },

    async unsubscribe(email) {
        const { rows } = await pool.query(
            `UPDATE newsletter_subscribers 
             SET is_active = false,
                 unsubscribed_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE email = $1
             RETURNING *`,
            [email]
        );
        return rows[0];
    },

    async getAllSubscribers(filters = {}) {
        let query = `
            SELECT * FROM newsletter_subscribers
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;

        if (filters.isActive !== undefined) {
            query += ` AND is_active = $${paramCount}`;
            values.push(filters.isActive);
            paramCount++;
        }

        if (filters.search) {
            query += ` AND email ILIKE $${paramCount}`;
            values.push(`%${filters.search}%`);
            paramCount++;
        }

        query += ` ORDER BY subscribed_at DESC`;

        if (filters.limit) {
            query += ` LIMIT $${paramCount}`;
            values.push(filters.limit);
            paramCount++;
        }

        if (filters.offset) {
            query += ` OFFSET $${paramCount}`;
            values.push(filters.offset);
        }

        const { rows } = await pool.query(query, values);
        return rows;
    },

    async getSubscriberByEmail(email) {
        const { rows } = await pool.query(
            `SELECT * FROM newsletter_subscribers WHERE email = $1`,
            [email]
        );
        return rows[0];
    },

    async getActiveSubscribers() {
        const { rows } = await pool.query(
            `SELECT * FROM newsletter_subscribers 
             WHERE is_active = true 
             ORDER BY subscribed_at DESC`
        );
        return rows;
    },

    async getSubscriberStats() {
        const { rows: [{ total }] } = await pool.query(
            `SELECT COUNT(*) as total FROM newsletter_subscribers`
        );

        const { rows: [{ active }] } = await pool.query(
            `SELECT COUNT(*) as active 
             FROM newsletter_subscribers 
             WHERE is_active = true`
        );

        const { rows: [{ today }] } = await pool.query(
            `SELECT COUNT(*) as today 
             FROM newsletter_subscribers 
             WHERE DATE(subscribed_at) = CURRENT_DATE`
        );

        return {
            total: parseInt(total),
            active: parseInt(active),
            today: parseInt(today)
        };
    },

    async deleteSubscriber(email) {
        const { rows } = await pool.query(
            `DELETE FROM newsletter_subscribers 
             WHERE email = $1 
             RETURNING *`,
            [email]
        );
        return rows[0];
    }
}; 