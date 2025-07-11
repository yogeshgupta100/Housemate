# Split Payment System Implementation

This document explains the split payment functionality implemented in the Housemate platform, where payments are automatically split between property owners and the platform admin.

## Overview

The split payment system ensures that:

- **Base payment** (rent/deposit amount) goes to the property owner's bank account
- **Commission payment** (platform fee) goes to the admin's Razorpay account
- All payments are processed through Razorpay with automatic transfer splits
- **Property owners must have complete bank details** before listing properties

## Features Implemented

### Backend Features

- ✅ Split payment order creation with Razorpay transfers
- ✅ Automatic commission calculation (configurable percentage)
- ✅ Property owner bank details validation
- ✅ Split payment details storage in database
- ✅ Backward compatibility with existing payment system
- ✅ Webhook handling for split payments
- ✅ **Bank details validation before property listing**
- ✅ **Property listing restrictions for incomplete profiles**

### Frontend Features

- ✅ Split payment component with detailed breakdown
- ✅ Commission amount display
- ✅ Toggle to show/hide split details
- ✅ Enhanced payment flow with split information
- ✅ **Bank details missing warning in property listing form**
- ✅ **Profile completion redirect for incomplete bank details**

## Bank Details Requirements

### Required Fields

Property owners must provide the following bank details in their profile:

1. **Account Number** - Must be 9-18 digits
2. **Bank Name** - Full bank name
3. **IFSC Code** - Must follow format: 4 letters + 0 + 6 alphanumeric (e.g., HDFC0001234)
4. **Account Holder Name** - Name as registered with the bank

### Validation Rules

- All fields are required and cannot be empty
- IFSC code must follow the standard Indian format
- Account number must be numeric and between 9-18 digits
- Bank details are validated before allowing property listing

### Property Listing Restrictions

Users **cannot list properties** until they have:

1. ✅ Complete bank details in their profile
2. ✅ Valid IFSC code format
3. ✅ Valid account number format
4. ✅ All required fields filled

If bank details are missing or invalid, users will see:

- Warning message in property listing form
- Redirect button to complete profile
- Clear error message explaining the requirement

## Database Changes

### 1. Updated Payments Table

Added `split_details` column to store split payment information:

```sql
ALTER TABLE payments ADD COLUMN split_details JSONB;
```

The `split_details` column stores:

```json
{
  "base_amount": 50000,
  "commission_amount": 2500,
  "owner_bank_details": {
    "account_number": "1234567890",
    "bank_name": "HDFC Bank",
    "ifsc_code": "HDFC0001234",
    "account_holder_name": "John Doe"
  },
  "admin_account_id": "acc_1234567890"
}
```

### 2. Bank Details Validation

Bank details are stored in the `users` table:

```sql
bank_details JSONB
```

Example structure:

```json
{
  "account_number": "1234567890",
  "bank_name": "HDFC Bank",
  "ifsc_code": "HDFC0001234",
  "account_holder_name": "John Doe"
}
```

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Admin Razorpay Account (for commission transfers)
ADMIN_RAZORPAY_ACCOUNT_ID=acc_1234567890
```

## How to Get Razorpay Webhook Secret

### Step 1: Access Razorpay Dashboard

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign in to your account

### Step 2: Navigate to Webhooks

1. Go to **Settings** → **Webhooks**
2. Click on **Add New Webhook**

### Step 3: Configure Webhook

1. **Webhook URL**: `https://your-domain.com/api/payments/webhook`
2. **Events to send**:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
   - `transfer.processed` (for split payments)

### Step 4: Get Webhook Secret

1. After creating the webhook, click on the webhook entry
2. Copy the **Webhook Secret** from the details page
3. Add it to your `.env` file as `RAZORPAY_WEBHOOK_SECRET`

## API Endpoints

### Create Split Payment Order

```
POST /api/payments/create-split-order
```

**Body:**

```json
{
  "transactionId": 123,
  "totalAmount": 52500
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_1234567890",
      "amount": 5250000,
      "currency": "INR",
      "receipt": "txn_123",
      "baseAmount": 50000,
      "commissionAmount": 2500
    },
    "payment": {
      "id": 1,
      "transaction_id": 123,
      "amount": 52500,
      "split_details": {
        "base_amount": 50000,
        "commission_amount": 2500,
        "owner_bank_details": {...},
        "admin_account_id": "acc_1234567890"
      }
    },
    "key_id": "rzp_test_1234567890",
    "splitDetails": {
      "baseAmount": 50000,
      "commissionAmount": 2500,
      "ownerBankDetails": {...}
    }
  }
}
```

### Property Creation (with Bank Details Validation)

```
POST /api/properties
```

**Error Response (Bank Details Missing):**

```json
{
  "success": false,
  "message": "Please complete your profile with valid bank details before listing a property. Missing required bank detail: ifsc code",
  "code": "BANK_DETAILS_MISSING"
}
```

## Commission Calculation

The commission is calculated as a percentage of the base amount:

```javascript
// Default commission rate: 5%
const commissionAmount = (baseAmount * 5) / 100;
```

### Configurable Commission Rates

You can modify the commission percentage in `razorpayService.js`:

```javascript
calculateCommission(baseAmount, commissionPercentage = 5) {
  return (baseAmount * commissionPercentage) / 100;
}
```

## Payment Flow

### Split Payment Flow

1. **User initiates payment** with total amount
2. **System calculates split**:
   - Base amount (rent/deposit)
   - Commission amount (5% of base)
3. **Create Razorpay order** with transfer configuration
4. **User completes payment** through Razorpay
5. **Automatic transfers**:
   - Commission goes to admin account
   - Base amount goes to owner's bank account
6. **Payment verification** and status update
7. **Webhook confirmation** of transfers

### Property Listing Flow

1. **User attempts to list property**
2. **System validates bank details**:
   - Check if all required fields are present
   - Validate IFSC code format
   - Validate account number format
3. **If validation fails**:
   - Show error message
   - Redirect to profile completion
4. **If validation passes**:
   - Allow property listing
   - Store property with owner's bank details

### Razorpay Transfer Configuration

```javascript
const options = {
  amount: Math.round(totalAmount * 100),
  currency: "INR",
  transfers: [
    {
      account: process.env.ADMIN_RAZORPAY_ACCOUNT_ID,
      amount: Math.round(commissionAmount * 100),
      currency: "INR",
      notes: {
        type: "commission",
        description: "Platform commission",
      },
    },
  ],
};
```

## Frontend Integration

### Using Split Payment Component

```jsx
import PaymentComponent from "./components/PaymentComponent";

<PaymentComponent
  transactionId={123}
  amount={52500} // Total amount including commission
  propertyTitle="Beautiful Apartment"
  enableSplitPayment={true} // Enable split payment
  onPaymentSuccess={(payment) => {
    console.log("Split payment successful:", payment);
  }}
  onPaymentCancel={() => {
    console.log("Payment cancelled");
  }}
/>;
```

### Split Payment Display

The component shows:

- Total amount
- Split payment indicator
- Expandable details showing:
  - Base amount (rent/deposit)
  - Commission amount (5%)
  - Total amount

### Property Listing Form

The form includes:

- Bank details validation before submission
- Error message for missing bank details
- Redirect button to complete profile
- Clear instructions for users

## Property Owner Bank Details

### Required Bank Information

Property owners must provide:

- **Account Number** (9-18 digits)
- **Bank Name** (full bank name)
- **IFSC Code** (4 letters + 0 + 6 alphanumeric)
- **Account Holder Name** (as registered with bank)

### Bank Details Storage

Bank details are stored in the `users` table:

```sql
bank_details JSONB
```

Example:

```json
{
  "account_number": "1234567890",
  "bank_name": "HDFC Bank",
  "ifsc_code": "HDFC0001234",
  "account_holder_name": "John Doe"
}
```

## Error Handling

### Common Error Scenarios

1. **Owner bank details missing**

   - Error: "Property owner bank details not found"
   - Solution: Owner must update profile with bank details

2. **Invalid bank details format**

   - Error: "Invalid IFSC code format" or "Invalid account number format"
   - Solution: Owner must correct bank details format

3. **Amount mismatch**

   - Error: "Total amount mismatch"
   - Solution: Verify base amount + commission = total amount

4. **Property listing without bank details**

   - Error: "Please complete your profile with valid bank details before listing a property"
   - Solution: User must complete profile with bank details

5. **Razorpay transfer failure**
   - Error: Transfer API failure
   - Solution: Check admin account ID and Razorpay configuration

## Testing

### Test Mode Configuration

For testing, use Razorpay test mode:

```env
RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_KEY_SECRET=test_secret_1234567890
ADMIN_RAZORPAY_ACCOUNT_ID=acc_test_1234567890
```

### Test Scenarios

1. **Valid split payment**

   - Base amount: ₹50,000
   - Commission: ₹2,500 (5%)
   - Total: ₹52,500

2. **Missing bank details**

   - Should show error message
   - Guide user to update profile

3. **Invalid bank details format**

   - Should validate IFSC code format
   - Should validate account number format
   - Show specific error messages

4. **Property listing without bank details**

   - Should prevent property listing
   - Show completion message
   - Provide redirect to profile

5. **Amount validation**
   - Verify commission calculation
   - Check total amount consistency

## Security Features

- ✅ Payment signature verification
- ✅ Webhook signature verification
- ✅ Owner bank details validation
- ✅ Commission amount validation
- ✅ Secure transfer configuration
- ✅ Bank details format validation
- ✅ Property listing restrictions

## Monitoring and Logs

### Payment Tracking

Monitor split payments through:

- Payment records with `split_details`
- Razorpay dashboard transfers
- Webhook events for transfer status

### Bank Details Validation

Monitor bank details through:

- User profile completion status
- Property listing attempts
- Validation error logs

### Log Locations

- Payment processing: `razorpayService.js`
- Split calculation: `processSplitPayment()`
- Bank details: `getPropertyOwnerBankDetails()`
- Validation: `validateBankDetails()`
- Property listing: `createProperty()`

## Troubleshooting

### Common Issues

1. **Transfer not processed**

   - Check admin account ID
   - Verify Razorpay account status
   - Review transfer logs

2. **Commission calculation error**

   - Verify commission percentage
   - Check base amount calculation
   - Review transaction details

3. **Bank details not found**

   - Ensure owner has updated profile
   - Check bank_details JSON structure
   - Verify property ownership

4. **Property listing blocked**

   - Check user's bank details completeness
   - Verify bank details format
   - Review validation error messages

5. **Invalid bank details format**
   - Check IFSC code format (4 letters + 0 + 6 alphanumeric)
   - Verify account number length (9-18 digits)
   - Ensure all required fields are filled

### Support

For issues related to:

- **Split Payment Logic**: Check `razorpayService.js`
- **Database Issues**: Review payment records
- **Frontend Display**: Check `PaymentComponent.jsx`
- **Bank Details Validation**: Check `validateBankDetails()`
- **Property Listing**: Check `createProperty()` in propertyController.js
- **Razorpay Integration**: Review Razorpay documentation

## Migration Guide

### From Regular Payments to Split Payments

1. **Run database migration**:

   ```bash
   node scripts/createPaymentTables.js
   ```

2. **Update environment variables**:

   ```env
   ADMIN_RAZORPAY_ACCOUNT_ID=your_admin_account_id
   ```

3. **Update frontend components**:

   - Set `enableSplitPayment={true}` in PaymentComponent
   - Test split payment flow

4. **Verify owner bank details**:

   - Ensure all property owners have bank details
   - Update profiles if needed

5. **Test bank details validation**:
   - Run validation tests
   - Verify property listing restrictions

## Future Enhancements

### Planned Features

1. **Dynamic Commission Rates**

   - Different rates for different property types
   - Seasonal commission adjustments

2. **Multiple Transfer Accounts**

   - Support for multiple admin accounts
   - Regional transfer distribution

3. **Advanced Split Logic**

   - Tax calculations
   - Multiple fee types
   - Custom split percentages

4. **Enhanced Reporting**

   - Commission reports
   - Transfer tracking
   - Revenue analytics

5. **Bank Details Management**

   - Multiple bank accounts per user
   - Bank account verification
   - Automatic bank details validation

6. **Profile Completion Workflow**
   - Step-by-step profile completion
   - Bank details verification
   - Profile completion incentives
