import pool from '../config/postgres.js';

export const submitNewsletter = async (req, res) => {
    try {
        const { email } = req.body;
        console.log("email", email);
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if email already exists
        const { rows: existing } = await pool.query(
            'SELECT * FROM news_subscribers WHERE email = $1',
            [email]
        );
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already subscribed'
            });
        }

        // Create new newsletter subscription
        const { rows } = await pool.query(
            'INSERT INTO news_subscribers (email) VALUES ($1) RETURNING *',
            [email]
        );

        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to newsletter',
            data: rows[0]
        });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to subscribe to newsletter',
            error: error.message
        });
    }
}; 