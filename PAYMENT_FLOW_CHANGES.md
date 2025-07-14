# Payment Flow Changes Implementation

This document outlines the changes made to implement the new payment flow requirements for the Housemate platform.

## Summary of Changes

### 1. Buy Button Flow

- **Before**: Showed toast message "You will be redirected to the Payment page"
- **After**: Opens Schedule Meeting modal directly
- **Files Modified**: `frontend/src/components/properties/propertydetail.jsx`

### 2. Rent Button Flow

- **Before**: Opened Terms & Conditions modal, then created transaction and navigated to transactions page
- **After**: Opens Terms & Conditions modal, then integrates payment gateway with split payment logic
- **Files Modified**:
  - `frontend/src/components/properties/propertydetail.jsx`
  - `frontend/src/components/SplitPaymentComponent.jsx` (new)

### 3. Payment Split Implementation

- **Base Amount**: Goes to property owner (rent amount)
- **Admin Fee**: Static ₹1000 goes to admin account
- **Total Amount**: Base + Admin fee
- **Files Modified**:
  - `backend/controllers/paymentController.js`
  - `backend/services/razorpayService.js`
  - `backend/models/Payment.js`

### 4. Admin Panel Cash-Only Payments

- **Before**: Admin could map tenants with any payment method
- **After**: Admin tenant mapping is cash-only with automatic payment record creation
- **Files Modified**:
  - `admin/src/components/PropertyDetails.jsx`
  - `backend/controllers/transactionController.js`

### 5. Transaction and Property Expiration System (NEW)

- **Transaction Expiration**: Transactions are automatically hidden when lease period expires
- **Property Expiration**: Properties disappear from user panel when related transactions expire
- **Lease Period Management**: Automatic calculation of lease end dates
- **Files Modified**:
  - `backend/models/Transaction.js`
  - `backend/controllers/transactionController.js`
  - `backend/controllers/propertyController.js`
  - `frontend/src/components/customerPanel/transactions/TransactionCard.jsx`
  - `admin/src/components/PropertyDetails.jsx`
  - `backend/utils/leaseUtils.js` (new)
  - `backend/scripts/addLeasePeriodColumns.js` (new)
  - `backend/scripts/updateExpiredTransactions.js` (new)

## Detailed Implementation

### Payment Flow Changes

#### 1. Buy Button (No Payment Gateway)

```javascript
// Before
onClick={() => toast.info("You will be redirected to the Payment page")}

// After
onClick={() => {
  if (property.listing_type === "rent") {
    setOpenTermsAndConditions(true);
  } else {
    setShowSchedule(true); // Opens Schedule Meeting modal
  }
}}
```

#### 2. Rent Button (Payment Gateway Integration)

```javascript
// After Terms & Conditions acceptance
const handleAccept = async () => {
  // Create transaction
  const response = await axios.post(
    `${Backendurl}/api/transactions`,
    transactionData
  );

  if (property.listing_type === "rent") {
    // Calculate split payment amounts
    const baseAmount = selectedRoom.rent;
    const adminFee = 1000;
    const totalAmount = baseAmount + adminFee;

    // Show payment modal with split details
    setPaymentDetails({
      transactionId: response.data.transaction.id,
      baseAmount: baseAmount,
      adminFee: adminFee,
      totalAmount: totalAmount,
      // ... other details
    });
    setShowPaymentModal(true);
  }
};
```

#### 3. Split Payment Component

New component `SplitPaymentComponent.jsx` handles:

- Payment breakdown display (Base Amount + Admin Fee)
- Razorpay integration for split payments
- Payment verification and status updates

#### 4. Admin Cash-Only Mapping

```javascript
// Admin tenant mapping
const handleMapTenant = async () => {
  const response = await axios.post(
    `${backendurl}/api/transactions/map-tenant`,
    {
      room_id: selectedRoom.id,
      user_id: selectedUser.id,
      move_in_date: moveInDate,
      rent_amount: selectedRoom.rent,
      deposit_amount: depositAmount || 0,
      payment_method: "cash", // Enforced cash-only
      lease_period: leasePeriod,
    }
  );

  // Automatically creates cash payment record
};
```

### Transaction and Property Expiration System

#### 1. Database Schema Changes

```sql
-- New columns in transactions table
ALTER TABLE transactions ADD COLUMN lease_period VARCHAR(50) DEFAULT '11 months';
ALTER TABLE transactions ADD COLUMN lease_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE transactions ADD COLUMN is_expired BOOLEAN DEFAULT false;

-- Indexes for performance
CREATE INDEX idx_transactions_lease_end_date ON transactions(lease_end_date);
CREATE INDEX idx_transactions_is_expired ON transactions(is_expired);
```

#### 2. Lease Period Calculation

```javascript
// Utility function for calculating lease end dates
export const calculateLeaseEndDate = (
  moveInDate,
  leasePeriod = "11 months"
) => {
  const startDate = new Date(moveInDate);
  const [number, unit] = leasePeriod.split(" ");
  const months = unit.toLowerCase().includes("month")
    ? parseInt(number)
    : parseInt(number) * 12;

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);

  return endDate;
};
```

#### 3. Transaction Filtering

```javascript
// Only show non-expired transactions with valid statuses
const transactions = await TransactionModel.findByUserId(userId);
// Automatically filters out expired transactions
```

#### 4. Property Filtering

```javascript
// Filter properties based on active transactions
const filteredProperties = properties.filter((property) => {
  if (property.listing_type === "sale") {
    return true; // Sale properties always visible
  }

  // Rent properties only visible if user has active, non-expired transactions
  const activeTransactions = userTransactions.filter(
    (transaction) => transaction.property_id === property.id
  );

  return activeTransactions.length > 0;
});
```

#### 5. Automatic Expiration Updates

```javascript
// Cron job script for automatic expiration updates
const updateExpiredTransactionsJob = async () => {
  const { rows } = await pool.query(`
    UPDATE transactions 
    SET is_expired = true 
    WHERE lease_end_date < CURRENT_TIMESTAMP 
    AND is_expired = false
  `);

  console.log(`Updated ${rows.length} expired transactions`);
};
```

## API Endpoints

### New Endpoints

```
POST /api/payments/create-split-order
POST /api/payments/verify-split-payment
POST /api/transactions/update-expired
```

### Updated Endpoints

```
GET /api/transactions/user/:userId
GET /api/properties/user/:userId
POST /api/transactions/map-tenant
```

## Frontend Components

### New Components

- `SplitPaymentComponent.jsx`: Handles split payment flow
- `leaseUtils.js`: Utility functions for lease calculations

### Updated Components

- `propertydetail.jsx`: Updated buy/rent button logic
- `TransactionCard.jsx`: Enhanced with lease information
- `PropertyDetails.jsx` (admin): Updated tenant mapping

## Backend Services

### New Services

- Split payment processing in `razorpayService.js`
- Lease period utilities in `leaseUtils.js`
- Automatic expiration updates

### Updated Services

- Transaction model with lease period support
- Payment model with split details
- Property controller with filtering logic

## Security Features

1. **Payment Security**: Razorpay integration with signature verification
2. **Access Control**: Users can only access their own payment records
3. **Admin Authorization**: Admin-only access to tenant mapping
4. **Data Integrity**: Server-side lease calculations and expiration checks

## User Experience Improvements

### 1. Clear Payment Breakdown

- Base amount (goes to property owner)
- Admin fee (goes to admin)
- Total amount display

### 2. Transaction Lifecycle

- Visual indicators for transaction status
- Lease period information display
- Expiration warnings

### 3. Property Management

- Automatic property visibility based on active transactions
- Clear distinction between sale and rent properties

## Deployment Steps

### 1. Database Migration

```bash
node backend/scripts/addLeasePeriodColumns.js
```

### 2. Application Updates

- Deploy updated backend with new endpoints
- Deploy updated frontend with new components
- Deploy updated admin panel

### 3. Cron Job Setup

```bash
# Add to crontab for daily expiration updates
0 2 * * * /usr/bin/node /path/to/housemate/backend/scripts/updateExpiredTransactions.js
```

## Testing Checklist

### Payment Flow

- [ ] Buy button opens schedule meeting modal
- [ ] Rent button opens terms and conditions
- [ ] Payment gateway integration works after terms acceptance
- [ ] Split payment amounts are calculated correctly
- [ ] Payment verification works properly

### Admin Panel

- [ ] Tenant mapping is cash-only
- [ ] Cash payment records are created automatically
- [ ] Lease period is included in mapping

### Expiration System

- [ ] Lease end dates are calculated correctly
- [ ] Expired transactions are hidden from user panels
- [ ] Properties are filtered based on active transactions
- [ ] Automatic expiration updates work
- [ ] Admin can still see expired transactions

## Monitoring and Maintenance

### Logs to Monitor

- Payment processing logs
- Transaction creation logs
- Expiration update logs
- API access logs

### Regular Tasks

- Monitor payment success rates
- Check expiration update job execution
- Review transaction and property filtering
- Update lease period options if needed

## Future Enhancements

1. **Notification System**: Alert users before lease expiration
2. **Renewal Process**: Automatic lease renewal options
3. **Advanced Analytics**: Payment and transaction analytics
4. **Bulk Operations**: Admin tools for bulk management
5. **Mobile Optimization**: Enhanced mobile payment experience
