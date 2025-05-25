import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || 'yogesh',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'housemate',
  password: process.env.DB_PASSWORD || 'yogesh@yogesh@123',
  port: process.env.DB_PORT || 5432,
});

pool.connect()
  .then(() => console.log('✅ PostgreSQL Connected'))
  .catch(err => {
    console.error('❌ PostgreSQL Connection Error:', err.message);
    process.exit(1);
  });

export default pool;
