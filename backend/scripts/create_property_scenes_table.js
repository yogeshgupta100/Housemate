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

const createTables = async () => {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected successfully');

    // Drop tables in correct order (due to foreign key dependencies)
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS hotspots CASCADE;
      DROP TABLE IF EXISTS scenes CASCADE;
    `);
    console.log('Tables dropped successfully');

    // Create scenes table
    console.log('Creating scenes table...');
    await client.query(`
      CREATE TABLE scenes (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Scenes table created');

    // Create hotspots table
    console.log('Creating hotspots table...');
    await client.query(`
      CREATE TABLE hotspots (
        id SERIAL PRIMARY KEY,
        scene_id INT REFERENCES scenes(id) ON DELETE CASCADE,
        yaw FLOAT NOT NULL,
        pitch FLOAT NOT NULL,
        target TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Hotspots table created');

    // Verify tables
    const scenesResult = await client.query('SELECT * FROM scenes');
    const hotspotsResult = await client.query('SELECT * FROM hotspots');
    
    console.log('\nVerification:');
    console.log('Scenes table:', scenesResult.rows);
    console.log('Hotspots table:', hotspotsResult.rows);

    client.release();
    console.log('\n✅ Tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTables();