import pool from '../config/postgres.js';

const createFormTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS forms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                message TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (error) {
        console.error('Error creating forms table:', error);
        throw error;
    }
};

createFormTable();

export async function createForm(data) {
    const { name, email, message } = data;
    const result = await pool.query(
        'INSERT INTO forms (name, email, message) VALUES ($1, $2, $3) RETURNING *',
        [name, email, message]
    );
    return result.rows[0];
}

export default {
    async create(formData) {
        const { name, email, phone, message } = formData;
        const { rows } = await pool.query(
            `INSERT INTO forms (name, email, phone, message)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [name, email, phone, message]
        );
        return rows[0];
    },

    async findById(id) {
        const { rows } = await pool.query(
            'SELECT * FROM forms WHERE id = $1',
            [id]
        );
        return rows[0];
    },

    async findAll() {
        const { rows } = await pool.query(
            'SELECT * FROM forms ORDER BY created_at DESC'
        );
        return rows;
    },

    async delete(id) {
        const { rows } = await pool.query(
            'DELETE FROM forms WHERE id = $1 RETURNING *',
            [id]
        );
        return rows[0];
    }
};