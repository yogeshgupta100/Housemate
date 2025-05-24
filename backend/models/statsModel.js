import pool from '../config/postgres.js';

const createStatsTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stats (
                id SERIAL PRIMARY KEY,
                endpoint VARCHAR(255) NOT NULL,
                method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD')),
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                response_time INTEGER NOT NULL,
                status_code INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_stats_endpoint_timestamp ON stats(endpoint, timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_stats_method ON stats(method);
            CREATE INDEX IF NOT EXISTS idx_stats_status_code ON stats(status_code);
        `);
    } catch (error) {
        console.error('Error creating stats table:', error);
        throw error;
    }
};

createStatsTable();

export default {
    async create(statsData) {
        const { endpoint, method, responseTime, statusCode } = statsData;
        const { rows } = await pool.query(
            `INSERT INTO stats (endpoint, method, response_time, status_code)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [endpoint, method, responseTime, statusCode]
        );
        return rows[0];
    },

    async find(query = {}) {
        let sql = 'SELECT * FROM stats';
        const values = [];
        const conditions = [];

        if (query.endpoint) {
            conditions.push(`endpoint = $${values.length + 1}`);
            values.push(query.endpoint);
        }
        if (query.method) {
            conditions.push(`method = $${values.length + 1}`);
            values.push(query.method);
        }
        if (query.statusCode) {
            conditions.push(`status_code = $${values.length + 1}`);
            values.push(query.statusCode);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY timestamp DESC';

        if (query.limit) {
            sql += ` LIMIT $${values.length + 1}`;
            values.push(query.limit);
        }

        const { rows } = await pool.query(sql, values);
        return rows;
    }
};