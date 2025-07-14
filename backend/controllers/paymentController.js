import razorpayService from "../services/razorpayService.js";
import PaymentModel from "../models/Payment.js";
import TransactionModel from "../models/Transaction.js";
import pool from "../config/postgres.js";

// Create split payment order for Razorpay
export const createSplitPaymentOrder = async (req, res) => {
  try {
    const { transactionId, totalAmount } = req.body;
    const userId = req.user.id;

    if (!transactionId || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID and total amount are required",
      });
    }

    // Verify transaction exists and belongs to user
    const transaction = await TransactionModel.getById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Process split payment through Razorpay
    const result = await razorpayService.processSplitPayment(
      transactionId,
      totalAmount,
      {
        userId: userId,
        propertyId: transaction.property_id,
      }
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order: result.order,
        payment: result.payment,
        key_id: result.key_id,
        splitDetails: result.splitDetails,
      },
    });
  } catch (error) {
    console.error("Create split payment order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create split payment order",
    });
  }
};

// Create payment order for Razorpay (existing method - for backward compatibility)
export const createPaymentOrder = async (req, res) => {
  try {
    const { transactionId, amount } = req.body;
    const userId = req.user.id;

    if (!transactionId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID and amount are required",
      });
    }

    // Verify transaction exists and belongs to user
    const transaction = await TransactionModel.getById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Process payment through Razorpay
    const result = await razorpayService.processPayment(transactionId, amount, {
      userId: userId,
      propertyId: transaction.property_id,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order: result.order,
        payment: result.payment,
        key_id: result.key_id,
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { paymentId, orderId, signature, paymentRecordId } = req.body;
    const userId = req.user.id;

    if (!paymentId || !orderId || !signature || !paymentRecordId) {
      return res.status(400).json({
        success: false,
        message:
          "Payment ID, Order ID, Signature, and Payment Record ID are required",
      });
    }

    // Verify payment record belongs to user
    const payment = await PaymentModel.findById(paymentRecordId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    if (payment.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Verify and complete payment
    const result = await razorpayService.verifyAndCompletePayment(
      paymentId,
      orderId,
      signature,
      paymentRecordId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        payment: result.payment,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

// Admin: Add cash payment
export const addCashPayment = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { transactionId, amount, notes } = req.body;
    const adminId = req.user.id;

    console.log("admin", req.user);

    // Check if user is admin
    if (req.user.role_id !== 4) {
      // Assuming role_id 1 is admin
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    if (!transactionId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID and amount are required",
      });
    }

    // Get transaction details
    const transaction = await TransactionModel.getById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Create cash payment record
    const paymentData = {
      transaction_id: transactionId,
      user_id: transaction.user_id,
      property_id: transaction.property_id,
      amount: amount,
      currency: "INR",
      payment_method: "cash",
      payment_status: "completed",
      payment_notes: notes || "Cash payment processed by admin",
      processed_by: adminId,
    };

    const payment = await PaymentModel.create(paymentData);

    // Update transaction status to 'active' and increase room occupancy
    const {
      rows: [roomData],
    } = await client.query(
      `SELECT r.id as room_id, r.occupied, r.capacity
       FROM rooms r
       WHERE r.id = $1`,
      [transaction.room_id]
    );

    if (roomData) {
      // Update transaction status to 'active'
      await client.query(
        `UPDATE transactions 
         SET status = 'active', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [transactionId]
      );

      // Increase room occupancy by 1 (but don't exceed capacity)
      await client.query(
        `UPDATE rooms 
         SET occupied = LEAST(capacity, occupied + 1), updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [roomData.room_id]
      );

      console.log(
        `Transaction ${transactionId} activated and room ${roomData.room_id} occupancy updated via cash payment`
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Cash payment added and transaction activated successfully",
      data: {
        payment: payment,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Add cash payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add cash payment",
    });
  } finally {
    client.release();
  }
};

// Admin: Transfer owner's portion after successful payment
export const transferToOwner = async (req, res) => {
  try {
    const { paymentId, amount } = req.body;
    const adminId = req.user.id;

    // Check if user is admin
    if (req.user.role_id !== 4) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    if (!paymentId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Payment ID and amount are required",
      });
    }

    // Get payment details with split information
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.payment_status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment must be completed before transferring to owner",
      });
    }

    // Get owner's bank details from split_details
    const splitDetails = payment.split_details;
    if (!splitDetails || !splitDetails.owner_bank_details) {
      return res.status(400).json({
        success: false,
        message: "Owner bank details not found in payment",
      });
    }

    const ownerBankDetails = splitDetails.owner_bank_details;

    // Create a payout to the owner's bank account
    const payoutData = {
      account_number: ownerBankDetails.account_number,
      fund_account: {
        account_type: "bank_account",
        bank_account: {
          name: ownerBankDetails.account_holder_name,
          ifsc: ownerBankDetails.ifsc_code,
          account_number: ownerBankDetails.account_number,
        },
        contact: {
          name: ownerBankDetails.account_holder_name,
          email: ownerBankDetails.email || "owner@housemate.com",
          contact: ownerBankDetails.phone || "+919999999999",
        },
      },
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      mode: "IMPS",
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: `owner_payout_${paymentId}_${Date.now()}`,
      narration: `Rent payment for transaction ${payment.transaction_id}`,
    };

    // Create payout using Razorpay
    const payout = await razorpayService.createPayout(payoutData);

    // Update payment record with payout information
    await PaymentModel.updateStatus(paymentId, "completed", {
      owner_payout_id: payout.id,
      owner_payout_amount: amount,
      owner_payout_status: payout.status,
      payment_notes: `${payment.payment_notes}. Owner payout initiated: ${payout.id}`,
    });

    res.status(200).json({
      success: true,
      message: "Owner payout initiated successfully",
      data: {
        payout: payout,
        ownerBankDetails: {
          account_holder_name: ownerBankDetails.account_holder_name,
          bank_name: ownerBankDetails.bank_name,
          account_number: ownerBankDetails.account_number,
          ifsc_code: ownerBankDetails.ifsc_code,
        },
      },
    });
  } catch (error) {
    console.error("Transfer to owner error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to transfer to owner",
    });
  }
};

// Get payment history for user
export const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const payments = await PaymentModel.findByUserId(userId);
    const totalPayments = payments.length;
    const paginatedPayments = payments.slice(offset, offset + parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        payments: paginatedPayments,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalPayments / limit),
          total_items: totalPayments,
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get user payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment history",
    });
  }
};

// Admin: Get all payments
export const getAllPayments = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role_id !== 4) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { page = 1, limit = 50, status, payment_method } = req.query;
    const offset = (page - 1) * limit;

    let payments = await PaymentModel.getAll(parseInt(limit), offset);

    // Filter by status if provided
    if (status) {
      payments = payments.filter(
        (payment) => payment.payment_status === status
      );
    }

    // Filter by payment method if provided
    if (payment_method) {
      payments = payments.filter(
        (payment) => payment.payment_method === payment_method
      );
    }

    // Get payment statistics
    const stats = await PaymentModel.getPaymentStats();

    res.status(200).json({
      success: true,
      data: {
        payments: payments,
        stats: stats,
        pagination: {
          current_page: parseInt(page),
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payments",
    });
  }
};

// Get payment details
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Check if user has access to this payment
    if (payment.user_id !== userId && req.user.role_id !== 4) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        payment: payment,
      },
    });
  } catch (error) {
    console.error("Get payment details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment details",
    });
  }
};

// Razorpay webhook handler
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const event = req.body;

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Missing signature",
      });
    }

    const result = await razorpayService.processWebhook(event, signature);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Webhook processed successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error,
      });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

// Refund payment (Admin only)
export const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    // Check if user is admin
    if (req.user.role_id !== 4) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    // Get payment details
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.payment_method !== "razorpay") {
      return res.status(400).json({
        success: false,
        message: "Only Razorpay payments can be refunded through this endpoint",
      });
    }

    if (!payment.razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment ID not found",
      });
    }

    // Process refund through Razorpay
    const result = await razorpayService.refundPayment(
      payment.razorpay_payment_id,
      amount,
      reason
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    // Update payment status to refunded
    await PaymentModel.updateStatus(paymentId, "refunded", {
      payment_notes: `Payment refunded. Refund ID: ${
        result.refund.id
      }. Reason: ${reason || "Admin refund"}`,
    });

    res.status(200).json({
      success: true,
      message: "Payment refunded successfully",
      data: {
        refund: result.refund,
      },
    });
  } catch (error) {
    console.error("Refund payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refund payment",
    });
  }
};
