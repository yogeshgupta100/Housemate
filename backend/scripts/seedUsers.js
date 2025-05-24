import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import User from '../models/Usermodel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/housemate';

const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Lisa', 'William', 'Mary'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];
const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal'];
const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'];
const userTypes = ['individual', 'corporate', 'dealer'];
const genders = ['male', 'female', 'other', 'prefer_not_to_say'];
const maritalStatuses = ['Bachelor', 'Married', 'Divorced', 'Widowed'];

const generatePhoneNumber = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

const generateEmail = (firstName, lastName) => {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@${domain}`;
};

const generateDateOfBirth = () => {
  const today = new Date();
  const minAge = 18;
  const maxAge = 70;
  const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  return new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
};

const generateRandomUser = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const userType = userTypes[Math.floor(Math.random() * userTypes.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];
  
  const user = {
    firstName,
    lastName,
    email: generateEmail(firstName, lastName),
    password: 'Password123!', // Default password for all users
    phone: generatePhoneNumber(),
    dateOfBirth: generateDateOfBirth(),
    address: {
      street: `${Math.floor(Math.random() * 100) + 1} Main Street`,
      city,
      state,
      zipCode: Math.floor(100000 + Math.random() * 900000).toString(),
      country: 'India'
    },
    profilePicture: 'default-profile.jpg',
    fatherName: `Mr. ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    governmentIdCard: `ID${Math.floor(100000000 + Math.random() * 900000000)}`,
    religion: religions[Math.floor(Math.random() * religions.length)],
    maritalStatus: maritalStatuses[Math.floor(Math.random() * maritalStatuses.length)],
    gender: genders[Math.floor(Math.random() * genders.length)],
    userType,
    role: Math.random() > 0.9 ? 'admin' : 'user', // 10% chance of being admin
    policeVerification: Math.random() > 0.3,
    isEmailVerified: Math.random() > 0.2,
    isPhoneVerified: Math.random() > 0.2,
    verificationStatus: Math.random() > 0.3 ? 'Verified' : 'Unverified',
    isActive: true,
    preferences: {
      notifications: {
        email: Math.random() > 0.1,
        sms: Math.random() > 0.1
      },
      language: 'en'
    }
  };

  // Add corporate-specific fields
  if (userType === 'corporate') {
    user.companyName = `${firstName} ${lastName} Enterprises`;
    user.registrationNumber = `REG${Math.floor(10000000 + Math.random() * 90000000)}`;
    user.companyAddress = {
      street: `${Math.floor(Math.random() * 100) + 1} Corporate Avenue`,
      city,
      state,
      zipCode: Math.floor(100000 + Math.random() * 900000).toString(),
      country: 'India'
    };
    user.companyWebsite = `www.${user.companyName.toLowerCase().replace(/\s+/g, '')}.com`;
    user.companyLogo = 'default-company-logo.jpg';
  }

  // Add dealer-specific fields
  if (userType === 'dealer') {
    user.dealerLicense = `DL${Math.floor(10000000 + Math.random() * 90000000)}`;
    user.dealerSpecialization = ['Residential', 'Commercial', 'Luxury'].slice(0, Math.floor(Math.random() * 3) + 1);
  }

  return user;
};

const seedUsers = async (count = 20) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Generate and insert new users
    const users = [];
    for (let i = 0; i < count; i++) {
      const user = generateRandomUser();
      users.push(user);
    }

    await User.insertMany(users);
    console.log(`Successfully seeded ${count} users`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

    return { success: true, message: `Successfully seeded ${count} users` };
  } catch (error) {
    console.error('Error seeding users:', error);
    return { success: false, message: error.message };
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const count = parseInt(process.argv[2]) || 20;
  seedUsers(count)
    .then(result => {
      console.log(result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export default seedUsers; 