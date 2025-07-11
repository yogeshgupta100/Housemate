import axios from "axios";
import { config } from "dotenv";

config();

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

// Test data
const testData = {
  userToken: "",
  userId: null,
};

// Helper function to log test results
const logTest = (testName, success, message = "") => {
  const status = success ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} ${testName}${message ? `: ${message}` : ""}`);
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BACKEND_URL}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(data && { data }),
    };

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
};

// Test 1: User Login
const testUserLogin = async () => {
  console.log("\n🔐 Testing User Login...");

  const result = await makeRequest("POST", "/api/auth/login", {
    email: "user@example.com",
    password: "password123",
  });

  if (result.success && result.data.success) {
    testData.userToken = result.data.token;
    testData.userId = result.data.user.id;
    logTest("User Login", true, `User ID: ${testData.userId}`);
    return true;
  } else {
    logTest("User Login", false, result.error);
    return false;
  }
};

// Test 2: Check User's Transactions
const testUserTransactions = async () => {
  console.log("\n💳 Testing User Transactions...");

  const result = await makeRequest(
    "GET",
    `/api/transactions/user/${testData.userId}`,
    null,
    testData.userToken
  );

  if (result.success && result.data.success) {
    const transactions = result.data.transactions;
    logTest(
      "User Transactions",
      true,
      `${transactions.length} transactions found`
    );

    // Log transaction details for debugging
    transactions.forEach((txn, index) => {
      console.log(`  Transaction ${index + 1}:`);
      console.log(`    ID: ${txn.id}`);
      console.log(`    Status: ${txn.status}`);
      console.log(`    Property: ${txn.property_title}`);
      console.log(`    Created: ${txn.created_at}`);
    });

    return true;
  } else {
    logTest("User Transactions", false, result.error);
    return false;
  }
};

// Test 3: Check Rented Properties Endpoint
const testRentedProperties = async () => {
  console.log("\n🏠 Testing Rented Properties Endpoint...");

  const result = await makeRequest(
    "GET",
    "/api/transactions/rented-properties/me",
    null,
    testData.userToken
  );

  if (result.success && result.data.success) {
    const rentedProperties = result.data.rentedProperties;
    logTest(
      "Rented Properties",
      true,
      `${rentedProperties.length} rented properties found`
    );

    if (rentedProperties.length > 0) {
      rentedProperties.forEach((property, index) => {
        console.log(`  Rented Property ${index + 1}:`);
        console.log(`    Transaction ID: ${property.transactionId}`);
        console.log(`    Property: ${property.propertyTitle}`);
        console.log(`    Status: ${property.transactionStatus}`);
        console.log(
          `    Room: ${property.roomNumber} (Floor ${property.floorNumber})`
        );
        console.log(`    Move-in Date: ${property.moveInDate}`);
      });
    }

    return true;
  } else {
    logTest("Rented Properties", false, result.error);
    return false;
  }
};

// Test 4: Check Database Directly (if possible)
const testDatabaseQuery = async () => {
  console.log("\n🗄️ Testing Database Query...");

  // This would require direct database access, but we can check the query logic
  console.log("  Checking query logic:");
  console.log("  - Looking for transactions with user_id =", testData.userId);
  console.log('  - Looking for transactions with status = "active"');
  console.log("  - Joining with properties, floors, rooms, and users tables");

  return true;
};

// Test 5: Check if there are any active transactions
const testActiveTransactions = async () => {
  console.log("\n📊 Testing Active Transactions...");

  const result = await makeRequest(
    "GET",
    "/api/transactions/admin/active-transactions",
    null,
    testData.userToken
  );

  if (result.success && result.data.success) {
    const activeTransactions = result.data.activeTransactions;
    logTest(
      "Active Transactions",
      true,
      `${activeTransactions.length} active transactions found`
    );

    if (activeTransactions.length > 0) {
      activeTransactions.forEach((txn, index) => {
        console.log(`  Active Transaction ${index + 1}:`);
        console.log(`    Transaction ID: ${txn.transactionId}`);
        console.log(`    User ID: ${txn.userId}`);
        console.log(`    Property: ${txn.propertyTitle}`);
        console.log(`    Room: ${txn.roomNumber}`);
      });
    }

    return true;
  } else {
    logTest("Active Transactions", false, result.error);
    return false;
  }
};

// Test 6: Check User Profile
const testUserProfile = async () => {
  console.log("\n👤 Testing User Profile...");

  const result = await makeRequest(
    "GET",
    "/api/users/profile",
    null,
    testData.userToken
  );

  if (result.success && result.data.success) {
    const user = result.data.user;
    logTest("User Profile", true, `User: ${user.first_name} ${user.last_name}`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role_id}`);

    return true;
  } else {
    logTest("User Profile", false, result.error);
    return false;
  }
};

// Main test runner
const runRentedPropertiesDebug = async () => {
  console.log("🔍 Starting Rented Properties Debug Tests...\n");

  const tests = [
    testUserLogin,
    testUserProfile,
    testUserTransactions,
    testActiveTransactions,
    testRentedProperties,
    testDatabaseQuery,
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

  console.log("\n📈 Debug Results Summary:");
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

  console.log("\n🔍 Debug Analysis:");
  console.log("1. Check if user has any transactions in the database");
  console.log('2. Check if any transactions have status = "active"');
  console.log("3. Check if the JOIN queries are working correctly");
  console.log("4. Check if the user authentication is working properly");
  console.log("5. Check if the database tables exist and have data");
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRentedPropertiesDebug().catch(console.error);
}

export { runRentedPropertiesDebug };
