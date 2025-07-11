import Razorpay from "razorpay";
import crypto from "crypto";
import PaymentModel from "../models/Payment.js";
import pool from "../config/postgres.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class RazorpayService {
  // Create a new order with split payment
  async createOrderWithSplit(
    amount,
    baseAmount,
    commissionAmount,
    currency = "INR",
    receipt = null
  ) {
    try {
      const options = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes: {
          source: "housemate_platform",
          base_amount: baseAmount,
          commission_amount: commissionAmount,
        },
        // Split payment configuration
        transfers: [
          {
            account: process.env.ADMIN_RAZORPAY_ACCOUNT_ID, // Admin's Razorpay account
            amount: Math.round(commissionAmount * 100),
            currency: currency,
            notes: {
              type: "commission",
              description: "Platform commission",
            },
          },
        ],
      };

      const order = await razorpay.orders.create(options);
      return {
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          baseAmount: baseAmount,
          commissionAmount: commissionAmount,
        },
      };
    } catch (error) {
      console.error("Razorpay split order creation error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create a new order (existing method)
  async createOrder(amount, currency = "INR", receipt = null) {
    try {
      const options = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes: {
          source: "housemate_platform",
        },
      };

      const order = await razorpay.orders.create(options);
      return {
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        },
      };
    } catch (error) {
      console.error("Razorpay order creation error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Verify payment signature
  verifyPaymentSignature(orderId, paymentId, signature) {
    try {
      const text = `${orderId}|${paymentId}`;
      const generated_signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest("hex");

      return generated_signature === signature;
    } catch (error) {
      console.error("Payment signature verification error:", error);
      return false;
    }
  }

  // Get property owner's bank details
  async getPropertyOwnerBankDetails(propertyId) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT u.bank_details, u.first_name, u.last_name, u.email
         FROM properties p
         JOIN users u ON p.user_id = u.id
         WHERE p.id = $1`,
        [propertyId]
      );

      if (rows.length === 0) {
        throw new Error("Property owner not found");
      }

      const owner = rows[0];
      if (!owner.bank_details) {
        throw new Error("Property owner bank details not found");
      }

      // Validate bank details
      const validation = this.validateBankDetails(owner.bank_details);
      if (!validation.isValid) {
        throw new Error(`Invalid bank details: ${validation.error}`);
      }

      return owner.bank_details;
    } finally {
      client.release();
    }
  }

  // Calculate commission amount (configurable percentage)
  calculateCommission(baseAmount, commissionPercentage = 5) {
    return (baseAmount * commissionPercentage) / 100;
  }

  // Validate bank details
  validateBankDetails(bankDetails) {
    if (!bankDetails) {
      return { isValid: false, error: "Bank details not found" };
    }

    const requiredFields = [
      "account_number",
      "bank_name",
      "ifsc_code",
      "account_holder_name",
    ];

    for (const field of requiredFields) {
      if (!bankDetails[field] || bankDetails[field].trim() === "") {
        return {
          isValid: false,
          error: `Missing required bank detail: ${field.replace("_", " ")}`,
        };
      }
    }

    // Validate IFSC code format (4 letters + 7 alphanumeric)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(bankDetails.ifsc_code.toUpperCase())) {
      return {
        isValid: false,
        error: "Invalid IFSC code format",
      };
    }

    // Validate account number (should be numeric and reasonable length)
    if (!/^\d{9,18}$/.test(bankDetails.account_number)) {
      return {
        isValid: false,
        error: "Invalid account number format",
      };
    }

    return { isValid: true };
  }

  // Process split payment for a transaction
  async processSplitPayment(transactionId, totalAmount, userData) {
    try {
      // Get transaction details to determine base amount
      const client = await pool.connect();
      let transaction;

      try {
        const { rows } = await client.query(
          `SELECT t.*, p.price as property_price, p.deposit as property_deposit
           FROM transactions t
           JOIN properties p ON t.property_id = p.id
           WHERE t.id = $1`,
          [transactionId]
        );

        if (rows.length === 0) {
          throw new Error("Transaction not found");
        }

        transaction = rows[0];
      } finally {
        client.release();
      }

      // Calculate base amount (rent or deposit)
      const baseAmount =
        transaction.rent_amount ||
        transaction.deposit_amount ||
        transaction.property_price ||
        0;

      // Calculate commission amount
      const commissionAmount = this.calculateCommission(baseAmount);

      // Verify total amount matches
      const expectedTotal = baseAmount + commissionAmount;
      if (Math.abs(totalAmount - expectedTotal) > 1) {
        // Allow 1 rupee difference for rounding
        throw new Error(
          `Total amount mismatch. Expected: ${expectedTotal}, Received: ${totalAmount}`
        );
      }

      // Get property owner's bank details
      const ownerBankDetails = await this.getPropertyOwnerBankDetails(
        userData.propertyId
      );

      // Create Razorpay order with split payment
      const orderResult = await this.createOrderWithSplit(
        totalAmount,
        baseAmount,
        commissionAmount,
        "INR",
        `txn_${transactionId}`
      );

      if (!orderResult.success) {
        throw new Error(orderResult.error);
      }

      // Create payment record in database with split details
      const paymentData = {
        transaction_id: transactionId,
        user_id: userData.userId,
        property_id: userData.propertyId,
        amount: totalAmount,
        currency: "INR",
        payment_method: "razorpay",
        payment_status: "pending",
        razorpay_order_id: orderResult.order.id,
        payment_notes: `Split payment for transaction ${transactionId}. Base: ${baseAmount}, Commission: ${commissionAmount}`,
        // Add split payment details
        split_details: {
          base_amount: baseAmount,
          commission_amount: commissionAmount,
          owner_bank_details: ownerBankDetails,
          admin_account_id: process.env.ADMIN_RAZORPAY_ACCOUNT_ID,
        },
      };

      const payment = await PaymentModel.create(paymentData);

      return {
        success: true,
        order: orderResult.order,
        payment: payment,
        key_id: process.env.RAZORPAY_KEY_ID,
        splitDetails: {
          baseAmount,
          commissionAmount,
          ownerBankDetails,
        },
      };
    } catch (error) {
      console.error("Split payment processing error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process payment for a transaction (existing method - for backward compatibility)
  async processPayment(transactionId, amount, userData) {
    try {
      // Create Razorpay order
      const orderResult = await this.createOrder(
        amount,
        "INR",
        `txn_${transactionId}`
      );

      if (!orderResult.success) {
        throw new Error(orderResult.error);
      }

      // Create payment record in database
      const paymentData = {
        transaction_id: transactionId,
        user_id: userData.userId,
        property_id: userData.propertyId,
        amount: amount,
        currency: "INR",
        payment_method: "razorpay",
        payment_status: "pending",
        razorpay_order_id: orderResult.order.id,
        payment_notes: `Payment for transaction ${transactionId}`,
      };

      const payment = await PaymentModel.create(paymentData);

      return {
        success: true,
        order: orderResult.order,
        payment: payment,
        key_id: process.env.RAZORPAY_KEY_ID,
      };
    } catch (error) {
      console.error("Payment processing error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Verify and complete payment
  async verifyAndCompletePayment(
    paymentId,
    orderId,
    signature,
    paymentRecordId
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verify payment signature
      const isValidSignature = this.verifyPaymentSignature(
        orderId,
        paymentId,
        signature
      );

      if (!isValidSignature) {
        throw new Error("Invalid payment signature");
      }

      // Get payment details from Razorpay
      const payment = await razorpay.payments.fetch(paymentId);

      if (payment.status !== "captured") {
        throw new Error(`Payment not captured. Status: ${payment.status}`);
      }

      // Update payment record in database
      const additionalData = {
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        payment_receipt_url: payment.receipt || null,
      };

      const updatedPayment = await PaymentModel.updateStatus(
        paymentRecordId,
        "completed",
        additionalData
      );

      // Update transaction status to 'active' and increase room occupancy
      const {
        rows: [transaction],
      } = await client.query(
        `SELECT t.*, r.id as room_id, r.occupied, r.capacity
         FROM transactions t
         JOIN rooms r ON t.room_id = r.id
         WHERE t.id = $1`,
        [updatedPayment.transaction_id]
      );

      if (transaction) {
        // Update transaction status to 'active'
        await client.query(
          `UPDATE transactions 
           SET status = 'active', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [updatedPayment.transaction_id]
        );

        // Increase room occupancy by 1 (but don't exceed capacity)
        await client.query(
          `UPDATE rooms 
           SET occupied = LEAST(capacity, occupied + 1), updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [transaction.room_id]
        );

        console.log(
          `Transaction ${updatedPayment.transaction_id} activated and room ${transaction.room_id} occupancy updated`
        );
      }

      await client.query("COMMIT");

      return {
        success: true,
        payment: updatedPayment,
        razorpayPayment: payment,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Payment verification error:", error);

      // Update payment status to failed
      try {
        await PaymentModel.updateStatus(paymentRecordId, "failed", {
          payment_notes: `Payment verification failed: ${error.message}`,
        });
      } catch (updateError) {
        console.error("Failed to update payment status:", updateError);
      }

      return {
        success: false,
        error: error.message,
      };
    } finally {
      client.release();
    }
  }

  // Refund payment
  async refundPayment(paymentId, amount = null, reason = "Refund requested") {
    try {
      const refundOptions = {
        payment_id: paymentId,
        reason: reason,
      };

      if (amount) {
        refundOptions.amount = Math.round(amount * 100); // Convert to paise
      }

      const refund = await razorpay.payments.refund(refundOptions);

      return {
        success: true,
        refund: refund,
      };
    } catch (error) {
      console.error("Refund error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId) {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return {
        success: true,
        payment: payment,
      };
    } catch (error) {
      console.error("Get payment details error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process webhook
  async processWebhook(event, signature) {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(event))
        .digest("hex");

      if (expectedSignature !== signature) {
        throw new Error("Invalid webhook signature");
      }

      const { event: eventType, payload } = event;

      switch (eventType) {
        case "payment.captured":
          return await this.handlePaymentCaptured(payload.payment.entity);

        case "payment.failed":
          return await this.handlePaymentFailed(payload.payment.entity);

        case "refund.processed":
          return await this.handleRefundProcessed(payload.refund.entity);

        default:
          console.log(`Unhandled webhook event: ${eventType}`);
          return { success: true, message: "Event ignored" };
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Handle payment captured webhook
  async handlePaymentCaptured(paymentEntity) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Find payment record by Razorpay payment ID
      const payments = await PaymentModel.findByRazorpayPaymentId(
        paymentEntity.id
      );

      if (payments.length === 0) {
        throw new Error(
          `Payment record not found for Razorpay payment ID: ${paymentEntity.id}`
        );
      }

      const payment = payments[0];

      // Update payment status
      await PaymentModel.updateStatus(payment.id, "completed", {
        razorpay_payment_id: paymentEntity.id,
        payment_receipt_url: paymentEntity.receipt || null,
      });

      // Update transaction status to 'active' and increase room occupancy
      const {
        rows: [transaction],
      } = await client.query(
        `SELECT t.*, r.id as room_id, r.occupied, r.capacity
         FROM transactions t
         JOIN rooms r ON t.room_id = r.id
         WHERE t.id = $1`,
        [payment.transaction_id]
      );

      if (transaction) {
        // Update transaction status to 'active'
        await client.query(
          `UPDATE transactions 
           SET status = 'active', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [payment.transaction_id]
        );

        // Increase room occupancy by 1 (but don't exceed capacity)
        await client.query(
          `UPDATE rooms 
           SET occupied = LEAST(capacity, occupied + 1), updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [transaction.room_id]
        );

        console.log(
          `Transaction ${payment.transaction_id} activated and room ${transaction.room_id} occupancy updated`
        );
      }

      await client.query("COMMIT");

      return {
        success: true,
        message: "Payment captured and transaction activated successfully",
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Payment captured webhook error:", error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      client.release();
    }
  }

  // Handle payment failed webhook
  async handlePaymentFailed(paymentEntity) {
    try {
      const payments = await PaymentModel.findByRazorpayPaymentId(
        paymentEntity.id
      );

      if (payments.length === 0) {
        throw new Error(
          `Payment record not found for Razorpay payment ID: ${paymentEntity.id}`
        );
      }

      const payment = payments[0];

      // Update payment status
      await PaymentModel.updateStatus(payment.id, "failed", {
        payment_notes: `Payment failed: ${
          paymentEntity.error_description || "Unknown error"
        }`,
      });

      return {
        success: true,
        message: "Payment failed status updated",
      };
    } catch (error) {
      console.error("Payment failed webhook error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Handle refund processed webhook
  async handleRefundProcessed(refundEntity) {
    try {
      // Find payment record by Razorpay payment ID
      const payments = await PaymentModel.findByRazorpayPaymentId(
        refundEntity.payment_id
      );

      if (payments.length === 0) {
        throw new Error(
          `Payment record not found for Razorpay payment ID: ${refundEntity.payment_id}`
        );
      }

      const payment = payments[0];

      // Update payment status to refunded
      await PaymentModel.updateStatus(payment.id, "refunded", {
        payment_notes: `Payment refunded. Refund ID: ${refundEntity.id}`,
      });

      return {
        success: true,
        message: "Refund processed successfully",
      };
    } catch (error) {
      console.error("Refund processed webhook error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new RazorpayService();
