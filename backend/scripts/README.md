# Database Seed Scripts

This directory contains scripts to seed the database with sample data for development and testing purposes.

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