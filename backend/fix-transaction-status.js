import pool from "./config/postgres.js";
import { config } from "dotenv";

config();

// Helper function to log results
const logResult = (testName, success, message = "") => {
  const status = success ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} ${testName}${message ? `: ${message}` : ""}`);
};

// Step 1: Update all pending transactions to active
const updatePendingTransactions = async () => {
  console.log("\n🔄 Updating Pending Transactions to Active...");
  try {
    const client = await pool.connect();

    // First, let's see what we're updating
    const pendingTransactions = await client.query(`
      SELECT t.id, t.user_id, t.property_id, t.room_id, t.status, t.created_at,
             p.title as property_title, u.first_name, u.last_name
      FROM transactions t
      JOIN properties p ON t.property_id = p.id
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'pending'
      ORDER BY t.created_at DESC
    `);

    console.log(
      `Found ${pendingTransactions.rows.length} pending transactions to update:`
    );
    pendingTransactions.rows.forEach((txn, index) => {
      console.log(
        `  ${index + 1}. ID: ${txn.id}, User: ${txn.first_name} ${
          txn.last_name
        }, Property: ${txn.property_title}, Created: ${txn.created_at}`
      );
    });

    if (pendingTransactions.rows.length === 0) {
      logResult(
        "Update Pending Transactions",
        true,
        "No pending transactions found"
      );
      client.release();
      return true;
    }

    // Update all pending transactions to active
    const updateResult = await client.query(`
      UPDATE transactions 
      SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'pending'
    `);

    logResult(
      "Update Pending Transactions",
      true,
      `${updateResult.rowCount} transactions updated to active`
    );

    // Update room occupancy for all active transactions
    const roomUpdateResult = await client.query(`
      UPDATE rooms r 
      SET occupied = (
        SELECT COUNT(*) 
        FROM transactions t 
        WHERE t.room_id = r.id AND t.status = 'active'
      ), updated_at = CURRENT_TIMESTAMP
      WHERE r.id IN (
        SELECT DISTINCT room_id 
        FROM transactions 
        WHERE status = 'active'
      )
    `);

    logResult(
      "Update Room Occupancy",
      true,
      `${roomUpdateResult.rowCount} rooms updated`
    );

    client.release();
    return true;
  } catch (error) {
    logResult("Update Pending Transactions", false, error.message);
    return false;
  }
};

// Step 2: Verify the updates
const verifyUpdates = async () => {
  console.log("\n🔍 Verifying Updates...");
  try {
    const client = await pool.connect();

    // Check transaction statuses
    const statusCount = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM transactions 
      GROUP BY status 
      ORDER BY count DESC
    `);

    console.log("  Transaction Status Distribution:");
    statusCount.rows.forEach((row) => {
      console.log(`    ${row.status}: ${row.count}`);
    });

    // Check active transactions
    const activeTransactions = await client.query(`
      SELECT t.id, t.user_id, t.property_id, t.room_id, t.status, t.created_at,
             p.title as property_title, u.first_name, u.last_name
      FROM transactions t
      JOIN properties p ON t.property_id = p.id
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'active'
      ORDER BY t.created_at DESC
    `);

    logResult(
      "Active Transactions",
      true,
      `${activeTransactions.rows.length} active transactions found`
    );

    if (activeTransactions.rows.length > 0) {
      console.log("  Active Transactions:");
      activeTransactions.rows.forEach((txn, index) => {
        console.log(
          `    ${index + 1}. ID: ${txn.id}, User: ${txn.first_name} ${
            txn.last_name
          }, Property: ${txn.property_title}, Created: ${txn.created_at}`
        );
      });
    }

    // Check room occupancy
    const roomOccupancy = await client.query(`
      SELECT r.id, r.room_number, r.capacity, r.occupied, f.floor_number, p.title as property_title
      FROM rooms r
      JOIN floors f ON r.floor_id = f.id
      JOIN properties p ON f.property_id = p.id
      WHERE r.occupied > 0
      ORDER BY r.occupied DESC
    `);

    logResult(
      "Room Occupancy",
      true,
      `${roomOccupancy.rows.length} rooms with occupancy found`
    );

    if (roomOccupancy.rows.length > 0) {
      console.log("  Room Occupancy:");
      roomOccupancy.rows.forEach((room, index) => {
        console.log(
          `    ${index + 1}. Room ${room.room_number} (Floor ${
            room.floor_number
          }): ${room.occupied}/${room.capacity} - ${room.property_title}`
        );
      });
    }

    client.release();
    return true;
  } catch (error) {
    logResult("Verify Updates", false, error.message);
    return false;
  }
};

// Step 3: Test the rented properties query
const testRentedPropertiesQuery = async () => {
  console.log("\n🏠 Testing Rented Properties Query...");
  try {
    const client = await pool.connect();

    // Find a user with active transactions
    const userWithActiveTransactions = await client.query(`
      SELECT DISTINCT t.user_id, u.first_name, u.last_name, u.email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'active'
      LIMIT 1
    `);

    if (userWithActiveTransactions.rows.length === 0) {
      logResult(
        "User with Active Transactions",
        false,
        "No users with active transactions found"
      );
      client.release();
      return false;
    }

    const testUser = userWithActiveTransactions.rows[0];
    logResult(
      "User with Active Transactions",
      true,
      `User ID: ${testUser.user_id}, Name: ${testUser.first_name} ${testUser.last_name}`
    );

    // Run the exact query from getUserRentedProperties
    const rentedPropertiesQuery = `
      SELECT 
        t.id as transaction_id,
        t.move_in_date,
        t.status as transaction_status,
        t.rent_amount,
        t.deposit_amount,
        t.created_at as rented_at,
        p.id as property_id,
        p.title as property_title,
        p.images as property_images,
        p.location as property_location,
        p.city as property_city,
        p.state as property_state,
        p.type as property_type,
        p.price as property_price,
        f.floor_number,
        r.id as room_id,
        r.room_number,
        r.capacity,
        r.rent_amount as room_rent,
        r.description as room_description,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.email as owner_email,
        u.phone as owner_phone
       FROM transactions t
       JOIN properties p ON t.property_id = p.id
       JOIN floors f ON t.floor_id = f.id
       JOIN rooms r ON t.room_id = r.id
       JOIN users u ON p.user_id = u.id
       WHERE t.user_id = $1 AND t.status = 'active'
       ORDER BY t.created_at DESC
    `;

    const rentedProperties = await client.query(rentedPropertiesQuery, [
      testUser.user_id,
    ]);

    logResult(
      "Rented Properties Query",
      true,
      `${rentedProperties.rows.length} active rented properties found for user ${testUser.user_id}`
    );

    if (rentedProperties.rows.length > 0) {
      console.log("  Rented Properties Found:");
      rentedProperties.rows.forEach((property, index) => {
        console.log(
          `    ${index + 1}. Transaction: ${property.transaction_id}`
        );
        console.log(`       Property: ${property.property_title}`);
        console.log(
          `       Location: ${property.property_location}, ${property.property_city}`
        );
        console.log(
          `       Room: ${property.room_number} (Floor ${property.floor_number})`
        );
        console.log(
          `       Rent: ₹${property.rent_amount || property.room_rent}`
        );
        console.log(`       Status: ${property.transaction_status}`);
        console.log(
          `       Owner: ${property.owner_first_name} ${property.owner_last_name}`
        );
        console.log(`       Move-in Date: ${property.move_in_date}`);
      });
    }

    client.release();
    return true;
  } catch (error) {
    logResult("Rented Properties Query", false, error.message);
    return false;
  }
};

// Main fix runner
const runFix = async () => {
  console.log("🔧 Starting Transaction Status Fix...\n");

  const steps = [
    updatePendingTransactions,
    verifyUpdates,
    testRentedPropertiesQuery,
  ];

  let passedSteps = 0;
  let totalSteps = steps.length;

  for (const step of steps) {
    try {
      const result = await step();
      if (result) passedSteps++;
    } catch (error) {
      console.error(`❌ Step failed with error: ${error.message}`);
    }
  }

  console.log("\n📈 Fix Results Summary:");
  console.log(`✅ Passed: ${passedSteps}/${totalSteps}`);
  console.log(`❌ Failed: ${totalSteps - passedSteps}/${totalSteps}`);

  if (passedSteps === totalSteps) {
    console.log(
      "\n🎉 Fix completed successfully! Your rented properties should now be visible."
    );
    console.log("\n💡 Next Steps:");
    console.log("1. Restart your backend server");
    console.log("2. Test the rented properties section in the frontend");
    console.log("3. Verify that the properties are now showing correctly");
  } else {
    console.log("\n⚠️ Some steps failed. Please check the errors above.");
  }
};

// Run fix if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFix().catch(console.error);
}

export { runFix };
