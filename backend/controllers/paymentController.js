import razorpayService from "../services/razorpayService.js";
import PaymentModel from "../models/Payment.js";
import TransactionModel from "../models/Transaction.js";
import pool from "../config/postgres.js";

// Create payment order for Razorpay
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
  try {
    const { transactionId, amount, notes } = req.body;
    const adminId = req.user.id;

    // Check if user is admin
    if (req.user.role_id !== 1) {
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

    res.status(201).json({
      success: true,
      message: "Cash payment added successfully",
      data: {
        payment: payment,
      },
    });
  } catch (error) {
    console.error("Add cash payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add cash payment",
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
    if (req.user.role_id !== 1) {
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
    if (payment.user_id !== userId && req.user.role_id !== 1) {
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
    if (req.user.role_id !== 1) {
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
