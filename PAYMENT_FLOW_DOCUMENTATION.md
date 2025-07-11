# Complete Payment Flow Documentation

This document provides a comprehensive overview of the payment flow implementation in the Housemate platform, covering both user-facing payment processes and admin panel payment management.

## 🏗️ System Architecture

### Payment Flow Overview

```
User Frontend → Property Details → Room Selection → Terms & Conditions → Payment Gateway → Razorpay → Split Payment
     ↓
Admin Panel → Tenant Mapping → Cash Payment Processing → Transaction Management
```

## 🔄 Frontend Payment Flow (User Journey)

### 1. Property Discovery & Room Selection

- User browses properties on the main platform
- Clicks on a property with available rooms (PG, RK, Flat types)
- Views room details, pricing, and availability
- Selects a specific room for booking

### 2. Terms & Conditions Acceptance

- User clicks "Accept" on Terms & Conditions modal
- System validates user authentication
- Creates pending transaction in database
- Redirects to payment gateway

### 3. Payment Gateway Integration

- **Route**: `/payment/{transactionId}`
- **Component**: `PaymentPage.jsx`
- **Features**:
  - Transaction summary display
  - Split payment breakdown
  - Payment method selection (Online/Cash)
  - Razorpay integration

### 4. Split Payment Processing

- **Base Amount**: Rent + Deposit (goes to property owner)
- **Commission**: 5% of base amount (goes to admin)
- **Total Amount**: Base + Commission
- **Automatic Transfers**: Configured in Razorpay

### 5. Payment Success Flow

- Payment verification through Razorpay
- Transaction status updated to "active"
- Room occupancy increased
- User redirected to "My Rented Properties"

## 🛠️ Admin Panel Payment Flow

### 1. Tenant Mapping with Cash Payment

- **Location**: Admin Panel → Property Details → Room Management
- **Features**:
  - Search and select users
  - Set move-in date and amounts
  - Choose payment method (Online/Cash)
  - Process cash payments directly

### 2. Cash Payment Processing

- **Endpoint**: `POST /api/payments/cash-payment`
- **Features**:
  - Transaction ID validation
  - Amount verification
  - Payment notes
  - Admin audit trail

### 3. Payment Management Dashboard

- **Component**: `PaymentManagement.jsx`
- **Features**:
  - View all payments
  - Filter by status/method
  - Add cash payments
  - Process refunds
  - Payment statistics

## 💳 Payment Methods Supported

### 1. Online Payment (Razorpay)

- **Methods**: Credit/Debit Cards, UPI, Net Banking, Wallets
- **Features**:
  - Split payment with automatic transfers
  - Payment verification
  - Receipt generation
  - Webhook handling

### 2. Cash Payment (Admin Only)

- **Process**: Admin receives cash and records payment
- **Features**:
  - Direct transaction recording
  - Payment notes
  - Admin audit trail
  - Immediate status update

## 🔧 Technical Implementation

### Backend Endpoints

#### Payment Creation

```javascript
POST /api/payments/create-split-order
{
  "transactionId": 123,
  "totalAmount": 15750
}
```

#### Payment Verification

```javascript
POST /api/payments/verify
{
  "paymentId": "pay_xxx",
  "orderId": "order_xxx",
  "signature": "xxx",
  "paymentRecordId": 456
}
```

#### Cash Payment (Admin)

```javascript
POST /api/payments/cash-payment
{
  "transactionId": 123,
  "amount": 15000,
  "notes": "Cash received from tenant"
}
```

### Database Schema

#### Transactions Table

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id),
  floor_id INTEGER REFERENCES floors(id),
  room_id INTEGER REFERENCES rooms(id),
  user_id INTEGER REFERENCES users(id),
  move_in_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  rent_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Payments Table

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id),
  user_id INTEGER REFERENCES users(id),
  property_id INTEGER REFERENCES properties(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  payment_notes TEXT,
  processed_by INTEGER REFERENCES users(id),
  split_details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Security Features

### 1. Payment Verification

- Razorpay signature verification
- Payment amount validation
- Transaction ownership verification
- Admin role validation for cash payments

### 2. Bank Details Validation

- IFSC code format validation
- Account number validation
- Required fields validation
- Property listing restrictions for incomplete profiles

### 3. Split Payment Security

- Commission calculation validation
- Transfer configuration verification
- Webhook signature verification
- Payment status tracking

## 📊 Payment Flow States

### Transaction States

1. **pending**: Initial state after creation
2. **active**: Payment completed, tenant moved in
3. **completed**: Tenant checked out
4. **cancelled**: Payment cancelled or failed

### Payment States

1. **pending**: Payment initiated
2. **completed**: Payment successful
3. **failed**: Payment failed
4. **refunded**: Payment refunded
5. **cancelled**: Payment cancelled

## 🧪 Testing

### Test Coverage

- ✅ User authentication flow
- ✅ Property listing and room selection
- ✅ Transaction creation
- ✅ Split payment order creation
- ✅ Cash payment processing
- ✅ Payment verification
- ✅ Admin payment management
- ✅ Bank details validation

### Test Commands

```bash
# Run payment flow tests
node test-payment-flow.js

# Run specific test suites
npm test -- --grep "payment"
```

## 🚀 Deployment Checklist

### Environment Variables

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
ADMIN_RAZORPAY_ACCOUNT_ID=your_admin_account_id
BACKEND_URL=http://localhost:4000
```

### Database Setup

```bash
# Run payment table creation script
node scripts/createPaymentTables.js

# Verify tables exist
psql -d housemate_db -c "\dt payments"
psql -d housemate_db -c "\dt transactions"
```

### Frontend Configuration

- Ensure Razorpay script is loaded
- Verify payment routes are registered
- Test payment component integration
- Validate admin panel payment features

## 📈 Monitoring & Analytics

### Payment Metrics

- Total transaction volume
- Success/failure rates
- Commission revenue
- Payment method distribution
- Cash vs online payment ratio

### Error Tracking

- Payment verification failures
- Webhook processing errors
- Bank details validation errors
- Admin payment processing issues

## 🔄 Future Enhancements

### Planned Features

- [ ] Multiple payment gateway support
- [ ] Recurring payment setup
- [ ] Payment installment plans
- [ ] Advanced refund processing
- [ ] Payment analytics dashboard
- [ ] SMS/Email payment notifications

### Integration Opportunities

- [ ] Accounting software integration
- [ ] GST compliance features
- [ ] Payment reconciliation tools
- [ ] Advanced reporting capabilities

## 📞 Support & Troubleshooting

### Common Issues

1. **Payment Verification Failed**

   - Check Razorpay credentials
   - Verify webhook configuration
   - Validate payment signature

2. **Split Payment Not Working**

   - Verify admin Razorpay account
   - Check transfer configuration
   - Validate bank details

3. **Cash Payment Errors**
   - Verify admin permissions
   - Check transaction existence
   - Validate amount format

### Contact Information

- **Technical Support**: tech@housemate.com
- **Payment Issues**: payments@housemate.com
- **Admin Support**: admin@housemate.com

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
