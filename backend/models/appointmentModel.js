import pool from '../config/postgres.js';

const createAppointmentTable = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // First check if properties table exists
        const { rows: tableCheck } = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'properties'
            );
        `);

        if (!tableCheck[0].exists) {
            console.log('Waiting for properties table to be created...');
            await client.query('COMMIT');
            return;
        }

        // Create appointments table
        await client.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id SERIAL PRIMARY KEY,
                property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                time TIME NOT NULL,
                status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')) DEFAULT 'pending',
                meeting_link VARCHAR(255),
                meeting_platform VARCHAR(20) CHECK (meeting_platform IN ('zoom', 'google-meet', 'teams', 'other')) DEFAULT 'other',
                notes TEXT,
                cancel_reason TEXT,
                reminder_sent BOOLEAN DEFAULT false,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                feedback_comment TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, date DESC);
            CREATE INDEX IF NOT EXISTS idx_appointments_property_date ON appointments(property_id, date DESC);
            CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
        `);

        await client.query('COMMIT');
        console.log('Appointments table created successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating appointments table:', error);
        // Don't throw the error, just log it and let the application continue
        // This allows for retry on next startup if properties table isn't ready
    } finally {
        client.release();
    }
};

// Create the table if it doesn't exist
createAppointmentTable();

// Retry table creation every 5 seconds if it failed
setInterval(async () => {
    try {
        const { rows: tableCheck } = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'appointments'
            );
        `);
        
        if (!tableCheck[0].exists) {
            await createAppointmentTable();
        }
    } catch (error) {
        console.error('Error checking appointments table:', error);
    }
}, 5000);

export default {
    async create(appointmentData) {
        const { rows } = await pool.query(
            `INSERT INTO appointments (
                property_id, user_id, date, time, status,
                meeting_link, meeting_platform, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                appointmentData.propertyId,
                appointmentData.userId,
                appointmentData.date,
                appointmentData.time,
                appointmentData.status || 'pending',
                appointmentData.meetingLink,
                appointmentData.meetingPlatform || 'other',
                appointmentData.notes
            ]
        );
        return rows[0];
    },

    async findById(id) {
        const { rows } = await pool.query(
            `SELECT a.*, 
                    p.title as property_title, p.location as property_location,
                    u.first_name as user_first_name, u.last_name as user_last_name
             FROM appointments a
             LEFT JOIN properties p ON a.property_id = p.id
             LEFT JOIN users u ON a.user_id = u.id
             WHERE a.id = $1`,
            [id]
        );
        return rows[0];
    },

    async findByUserId(userId) {
        const { rows } = await pool.query(
            `SELECT a.*, 
                    p.title as property_title, p.location as property_location
             FROM appointments a
             LEFT JOIN properties p ON a.property_id = p.id
             WHERE a.user_id = $1
             ORDER BY a.date DESC, a.time DESC`,
            [userId]
        );
        return rows;
    },

    async findByPropertyId(propertyId) {
        const { rows } = await pool.query(
            `SELECT a.*, 
                    u.first_name as user_first_name, u.last_name as user_last_name
             FROM appointments a
             LEFT JOIN users u ON a.user_id = u.id
             WHERE a.property_id = $1
             ORDER BY a.date DESC, a.time DESC`,
            [propertyId]
        );
        return rows;
    },

    async update(id, updateData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const setClause = [];
            const values = [];
            let paramCount = 1;

            for (const [key, value] of Object.entries(updateData)) {
                if (value !== undefined) {
                    setClause.push(`${key} = $${paramCount}`);
                    values.push(value);
                    paramCount++;
                }
            }

            if (setClause.length === 0) return null;

            values.push(id);
            const { rows } = await client.query(
                `UPDATE appointments 
                 SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $${paramCount}
                 RETURNING *`,
                values
            );
            
            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async addFeedback(id, feedback) {
        const { rows } = await pool.query(
            `UPDATE appointments 
             SET rating = $1, feedback_comment = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [feedback.rating, feedback.comment, id]
        );
        return rows[0];
    }
};