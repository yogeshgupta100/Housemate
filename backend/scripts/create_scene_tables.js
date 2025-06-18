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
  let client;
  try {
    console.log('Attempting to connect to database with config:', {
      user: process.env.DB_USER || 'yogesh',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'housemate',
      port: process.env.DB_PORT || 5432,
    });
    
    client = await pool.connect();
    console.log('Connected successfully');

    // Test the connection
    const testResult = await client.query('SELECT NOW()');
    console.log('Database connection test:', testResult.rows[0]);

    // Create scenes table
    console.log('Creating scenes table...');
    await client.query(`
      DROP TABLE IF EXISTS hotspots;
      DROP TABLE IF EXISTS scenes;
      
      CREATE TABLE scenes (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE,
        image_url TEXT
      );
    `);
    console.log('Scenes table created');

    // Create hotspots table
    console.log('Creating hotspots table...');
    await client.query(`
      CREATE TABLE hotspots (
        id SERIAL PRIMARY KEY,
        scene_id INT REFERENCES scenes(id) ON DELETE CASCADE,
        yaw FLOAT,
        pitch FLOAT,
        target TEXT
      );
    `);
    console.log('Hotspots table created');

    // Verify tables
    const scenesResult = await client.query('SELECT * FROM scenes');
    const hotspotsResult = await client.query('SELECT * FROM hotspots');
    
    console.log('\nVerification:');
    console.log('Scenes table:', scenesResult.rows);
    console.log('Hotspots table:', hotspotsResult.rows);

    console.log('\n✅ Tables created successfully');
  } catch (error) {
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack
    });
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    process.exit(0);
  }
};

createTables().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}); 