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

const updateScenesTable = async () => {
  let client;
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Connected successfully');

    // Check if scenes table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'scenes'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('Creating scenes table...');
      await client.query(`
        CREATE TABLE scenes (
          id SERIAL PRIMARY KEY,
          name TEXT,
          image_url TEXT NOT NULL,
          room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
          property_id INT REFERENCES properties(id) ON DELETE CASCADE,
          scene_type VARCHAR(20) DEFAULT 'room' CHECK (scene_type IN ('room', 'property')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT check_reference CHECK (
            (room_id IS NOT NULL AND property_id IS NULL AND scene_type = 'room') OR
            (property_id IS NOT NULL AND room_id IS NULL AND scene_type = 'property')
          )
        );
      `);
    } else {
      console.log('Updating existing scenes table...');
      
      // Add new columns if they don't exist
      const columns = [
        { name: 'property_id', type: 'INT REFERENCES properties(id) ON DELETE CASCADE' },
        { name: 'scene_type', type: 'VARCHAR(20) DEFAULT \'room\' CHECK (scene_type IN (\'room\', \'property\'))' },
        { name: 'name', type: 'TEXT' },
        { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' }
      ];

      for (const column of columns) {
        const columnExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'scenes' AND column_name = '${column.name}'
          );
        `);

        if (!columnExists.rows[0].exists) {
          console.log(`Adding column: ${column.name}`);
          await client.query(`ALTER TABLE scenes ADD COLUMN ${column.name} ${column.type}`);
        }
      }

      // Add constraint if it doesn't exist
      const constraintExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.table_constraints 
          WHERE table_name = 'scenes' AND constraint_name = 'check_reference'
        );
      `);

      if (!constraintExists.rows[0].exists) {
        console.log('Adding reference constraint...');
        await client.query(`
          ALTER TABLE scenes ADD CONSTRAINT check_reference CHECK (
            (room_id IS NOT NULL AND property_id IS NULL AND scene_type = 'room') OR
            (property_id IS NOT NULL AND room_id IS NULL AND scene_type = 'property')
          )
        `);
      }
    }

    // Create indexes
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_scenes_property_id ON scenes(property_id);
      CREATE INDEX IF NOT EXISTS idx_scenes_scene_type ON scenes(scene_type);
      CREATE INDEX IF NOT EXISTS idx_scenes_room_id ON scenes(room_id);
    `);

    // Verify the updated structure
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'scenes'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nUpdated scenes table structure:');
    console.table(structure.rows);

    console.log('\n✅ Scenes table updated successfully');
  } catch (error) {
    console.error('❌ Error updating scenes table:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
};

updateScenesTable(); 