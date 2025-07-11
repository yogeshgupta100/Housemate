import axios from "axios";
import { config } from "dotenv";

config();

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

// Test data
const testData = {
  adminToken: "",
  userToken: "",
  propertyId: null,
  transactionId: null,
  paymentId: null,
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
    };
  }
};

// Test 1: Admin Login
const testAdminLogin = async () => {
  console.log("\n🔐 Testing Admin Login...");

  const result = await makeRequest("POST", "/api/auth/login", {
    email: "admin@housemate.com",
    password: "admin123",
  });

  if (result.success && result.data.success) {
    testData.adminToken = result.data.token;
    logTest("Admin Login", true);
    return true;
  } else {
    logTest("Admin Login", false, result.error);
    return false;
  }
};

// Test 2: User Login
const testUserLogin = async () => {
  console.log("\n👤 Testing User Login...");

  const result = await makeRequest("POST", "/api/auth/login", {
    email: "user@example.com",
    password: "password123",
  });

  if (result.success && result.data.success) {
    testData.userToken = result.data.token;
    logTest("User Login", true);
    return true;
  } else {
    logTest("User Login", false, result.error);
    return false;
  }
};

// Test 3: Create Test Property
const testCreateProperty = async () => {
  console.log("\n🏠 Testing Property Creation...");

  const propertyData = {
    title: "Test Property for Payment Flow",
    description: "A test property to verify payment functionality",
    type: "pg",
    listing_type: "rent",
    price: 15000,
    deposit: 15000,
    rent_type: "monthly",
    location: "Test Location, Test City",
    city: "Test City",
    state: "Test State",
    pincode: "123456",
    phone: "9876543210",
    amenities: ["WiFi", "AC", "Food"],
    floorDetails: [
      {
        floorNumber: 1,
        rooms: [
          {
            roomNumber: "101",
            capacity: 2,
            occupied: 0,
            rent: 15000,
            hasBalcony: true,
          },
        ],
      },
    ],
  };

  const result = await makeRequest(
    "POST",
    "/api/properties",
    propertyData,
    testData.userToken
  );

  if (result.success && result.data.success) {
    testData.propertyId = result.data.property.id;
    logTest("Property Creation", true, `Property ID: ${testData.propertyId}`);
    return true;
  } else {
    logTest("Property Creation", false, result.error);
    return false;
  }
};

// Test 4: Create Transaction
const testCreateTransaction = async () => {
  console.log("\n💳 Testing Transaction Creation...");

  const transactionData = {
    property_id: testData.propertyId,
    floor_id: 1, // Assuming first floor
    room_id: 1, // Assuming first room
    user_id: 2, // Assuming user ID 2
    move_in_date: new Date().toISOString().split("T")[0],
    status: "pending",
    rent_amount: 15000,
    deposit_amount: 15000,
  };

  const result = await makeRequest(
    "POST",
    "/api/transactions",
    transactionData,
    testData.userToken
  );

  if (result.success && result.data.success) {
    testData.transactionId = result.data.transaction.id;
    logTest(
      "Transaction Creation",
      true,
      `Transaction ID: ${testData.transactionId}`
    );
    return true;
  } else {
    logTest("Transaction Creation", false, result.error);
    return false;
  }
};

// Test 5: Create Split Payment Order
const testCreateSplitPaymentOrder = async () => {
  console.log("\n💰 Testing Split Payment Order Creation...");

  const totalAmount = 15750; // 15000 + 5% commission

  const result = await makeRequest(
    "POST",
    "/api/payments/create-split-order",
    {
      transactionId: testData.transactionId,
      totalAmount: totalAmount,
    },
    testData.userToken
  );

  if (result.success && result.data.success) {
    testData.paymentId = result.data.payment.id;
    logTest(
      "Split Payment Order Creation",
      true,
      `Payment ID: ${testData.paymentId}`
    );

    // Verify split details
    const splitDetails = result.data.splitDetails;
    if (
      splitDetails &&
      splitDetails.baseAmount === 15000 &&
      splitDetails.commissionAmount === 750
    ) {
      logTest(
        "Split Details Verification",
        true,
        "Base: ₹15,000, Commission: ₹750"
      );
    } else {
      logTest("Split Details Verification", false, "Incorrect split amounts");
    }

    return true;
  } else {
    logTest("Split Payment Order Creation", false, result.error);
    return false;
  }
};

// Test 6: Admin Cash Payment
const testAdminCashPayment = async () => {
  console.log("\n💵 Testing Admin Cash Payment...");

  const cashPaymentData = {
    transactionId: testData.transactionId,
    amount: 15000,
    notes: "Test cash payment for payment flow verification",
  };

  const result = await makeRequest(
    "POST",
    "/api/payments/cash-payment",
    cashPaymentData,
    testData.adminToken
  );

  if (result.success && result.data.success) {
    logTest("Admin Cash Payment", true, "Cash payment processed successfully");
    return true;
  } else {
    logTest("Admin Cash Payment", false, result.error);
    return false;
  }
};

// Test 7: Get Payment Details
const testGetPaymentDetails = async () => {
  console.log("\n📋 Testing Payment Details Retrieval...");

  const result = await makeRequest(
    "GET",
    `/api/payments/payment/${testData.paymentId}`,
    null,
    testData.userToken
  );

  if (result.success && result.data.success) {
    const payment = result.data.payment;
    logTest(
      "Payment Details Retrieval",
      true,
      `Status: ${payment.payment_status}`
    );
    return true;
  } else {
    logTest("Payment Details Retrieval", false, result.error);
    return false;
  }
};

// Test 8: Get All Payments (Admin)
const testGetAllPayments = async () => {
  console.log("\n📊 Testing All Payments Retrieval (Admin)...");

  const result = await makeRequest(
    "GET",
    "/api/payments/all-payments",
    null,
    testData.adminToken
  );

  if (result.success && result.data.success) {
    const payments = result.data.data.payments;
    logTest(
      "All Payments Retrieval",
      true,
      `${payments.length} payments found`
    );
    return true;
  } else {
    logTest("All Payments Retrieval", false, result.error);
    return false;
  }
};

// Test 9: Cleanup - Delete Test Property
const testCleanup = async () => {
  console.log("\n🧹 Testing Cleanup...");

  const result = await makeRequest(
    "DELETE",
    `/api/properties/${testData.propertyId}`,
    null,
    testData.userToken
  );

  if (result.success && result.data.success) {
    logTest("Cleanup", true, "Test property deleted");
    return true;
  } else {
    logTest("Cleanup", false, result.error);
    return false;
  }
};

// Main test runner
const runPaymentFlowTests = async () => {
  console.log("🚀 Starting Payment Flow Tests...\n");

  const tests = [
    testAdminLogin,
    testUserLogin,
    testCreateProperty,
    testCreateTransaction,
    testCreateSplitPaymentOrder,
    testAdminCashPayment,
    testGetPaymentDetails,
    testGetAllPayments,
    testCleanup,
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

  console.log("\n📈 Test Results Summary:");
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log(
      "\n🎉 All payment flow tests passed! The payment system is working correctly."
    );
  } else {
    console.log("\n⚠️  Some tests failed. Please check the implementation.");
  }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPaymentFlowTests().catch(console.error);
}

export { runPaymentFlowTests };
