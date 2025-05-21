import pool from '../config/postgres.js';

class FavoritesService {
    async getFavorites(userId) {
        const client = await pool.connect();
        try {
            const { rows: [user] } = await client.query(
                'SELECT favorites FROM users WHERE id = $1',
                [userId]
            );

            if (!user) {
                throw new Error('User not found');
            }

            return user.favorites || [];
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

            if (!property) {
                throw new Error('Property not found');
            }

            // Get current favorites
            const { rows: [user] } = await client.query(
                'SELECT favorites FROM users WHERE id = $1',
                [userId]
            );

            if (!user) {
                throw new Error('User not found');
            }

            // Add property to favorites if not already present
            const favorites = user.favorites || [];
            if (!favorites.includes(propertyId)) {
                favorites.push(propertyId);
                await client.query(
                    'UPDATE users SET favorites = $1 WHERE id = $2',
                    [favorites, userId]
                );
            }

            return favorites;
        } finally {
            client.release();
        }
    }

    async removeFavorite(userId, propertyId) {
        const client = await pool.connect();
        try {
            // Get current favorites
            const { rows: [user] } = await client.query(
                'SELECT favorites FROM users WHERE id = $1',
                [userId]
            );

            if (!user) {
                throw new Error('User not found');
            }

            // Remove property from favorites
            const favorites = (user.favorites || []).filter(id => id !== propertyId);
            await client.query(
                'UPDATE users SET favorites = $1 WHERE id = $2',
                [favorites, userId]
            );

            return favorites;
        } finally {
            client.release();
        }
    }

    async isPropertyFavorited(userId, propertyId) {
        const client = await pool.connect();
        try {
            const { rows: [user] } = await client.query(
                'SELECT favorites FROM users WHERE id = $1',
                [userId]
            );

            if (!user) {
                throw new Error('User not found');
            }

            return (user.favorites || []).includes(propertyId);
        } finally {
            client.release();
        }
    }
}

export default new FavoritesService();
