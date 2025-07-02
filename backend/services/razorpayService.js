import Razorpay from "razorpay";
import crypto from "crypto";
import PaymentModel from "../models/Payment.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class RazorpayService {
  // Create a new order
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

  // Process payment for a transaction
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
    try {
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

      return {
        success: true,
        payment: updatedPayment,
        razorpayPayment: payment,
      };
    } catch (error) {
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
    try {
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

      return {
        success: true,
        message: "Payment captured successfully",
      };
    } catch (error) {
      console.error("Payment captured webhook error:", error);
      return {
        success: false,
        error: error.message,
      };
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
