# Payment System Setup Guide

This guide will help you set up the Razorpay payment gateway integration for the Housemate platform.

## Features Implemented

### Backend Features

- ✅ Razorpay payment gateway integration
- ✅ Payment order creation and verification
- ✅ Webhook handling for payment status updates
- ✅ Cash payment management for admins
- ✅ Payment refund functionality
- ✅ Comprehensive payment tracking and statistics
- ✅ Database tables for payment records

### Frontend Features

- ✅ Payment component with Razorpay integration
- ✅ Admin payment management dashboard
- ✅ Payment history and status tracking
- ✅ Cash payment addition interface
- ✅ Refund processing interface

## Database Changes

The following database changes have been made:

### 1. Updated Transactions Table

Added payment-related columns to the existing `transactions` table:

- `payment_status` - Payment status (pending, completed, failed, cancelled, refunded)
- `payment_method` - Payment method (razorpay, cash, bank_transfer, upi, card, wallet)
- `payment_amount` - Amount paid
- `payment_date` - Date of payment
- `razorpay_order_id` - Razorpay order ID
- `razorpay_payment_id` - Razorpay payment ID
- `payment_receipt_url` - Payment receipt URL
- `payment_notes` - Payment notes

### 2. New Payments Table

Created a new `payments` table for detailed payment tracking:

- `id` - Primary key
- `transaction_id` - Reference to transactions table
- `user_id` - Reference to users table
- `property_id` - Reference to properties table
- `amount` - Payment amount
- `currency` - Payment currency (default: INR)
- `payment_method` - Payment method
- `payment_status` - Payment status
- `razorpay_order_id` - Razorpay order ID
- `razorpay_payment_id` - Razorpay payment ID
- `razorpay_signature` - Payment signature for verification
- `payment_receipt_url` - Receipt URL
- `payment_notes` - Payment notes
- `processed_by` - Admin who processed cash payment
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

## Razorpay Account Setup

### 1. Create Razorpay Account

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a new account
3. Complete the verification process

### 2. Get API Keys

1. Go to Settings → API Keys
2. Generate a new key pair
3. Copy the Key ID and Key Secret
4. Add them to your environment variables

### 3. Configure Webhooks

1. Go to Settings → Webhooks
2. Add a new webhook with the following URL:
   ```
   https://your-domain.com/api/payments/webhook
   ```
3. Select the following events:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
4. Copy the webhook secret and add it to your environment variables

## Installation Steps

### 1. Install Dependencies

```bash
cd Housemate/backend
npm install razorpay
```

### 2. Run Database Migration

```bash
node scripts/createPaymentTables.js
```

### 3. Update Environment Variables

Add the Razorpay configuration to your `.env` file.

### 4. Restart Server

```bash
npm run dev
```

## API Endpoints

### Payment Endpoints

#### Create Payment Order

```
POST /api/payments/create-order
```

**Body:**

```json
{
  "transactionId": 123,
  "amount": 50000
}
```

#### Verify Payment

```
POST /api/payments/verify
```

**Body:**

```json
{
  "paymentId": "pay_xxx",
  "orderId": "order_xxx",
  "signature": "xxx",
  "paymentRecordId": 1
}
```

#### Add Cash Payment (Admin)

```
POST /api/payments/cash-payment
```

**Body:**

```json
{
  "transactionId": 123,
  "amount": 50000,
  "notes": "Cash payment received"
}
```

#### Get User Payments

```
GET /api/payments/user-payments?page=1&limit=10
```

#### Get All Payments (Admin)

```
GET /api/payments/all-payments?page=1&limit=50&status=completed&payment_method=razorpay
```

#### Get Payment Details

```
GET /api/payments/payment/:paymentId
```

#### Refund Payment (Admin)

```
POST /api/payments/refund
```

**Body:**

```json
{
  "paymentId": 1,
  "amount": 25000,
  "reason": "Partial refund requested"
}
```

#### Webhook Handler

```
POST /api/payments/webhook
```

## Frontend Integration

### 1. Payment Component

Use the `PaymentComponent` for user payments:

```jsx
import PaymentComponent from "./components/PaymentComponent";

<PaymentComponent
  transactionId={123}
  amount={50000}
  propertyTitle="Beautiful Apartment"
  onPaymentSuccess={(payment) => {
    console.log("Payment successful:", payment);
  }}
  onPaymentCancel={() => {
    console.log("Payment cancelled");
  }}
/>;
```

### 2. Admin Payment Management

Use the `PaymentManagement` component for admin dashboard:

```jsx
import PaymentManagement from "./components/admin/PaymentManagement";

<PaymentManagement />;
```

## Payment Flow

### Online Payment Flow

1. User selects a property and initiates payment
2. Frontend calls `/api/payments/create-order` to create Razorpay order
3. Razorpay payment modal opens
4. User completes payment
5. Frontend calls `/api/payments/verify` to verify payment
6. Payment status is updated in database
7. Webhook confirms payment status

### Cash Payment Flow

1. Admin receives cash payment from user
2. Admin uses the "Add Cash Payment" feature
3. Admin enters transaction ID, amount, and notes
4. Payment is marked as completed in database
5. Transaction status is updated

### Refund Flow

1. Admin initiates refund for a completed Razorpay payment
2. System calls Razorpay refund API
3. Payment status is updated to "refunded"
4. Webhook confirms refund status

## Security Features

- ✅ Payment signature verification
- ✅ Webhook signature verification
- ✅ Admin-only access for sensitive operations
- ✅ User authorization checks
- ✅ Secure token-based authentication

## Testing

### Test Mode

For testing, use Razorpay's test mode:

- Test Key ID: `rzp_test_xxx`
- Test Key Secret: `xxx`
- Test cards available in Razorpay documentation

### Production Mode

For production, use live keys:

- Live Key ID: `rzp_live_xxx`
- Live Key Secret: `xxx`

## Troubleshooting

### Common Issues

1. **Payment verification fails**

   - Check if webhook secret is correct
   - Verify payment signature
   - Ensure order ID matches

2. **Webhook not receiving events**

   - Check webhook URL is accessible
   - Verify webhook secret
   - Check server logs for errors

3. **Database errors**
   - Ensure migration script ran successfully
   - Check database connection
   - Verify table structure

### Logs

Check server logs for detailed error information:

```bash
npm run dev
```

## Support

For issues related to:

- **Razorpay Integration**: Check [Razorpay Documentation](https://razorpay.com/docs/)
- **Database Issues**: Check PostgreSQL logs
- **Frontend Issues**: Check browser console
- **General Issues**: Check server logs

## Additional Notes

- All amounts are stored in paise (smallest currency unit) for Razorpay
- Payment statuses are automatically updated via webhooks
- Cash payments bypass Razorpay and are managed internally
- Refunds are only available for Razorpay payments
- Admin can view all payments and manage cash payments
- Users can only view their own payment history
