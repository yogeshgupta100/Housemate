import pool from '../config/postgres.js';

class FavoritesService {
    async getFavorites(userId) {
        const client = await pool.connect();
        try {
            const { rows } = await client.query(
                `SELECT p.*
                 FROM favorites f
                 JOIN properties p ON f.property_id = p.id
                 WHERE f.user_id = $1`,
                [userId]
            );
            return rows;
        } finally {
            client.release();
        }
    }

    async getUserFavorites(userId) {
        const client = await pool.connect();
        try {
            const { rows } = await client.query(
                'SELECT * FROM favorites WHERE user_id = $1',
                [userId]
            );
            return rows;
        } finally {
            client.release();
        }
    }
    

    async addFavorite(userId, propertyId) {
        const client = await pool.connect();
        try {
            // Check if property exists
            const { rows: [property] } = await client.query(
                'SELECT id FROM properties WHERE id = $1',
                [propertyId]
            );
            if (!property) throw new Error('Property not found');

            // Insert into favorites, ignore if already exists
            await client.query(
                `INSERT INTO favorites (user_id, property_id)
                 VALUES ($1, $2)
                 ON CONFLICT (user_id, property_id) DO NOTHING`,
                [userId, propertyId]
            );

            // Return updated favorites
            return this.getFavorites(userId);
        } finally {
            client.release();
        }
    }

    async removeFavorite(userId, propertyId) {
        const client = await pool.connect();
        try {
            await client.query(
                'DELETE FROM favorites WHERE user_id = $1 AND property_id = $2',
                [userId, propertyId]
            );
            return this.getFavorites(userId);
        } finally {
            client.release();
        }
    }

    async isPropertyFavorited(userId, propertyId) {
        const client = await pool.connect();
        try {
            const { rows } = await client.query(
                'SELECT 1 FROM favorites WHERE user_id = $1 AND property_id = $2',
                [userId, propertyId]
            );
            return rows.length > 0;
        } finally {
            client.release();
        }
    }
}

export default new FavoritesService();
