import pool from '../config/postgres.js';

async function createRoomAvailabilityRequestsTable() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create room_availability_requests table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS room_availability_requests (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes if they don't exist
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_room_availability_requests_room_id ON room_availability_requests(room_id);
      CREATE INDEX IF NOT EXISTS idx_room_availability_requests_property_id ON room_availability_requests(property_id);
      CREATE INDEX IF NOT EXISTS idx_room_availability_requests_owner_id ON room_availability_requests(owner_id);
      CREATE INDEX IF NOT EXISTS idx_room_availability_requests_status ON room_availability_requests(status);
    `);

    await client.query('COMMIT');
    console.log('room_availability_requests table created successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating room_availability_requests table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
createRoomAvailabilityRequestsTable().catch(console.error); 