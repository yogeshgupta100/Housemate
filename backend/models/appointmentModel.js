import pool from '../config/postgres.js';

const createAppointmentTable = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // First create the table
        await client.query(`
            DROP TABLE IF EXISTS appointments CASCADE;
            
            CREATE TABLE appointments (
                id SERIAL PRIMARY KEY,
                property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                preferred_date DATE NOT NULL,
                preferred_time TIME NOT NULL,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                feedback TEXT,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                CONSTRAINT valid_appointment_time CHECK (preferred_time >= '09:00' AND preferred_time <= '17:00')
            )
        `);

        // Then create indexes separately
        await client.query(`
            CREATE INDEX idx_appointments_property_id ON appointments(property_id);
            CREATE INDEX idx_appointments_user_id ON appointments(user_id);
            CREATE INDEX idx_appointments_status ON appointments(status);
            CREATE INDEX idx_appointments_date ON appointments(preferred_date);
        `);

        await client.query('COMMIT');
        console.log('Appointments table and indexes created successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating appointments table:', error);
        throw error;
    } finally {
        client.release();
    }
};

createAppointmentTable().catch(error => {
    console.error('Failed to initialize appointments table:', error);
    process.exit(1);
});

const appointmentModel = {
    async create(appointmentData) {
        const { property_id, user_id, preferred_date, preferred_time, notes } = appointmentData;
        const query = `
            INSERT INTO appointments (property_id, user_id, preferred_date, preferred_time, notes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [property_id, user_id, preferred_date, preferred_time, notes];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async findById(id) {
        const query = `
            SELECT a.*, 
                   p.title as property_title, p.location as property_location,
                   u.first_name as user_first_name, u.last_name as user_last_name, u.email as user_email
            FROM appointments a
            LEFT JOIN properties p ON a.property_id = p.id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    async findAll(filters = {}) {
        let query = `
            SELECT a.*, 
                   p.title as property_title, p.location as property_location,
                   u.first_name as user_first_name, u.last_name as user_last_name, u.email as user_email
            FROM appointments a
            LEFT JOIN properties p ON a.property_id = p.id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;

        if (filters.property_id) {
            query += ` AND a.property_id = $${paramCount}`;
            values.push(filters.property_id);
            paramCount++;
        }

        if (filters.user_id) {
            query += ` AND a.user_id = $${paramCount}`;
            values.push(filters.user_id);
            paramCount++;
        }

        if (filters.status) {
            query += ` AND a.status = $${paramCount}`;
            values.push(filters.status);
            paramCount++;
        }

        if (filters.start_date) {
            query += ` AND a.preferred_date >= $${paramCount}`;
            values.push(filters.start_date);
            paramCount++;
        }

        if (filters.end_date) {
            query += ` AND a.preferred_date <= $${paramCount}`;
            values.push(filters.end_date);
            paramCount++;
        }

        query += ` ORDER BY a.preferred_date DESC, a.preferred_time ASC`;

        const result = await pool.query(query, values);
        return result.rows;
    },

    async update(id, updateData) {
        const allowedFields = ['status', 'notes', 'feedback', 'rating'];
        const updates = [];
        const values = [id];
        let paramCount = 2;

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (updates.length === 0) {
            return null;
        }

        const query = `
            UPDATE appointments 
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async delete(id) {
        const query = 'DELETE FROM appointments WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    async getStats() {
        const query = `
            SELECT 
                COUNT(*) as total_appointments,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_appointments,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_appointments,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
                AVG(CASE WHEN rating IS NOT NULL THEN rating END) as average_rating
            FROM appointments
        `;
        const result = await pool.query(query);
        return result.rows[0];
    }
};

export default appointmentModel;