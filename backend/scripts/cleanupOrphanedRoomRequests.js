import pool from '../config/postgres.js';

async function cleanupOrphanedRoomRequests() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Cleaning up orphaned room_availability_requests records...');

    // Delete records where room_id doesn't exist
    const { rows: orphanedRoomRecords } = await client.query(`
      DELETE FROM room_availability_requests 
      WHERE room_id NOT IN (SELECT id FROM rooms)
      RETURNING id, room_id, property_id, owner_id;
    `);

    console.log(`Deleted ${orphanedRoomRecords.length} records with non-existent room_id`);

    // Delete records where property_id doesn't exist
    const { rows: orphanedPropertyRecords } = await client.query(`
      DELETE FROM room_availability_requests 
      WHERE property_id NOT IN (SELECT id FROM properties)
      RETURNING id, room_id, property_id, owner_id;
    `);

    console.log(`Deleted ${orphanedPropertyRecords.length} records with non-existent property_id`);

    // Delete records where owner_id doesn't exist
    const { rows: orphanedOwnerRecords } = await client.query(`
      DELETE FROM room_availability_requests 
      WHERE owner_id NOT IN (SELECT id FROM users)
      RETURNING id, room_id, property_id, owner_id;
    `);

    console.log(`Deleted ${orphanedOwnerRecords.length} records with non-existent owner_id`);

    await client.query('COMMIT');
    console.log('Cleanup completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the cleanup
cleanupOrphanedRoomRequests().catch(console.error); 