# Transaction and Property Expiration System

This document outlines the implementation of the transaction and property expiration system for the Housemate platform.

## Overview

The system automatically manages the lifecycle of rental transactions and properties based on lease periods. Transactions and properties are automatically hidden from user panels once their lease period expires.

## Key Features

### 1. Transaction Expiration

- **Automatic Expiration**: Transactions are marked as expired when their lease end date passes
- **Filtered Display**: Only active, non-expired transactions are shown in user panels
- **Status Tracking**: Transactions maintain their original status but are hidden when expired

### 2. Property Expiration

- **Rent Properties**: Only shown if user has active, non-expired transactions
- **Sale Properties**: Always visible (no expiration)
- **Automatic Filtering**: Properties disappear from user panel when all related transactions expire

### 3. Lease Period Management

- **Flexible Periods**: Support for various lease periods (1 month to 3 years)
- **Automatic Calculation**: Lease end dates are calculated based on move-in date and lease period
- **Default Period**: 11 months if not specified

## Database Changes

### New Columns in Transactions Table

```sql
-- Lease period information
ALTER TABLE transactions ADD COLUMN lease_period VARCHAR(50) DEFAULT '11 months';
ALTER TABLE transactions ADD COLUMN lease_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE transactions ADD COLUMN is_expired BOOLEAN DEFAULT false;

-- Indexes for performance
CREATE INDEX idx_transactions_lease_end_date ON transactions(lease_end_date);
CREATE INDEX idx_transactions_is_expired ON transactions(is_expired);
```

### Migration Script

Run the migration script to add the new columns:

```bash
node backend/scripts/addLeasePeriodColumns.js
```

## Implementation Details

### 1. Lease Utilities (`backend/utils/leaseUtils.js`)

Utility functions for lease calculations and expiration checks:

- `calculateLeaseEndDate(moveInDate, leasePeriod)`: Calculate lease end date
- `isTransactionExpired(leaseEndDate)`: Check if transaction is expired
- `isTransactionVisible(transaction)`: Check if transaction should be visible
- `isPropertyVisible(property, userTransactions)`: Check if property should be visible
- `updateExpiredTransactions(pool)`: Update expired transactions in database

### 2. Transaction Model Updates (`backend/models/Transaction.js`)

Enhanced transaction model with:

- **Lease Period Support**: Automatic calculation of lease end dates
- **Expiration Filtering**: Filter out expired transactions
- **Status Management**: Maintain transaction status while handling expiration

### 3. Transaction Controller Updates (`backend/controllers/transactionController.js`)

Updated controller methods:

- **createTransaction**: Includes lease period and end date calculation
- **getTransactionsByUser**: Filters out expired transactions
- **mapTenantToRoom**: Includes lease period for admin mapping
- **updateExpiredTransactions**: New endpoint to update expired transactions

### 4. Property Controller Updates (`backend/controllers/propertyController.js`)

Updated `getPropertiesByUser` to filter properties based on active transactions:

- **Sale Properties**: Always visible
- **Rent Properties**: Only visible if user has active, non-expired transactions

## Frontend Updates

### 1. Transaction Display (`frontend/src/components/customerPanel/transactions/TransactionCard.jsx`)

Enhanced transaction cards showing:

- **Lease Information**: Move-in date, lease period, and end date
- **Expiration Status**: Visual indicators for expired transactions
- **Status Labels**: Proper status display for different transaction states

### 2. Property Detail (`frontend/src/components/properties/propertydetail.jsx`)

Updated to include lease period when creating transactions:

- **Lease Period**: Automatically set from property availability
- **Transaction Creation**: Includes lease period in transaction data

### 3. Admin Panel (`admin/src/components/PropertyDetails.jsx`)

Updated tenant mapping to include lease period:

- **Lease Period**: Automatically set from property availability
- **Admin Mapping**: Includes lease period when mapping tenants

## API Endpoints

### New Endpoints

```
POST /api/transactions/update-expired
```

Updates expired transactions in the database.

### Updated Endpoints

```
GET /api/transactions/user/:userId
```

Now filters out expired transactions and only returns active ones.

```
GET /api/properties/user/:userId
```

Now filters out properties where user's transactions have expired.

## Automatic Expiration Management

### 1. Cron Job Script (`backend/scripts/updateExpiredTransactions.js`)

Automated script to update expired transactions:

```bash
# Run manually
node backend/scripts/updateExpiredTransactions.js

# Set up cron job (daily at 2 AM)
0 2 * * * /usr/bin/node /path/to/housemate/backend/scripts/updateExpiredTransactions.js
```

### 2. Manual Update Endpoint

```bash
POST /api/transactions/update-expired
Authorization: Bearer <token>
```

## Lease Period Options

Supported lease periods:

- 1 month
- 3 months
- 6 months
- 11 months (default)
- 1 year
- 2 years
- 3 years

## User Experience

### 1. Transactions Page

- **Active Transactions**: Only shows non-expired transactions with valid statuses
- **Lease Information**: Displays move-in date, lease period, and end date
- **Expiration Warnings**: Visual indicators for transactions nearing expiration

### 2. Properties Page

- **Rent Properties**: Only visible if user has active transactions
- **Sale Properties**: Always visible
- **Automatic Removal**: Properties disappear when transactions expire

### 3. Admin Panel

- **Tenant Mapping**: Includes lease period information
- **Transaction Management**: Can view all transactions including expired ones
- **Property Management**: Full access to all properties

## Status Flow

### Transaction Statuses

1. **pending**: Initial state, awaiting payment/confirmation
2. **active**: Payment completed, lease is active
3. **completed**: Lease period completed successfully
4. **failed**: Payment failed or transaction cancelled
5. **cancelled**: Transaction was cancelled

### Expiration Logic

- Transactions are marked as `is_expired = true` when `lease_end_date < current_date`
- Expired transactions are filtered out from user-facing APIs
- Original status is preserved for admin/audit purposes

## Security Considerations

1. **Data Integrity**: Lease end dates are calculated server-side
2. **Access Control**: Users can only see their own transactions
3. **Admin Access**: Admins can view all transactions including expired ones
4. **Audit Trail**: Original transaction data is preserved

## Testing

### Test Cases

1. **Transaction Creation**: Verify lease end date calculation
2. **Expiration Updates**: Test automatic expiration marking
3. **Filtering**: Verify expired transactions are hidden
4. **Property Visibility**: Test property filtering based on transactions
5. **Admin Access**: Verify admin can see all transactions

### Test Data

```javascript
// Test transaction with 1 month lease
const testTransaction = {
  property_id: 1,
  user_id: 1,
  move_in_date: "2024-01-01",
  lease_period: "1 month",
  // Expected lease_end_date: '2024-02-01'
};

// Test expired transaction
const expiredTransaction = {
  move_in_date: "2023-01-01",
  lease_period: "11 months",
  // Expected lease_end_date: '2023-12-01' (expired)
};
```

## Deployment

### 1. Database Migration

```bash
# Run migration script
node backend/scripts/addLeasePeriodColumns.js
```

### 2. Update Application

```bash
# Deploy updated backend
# Deploy updated frontend
# Deploy updated admin panel
```

### 3. Set Up Cron Job

```bash
# Add to crontab
0 2 * * * /usr/bin/node /path/to/housemate/backend/scripts/updateExpiredTransactions.js
```

## Monitoring

### Logs to Monitor

- Transaction creation logs
- Expiration update logs
- API access logs for transaction endpoints

### Metrics to Track

- Number of active transactions
- Number of expired transactions
- Transaction completion rates
- Property visibility changes

## Troubleshooting

### Common Issues

1. **Transactions Not Expiring**

   - Check cron job is running
   - Verify lease end date calculation
   - Check database indexes

2. **Properties Not Filtering**

   - Verify transaction status
   - Check property listing type
   - Review user transaction queries

3. **Lease End Date Issues**
   - Verify lease period format
   - Check date calculation logic
   - Review timezone handling

### Debug Commands

```bash
# Check expired transactions
SELECT * FROM transactions WHERE is_expired = true;

# Check transactions expiring soon
SELECT * FROM transactions
WHERE lease_end_date < CURRENT_TIMESTAMP + INTERVAL '30 days'
AND is_expired = false;

# Manual expiration update
curl -X POST /api/transactions/update-expired \
  -H "Authorization: Bearer <token>"
```

## Future Enhancements

1. **Notification System**: Alert users before lease expiration
2. **Renewal Process**: Automatic lease renewal options
3. **Advanced Filtering**: More granular transaction filtering
4. **Analytics Dashboard**: Transaction lifecycle analytics
5. **Bulk Operations**: Admin tools for bulk transaction management
