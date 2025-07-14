import pool from "../config/postgres.js";

async function fixRoomAvailabilityRequests() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("Fixing room availability requests with incorrect status...");

    // Update all requests that don't have 'pending', 'accepted', or 'rejected' status
    const { rows: updatedRows } = await client.query(`
      UPDATE room_availability_requests 
      SET status = 'pending', updated_at = CURRENT_TIMESTAMP 
      WHERE status NOT IN ('pending', 'accepted', 'rejected')
      RETURNING id, room_id, property_id, owner_id, status;
    `);

    console.log(`Updated ${updatedRows.length} requests to 'pending' status:`);
    updatedRows.forEach((row) => {
      console.log(
        `- Request ID: ${row.id}, Room: ${row.room_id}, Property: ${row.property_id}, Owner: ${row.owner_id}`
      );
    });

    // Show all current requests
    const { rows: allRequests } = await client.query(`
      SELECT id, room_id, property_id, owner_id, status, created_at 
      FROM room_availability_requests 
      ORDER BY created_at DESC;
    `);

    console.log("\nAll room availability requests:");
    allRequests.forEach((row) => {
      console.log(
        `- ID: ${row.id}, Room: ${row.room_id}, Property: ${row.property_id}, Status: ${row.status}, Created: ${row.created_at}`
      );
    });

    await client.query("COMMIT");
    console.log("\n✅ Room availability requests fixed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error fixing room availability requests:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
fixRoomAvailabilityRequests().catch(console.error);
