# Database Scripts

This directory contains various database initialization and maintenance scripts.

## Scripts Overview

### Core Initialization
- `initDatabase.js` - Main database initialization script
- `initRoles.js` - Initialize user roles
- `seedUsers.js` - Seed initial users
- `seedProperties.js` - Seed sample properties

### Maintenance Scripts
- `addRoomDetailsColumns.js` - Add room detail columns to existing rooms table
- `addDescriptionColumn.js` - Add description column to properties table
- `runPropertyIdMigration.js` - Migrate property IDs
- `runFavoritesMigration.js` - Migrate user favorites

### Foreign Key Constraint Fix
- `createRoomAvailabilityRequestsTable.js` - Create room_availability_requests table with proper constraints
- `cleanupOrphanedRoomRequests.js` - Clean up orphaned room availability request records

## Foreign Key Constraint Issue Resolution

### Problem
The error `"update or delete on table "rooms" violates foreign key constraint "room_availability_requests_room_id_fkey"` occurs when trying to update properties with floor details because:

1. The `room_availability_requests` table references rooms via foreign key
2. The original update logic deleted and recreated all rooms
3. This violated the foreign key constraint when rooms had pending availability requests

### Solution
1. **Database Schema Fix**: Added proper `room_availability_requests` table definition with `ON DELETE CASCADE`
2. **Update Logic Improvement**: Modified property update to update rooms in place instead of deleting/recreating
3. **Constraint Handling**: Added logic to check for related records before deleting rooms
4. **Error Handling**: Improved frontend error messages for constraint violations

### Running the Fix

1. **Create the missing table** (if not already created):
   ```bash
   node scripts/createRoomAvailabilityRequestsTable.js
   ```

2. **Clean up orphaned records** (if needed):
   ```bash
   node scripts/cleanupOrphanedRoomRequests.js
   ```

3. **Restart the backend server** to use the updated property update logic

### What Changed

#### Backend Changes
- **propertyController.js**: Updated `updateProperty` function to handle rooms more carefully
- **initDatabase.js**: Added `room_availability_requests` table definition
- **New scripts**: Added cleanup and table creation scripts

#### Frontend Changes
- **Update.jsx**: Improved error handling for foreign key constraint violations
- Better user feedback when constraint violations occur

### Prevention
- The new update logic prevents this issue by:
  - Updating existing rooms instead of deleting/recreating
  - Checking for related records before deletion
  - Marking rooms as unavailable instead of deleting when they have related records

## Usage

Run scripts from the backend directory:

```bash
cd backend
node scripts/[script-name].js
```

## Notes

- Always backup your database before running maintenance scripts
- Some scripts may need to be run multiple times if they fail partway through
- Check the console output for any errors or warnings

## Property Seed Script

The `seedProperties.js` script adds sample property data to the MongoDB database. This data includes various property types, locations, and features to help with testing and development.

### How to Run

1. Make sure your MongoDB server is running
2. Ensure your `.env` file has the correct `MONGODB_URI` value
3. Run the following command from the `backend` directory:

```bash
npm run seed:properties
```

### What the Script Does

- Connects to your MongoDB database
- Clears any existing properties in the database
- Adds 10 sample properties with varied:
  - Property types (Apartment, Villa, Studio, Penthouse, House, Commercial, Cottage, Townhouse)
  - Listing types (Rent, Sale)
  - Locations (Mumbai, Bangalore, Pune, Delhi, Goa, Chennai, Hyderabad, Manali)
  - Price ranges
  - Features and amenities
  - Images (using Unsplash URLs)

### Sample Data Structure

Each property includes:
- Basic information (title, subtitle, slug)
- Listing details (type, price, rent type, deposit)
- Location information (address, city, state, zip code)
- Features (bedrooms, bathrooms, area, parking, furnished status)
- Description
- Amenities
- Images
- Status information (active, featured)
- Additional details based on listing type (available from, minimum lease, property age, condition)

This data will help you test all the property-related features of your application, including:
- Property listing pages
- Property detail pages
- Search and filtering functionality
- Featured properties
- Category-based property listings 