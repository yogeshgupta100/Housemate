import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Property from '../models/propertymodel.js';
import User from '../models/Usermodel.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/housemate';

const propertyTypes = ['PG', 'flat', 'RK', 'house', 'apartment', 'villa'];
const listingTypes = ['sale', 'rent'];
const furnishingTypes = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
const propertyConditions = ['new', 'good', 'average', 'needs_repair'];
const propertyStatuses = ['ready_to_move', 'under_construction', 'renovated'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];
const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal'];

const generateRandomProperty = async () => {
  // First, get a random user to set as owner and creator
  const users = await User.find({ userType: { $in: ['individual', 'corporate'] } });
  if (users.length === 0) {
    throw new Error('No users found to set as property owners. Please seed users first.');
  }
  
  const randomUser = users[Math.floor(Math.random() * users.length)];
  const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
  const listingType = listingTypes[Math.floor(Math.random() * listingTypes.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];
  
  const title = `${type.charAt(0).toUpperCase() + type.slice(1)} for ${listingType} in ${city}`;
  const price = Math.floor(Math.random() * 10000000) + 1000000; // Between 10L and 1Cr
  const sqft = Math.floor(Math.random() * 5000) + 500; // Between 500 and 5500 sqft
  
  return {
    // Basic Information
    title,
    subtitle: `Beautiful ${type} in prime location`,
    slug: title.toLowerCase().replace(/\s+/g, '-'),
    
    // Property Details
    listingType,
    type,
    price,
    rentType: listingType === 'rent' ? 'monthly' : undefined,
    deposit: listingType === 'rent' ? Math.floor(price * 0.1) : undefined,
    
    // Sale-specific fields
    propertyAge: Math.floor(Math.random() * 20),
    propertyCondition: propertyConditions[Math.floor(Math.random() * propertyConditions.length)],
    propertyStatus: propertyStatuses[Math.floor(Math.random() * propertyStatuses.length)],
    
    // Location
    location: `${city}, ${state}`,
    region: state,
    coordinates: {
      latitude: 12.9716 + (Math.random() - 0.5) * 10,
      longitude: 77.5946 + (Math.random() - 0.5) * 10
    },
    address: {
      street: `${Math.floor(Math.random() * 100) + 1} Main Street`,
      city,
      state,
      pincode: Math.floor(100000 + Math.random() * 900000).toString(),
      country: 'India'
    },
    
    // Property Features
    floorArea: sqft,
    sqft,
    floorNo: Math.floor(Math.random() * 20),
    totalFloors: Math.floor(Math.random() * 30) + 5,
    beds: Math.floor(Math.random() * 5) + 1,
    baths: Math.floor(Math.random() * 4) + 1,
    
    // Furnishing and Amenities
    furnishing: furnishingTypes[Math.floor(Math.random() * furnishingTypes.length)],
    amenities: [
      'Parking',
      'Security',
      'Power Backup',
      'Lift',
      'Gym',
      'Swimming Pool',
      'Club House'
    ].slice(0, Math.floor(Math.random() * 7) + 1),
    
    // Commercial Property Features
    balcony: Math.random() > 0.5,
    centralAC: Math.random() > 0.5,
    powerBackup: Math.random() > 0.5,
    lift: Math.random() > 0.5,
    fireSafety: Math.random() > 0.5,
    securityRoom: Math.random() > 0.5,
    pantry: Math.random() > 0.5,
    receptionArea: Math.random() > 0.5,
    officeCabins: Math.floor(Math.random() * 10),
    conferenceRooms: Math.floor(Math.random() * 5),
    openWorkstations: Math.floor(Math.random() * 20),
    showroomArea: Math.floor(Math.random() * 1000),
    storageArea: Math.floor(Math.random() * 500),
    
    // Parking
    carParking: {
      available: Math.random() > 0.3,
      noOfCars: Math.floor(Math.random() * 3) + 1
    },
    bikeParking: {
      available: Math.random() > 0.3,
      noOfBikes: Math.floor(Math.random() * 5) + 1
    },
    
    // Media
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1560449017-7c4a30d9829b',
      'https://images.unsplash.com/photo-1560448204-5f9c0c3f5c0c'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
    
    // Description
    description: `This beautiful ${type} is located in the heart of ${city}. It offers ${sqft} sqft of living space with ${beds} bedrooms and ${baths} bathrooms. The property is ${propertyConditions.join(' ')} and ${propertyStatuses.join(' ')}. It comes with various amenities including ${amenities.slice(0, 3).join(', ')}.`,
    
    // Contact Information
    contact: {
      phone: randomUser.phone,
      email: randomUser.email
    },
    
    // Owner & Creator
    owner: randomUser._id,
    createdBy: randomUser._id,
    
    // Availability
    availability: {
      status: 'Available',
      availableFrom: listingType === 'rent' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
      minLeasePeriod: listingType === 'rent' ? '12 months' : undefined
    },
    
    // Status and Metadata
    status: 'active',
    tag: `${type}-${listingType}`,
    check: Math.random() > 0.5,
    
    // Extras
    views: Math.floor(Math.random() * 1000),
    verified: Math.random() > 0.3,
    featured: Math.random() > 0.7,
    minimumLease: listingType === 'rent' ? 12 : undefined
  };
};

const seedProperties = async (count = 20) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    // Clear existing properties
    await Property.deleteMany({});
    console.log('Cleared existing properties');
    
    // Generate and insert new properties
    const properties = [];
    for (let i = 0; i < count; i++) {
      const property = await generateRandomProperty();
      properties.push(property);
    }
    
    await Property.insertMany(properties);
    console.log(`Successfully seeded ${count} properties`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    return { success: true, message: `Successfully seeded ${count} properties` };
  } catch (error) {
    console.error('Error seeding properties:', error);
    return { success: false, message: error.message };
  }
};

// Run the seed function if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const count = parseInt(process.argv[2]) || 20;
  seedProperties(count)
    .then(result => {
      console.log(result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export default seedProperties; 