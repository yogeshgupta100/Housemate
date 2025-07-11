import pool from "./config/postgres.js";
import { config } from "dotenv";

config();

// Helper function to log results
const logResult = (testName, success, message = "") => {
  const status = success ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} ${testName}${message ? `: ${message}` : ""}`);
};

// Test 1: Check if database is connected
const testDatabaseConnection = async () => {
  console.log("\n🔌 Testing Database Connection...");
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW() as current_time");
    client.release();
    logResult(
      "Database Connection",
      true,
      `Connected at ${result.rows[0].current_time}`
    );
    return true;
  } catch (error) {
    logResult("Database Connection", false, error.message);
    return false;
  }
};

// Test 2: Check if transactions table exists and has data
const testTransactionsTable = async () => {
  console.log("\n📊 Testing Transactions Table...");
  try {
    const client = await pool.connect();

    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'transactions'
      );
    `);

    if (!tableExists.rows[0].exists) {
      logResult("Transactions Table Exists", false, "Table does not exist");
      client.release();
      return false;
    }

    logResult("Transactions Table Exists", true);

    // Count total transactions
    const totalCount = await client.query(
      "SELECT COUNT(*) as count FROM transactions"
    );
    logResult(
      "Total Transactions",
      true,
      `${totalCount.rows[0].count} transactions found`
    );

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

    // Show sample transactions
    const sampleTransactions = await client.query(`
      SELECT id, user_id, property_id, room_id, status, created_at, updated_at
      FROM transactions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log("  Sample Transactions:");
    sampleTransactions.rows.forEach((txn, index) => {
      console.log(
        `    ${index + 1}. ID: ${txn.id}, User: ${txn.user_id}, Property: ${
          txn.property_id
        }, Status: ${txn.status}, Created: ${txn.created_at}`
      );
    });

    client.release();
    return true;
  } catch (error) {
    logResult("Transactions Table", false, error.message);
    return false;
  }
};

// Test 3: Check if users table has data
const testUsersTable = async () => {
  console.log("\n👥 Testing Users Table...");
  try {
    const client = await pool.connect();

    const userCount = await client.query("SELECT COUNT(*) as count FROM users");
    logResult("Total Users", true, `${userCount.rows[0].count} users found`);

    // Show sample users
    const sampleUsers = await client.query(`
      SELECT id, first_name, last_name, email, role_id
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log("  Sample Users:");
    sampleUsers.rows.forEach((user, index) => {
      console.log(
        `    ${index + 1}. ID: ${user.id}, Name: ${user.first_name} ${
          user.last_name
        }, Email: ${user.email}, Role: ${user.role_id}`
      );
    });

    client.release();
    return true;
  } catch (error) {
    logResult("Users Table", false, error.message);
    return false;
  }
};

// Test 4: Check if properties table has data
const testPropertiesTable = async () => {
  console.log("\n🏠 Testing Properties Table...");
  try {
    const client = await pool.connect();

    const propertyCount = await client.query(
      "SELECT COUNT(*) as count FROM properties"
    );
    logResult(
      "Total Properties",
      true,
      `${propertyCount.rows[0].count} properties found`
    );

    // Show sample properties
    const sampleProperties = await client.query(`
      SELECT id, title, user_id, type, listing_type, status
      FROM properties 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log("  Sample Properties:");
    sampleProperties.rows.forEach((prop, index) => {
      console.log(
        `    ${index + 1}. ID: ${prop.id}, Title: ${prop.title}, Owner: ${
          prop.user_id
        }, Type: ${prop.type}, Status: ${prop.status}`
      );
    });

    client.release();
    return true;
  } catch (error) {
    logResult("Properties Table", false, error.message);
    return false;
  }
};

// Test 5: Check if rooms table has data
const testRoomsTable = async () => {
  console.log("\n🚪 Testing Rooms Table...");
  try {
    const client = await pool.connect();

    const roomCount = await client.query("SELECT COUNT(*) as count FROM rooms");
    logResult("Total Rooms", true, `${roomCount.rows[0].count} rooms found`);

    // Show sample rooms
    const sampleRooms = await client.query(`
      SELECT id, room_number, floor_id, capacity, occupied, rent_amount
      FROM rooms 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log("  Sample Rooms:");
    sampleRooms.rows.forEach((room, index) => {
      console.log(
        `    ${index + 1}. ID: ${room.id}, Room: ${room.room_number}, Floor: ${
          room.floor_id
        }, Capacity: ${room.capacity}, Occupied: ${room.occupied}, Rent: ${
          room.rent_amount
        }`
      );
    });

    client.release();
    return true;
  } catch (error) {
    logResult("Rooms Table", false, error.message);
    return false;
  }
};

// Test 6: Check the exact query that getUserRentedProperties uses
const testRentedPropertiesQuery = async () => {
  console.log("\n🔍 Testing Rented Properties Query...");
  try {
    const client = await pool.connect();

    // First, let's find a user with transactions
    const userWithTransactions = await client.query(`
      SELECT DISTINCT t.user_id, u.first_name, u.last_name, u.email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      LIMIT 1
    `);

    if (userWithTransactions.rows.length === 0) {
      logResult(
        "User with Transactions",
        false,
        "No users with transactions found"
      );
      client.release();
      return false;
    }

    const testUser = userWithTransactions.rows[0];
    logResult(
      "User with Transactions",
      true,
      `User ID: ${testUser.user_id}, Name: ${testUser.first_name} ${testUser.last_name}`
    );

    // Now run the exact query from getUserRentedProperties
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
          `    ${index + 1}. Transaction: ${
            property.transaction_id
          }, Property: ${property.property_title}, Room: ${
            property.room_number
          }, Status: ${property.transaction_status}`
        );
      });
    } else {
      console.log("  No active rented properties found. Let's check why:");

      // Check all transactions for this user
      const allUserTransactions = await client.query(
        `
        SELECT id, status, property_id, room_id, created_at
        FROM transactions 
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
        [testUser.user_id]
      );

      console.log(
        `    Total transactions for user ${testUser.user_id}: ${allUserTransactions.rows.length}`
      );
      allUserTransactions.rows.forEach((txn, index) => {
        console.log(
          `      ${index + 1}. ID: ${txn.id}, Status: ${
            txn.status
          }, Property: ${txn.property_id}, Room: ${txn.room_id}, Created: ${
            txn.created_at
          }`
        );
      });
    }

    client.release();
    return true;
  } catch (error) {
    logResult("Rented Properties Query", false, error.message);
    return false;
  }
};

// Test 7: Check if there are any active transactions at all
const testActiveTransactions = async () => {
  console.log("\n📈 Testing Active Transactions...");
  try {
    const client = await pool.connect();

    const activeTransactions = await client.query(`
      SELECT COUNT(*) as count 
      FROM transactions 
      WHERE status = 'active'
    `);

    logResult(
      "Active Transactions",
      true,
      `${activeTransactions.rows[0].count} active transactions found`
    );

    if (activeTransactions.rows[0].count > 0) {
      const sampleActive = await client.query(`
        SELECT t.id, t.user_id, t.property_id, t.room_id, t.status, t.created_at,
               p.title as property_title, u.first_name, u.last_name
        FROM transactions t
        JOIN properties p ON t.property_id = p.id
        JOIN users u ON t.user_id = u.id
        WHERE t.status = 'active'
        ORDER BY t.created_at DESC
        LIMIT 5
      `);

      console.log("  Sample Active Transactions:");
      sampleActive.rows.forEach((txn, index) => {
        console.log(
          `    ${index + 1}. ID: ${txn.id}, User: ${txn.first_name} ${
            txn.last_name
          }, Property: ${txn.property_title}, Created: ${txn.created_at}`
        );
      });
    }

    client.release();
    return true;
  } catch (error) {
    logResult("Active Transactions", false, error.message);
    return false;
  }
};

// Test 8: Check if floors table exists and has data
const testFloorsTable = async () => {
  console.log("\n🏢 Testing Floors Table...");
  try {
    const client = await pool.connect();

    const floorCount = await client.query(
      "SELECT COUNT(*) as count FROM floors"
    );
    logResult("Total Floors", true, `${floorCount.rows[0].count} floors found`);

    // Show sample floors
    const sampleFloors = await client.query(`
      SELECT id, floor_number, property_id
      FROM floors 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log("  Sample Floors:");
    sampleFloors.rows.forEach((floor, index) => {
      console.log(
        `    ${index + 1}. ID: ${floor.id}, Floor: ${
          floor.floor_number
        }, Property: ${floor.property_id}`
      );
    });

    client.release();
    return true;
  } catch (error) {
    logResult("Floors Table", false, error.message);
    return false;
  }
};

// Main diagnostic runner
const runDiagnostics = async () => {
  console.log("🔍 Starting Rented Properties Database Diagnostics...\n");

  const tests = [
    testDatabaseConnection,
    testUsersTable,
    testPropertiesTable,
    testFloorsTable,
    testRoomsTable,
    testTransactionsTable,
    testActiveTransactions,
    testRentedPropertiesQuery,
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) passedTests++;
    } catch (error) {
      console.error(`❌ Test failed with error: ${error.message}`);
    }
  }

  console.log("\n📈 Diagnostic Results Summary:");
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

  console.log("\n🔍 Potential Issues Identified:");
  console.log("1. Check if transactions exist in the database");
  console.log("2. Check if any transactions have status = 'active'");
  console.log(
    "3. Check if the JOIN queries are working (properties, floors, rooms, users)"
  );
  console.log("4. Check if the user authentication is working properly");
  console.log("5. Check if the database tables have the correct structure");

  console.log("\n💡 Recommended Actions:");
  console.log("1. If no transactions exist: Create test transactions");
  console.log(
    "2. If transactions exist but none are 'active': Update status manually"
  );
  console.log("3. If JOIN queries fail: Check table relationships");
  console.log("4. If user auth fails: Check user credentials and tokens");
};

// Run diagnostics if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiagnostics().catch(console.error);
}

export { runDiagnostics };
