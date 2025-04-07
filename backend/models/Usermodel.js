import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
    // Basic Information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minLength: [2, 'First name must be at least 2 characters'],
        maxLength: [50, 'First name cannot be more than 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minLength: [2, 'Last name must be at least 2 characters'],
        maxLength: [50, 'Last name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function(v) {
                return v <= new Date();
            },
            message: 'Date of birth cannot be in the future'
        }
    },
    
    // Address Information
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, trim: true }
    },
    
    // Profile Information
    profilePicture: {
        type: String,
        default: 'default-profile.jpg'
    },
    fatherName: {
        type: String,
        trim: true
    },
    governmentIdCard: {
        type: String,
        trim: true
    },
    religion: {
        type: String,
        trim: true
    },
    maritalStatus: {
        type: String,
        enum: ['Bachelor', 'Married', 'Divorced', 'Widowed'],
        default: 'Bachelor'
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    
    // User Type and Role
    userType: {
        type: String,
        required: [true, 'User type is required'],
        enum: ['individual', 'corporate', 'dealer'],
        default: 'individual'
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    
    // Verification and Status
    policeVerification: {
        type: Boolean,
        default: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['Verified', 'Unverified', 'Pending'],
        default: 'Unverified'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Corporate/Dealer Specific Fields
    companyName: {
        type: String,
        trim: true,
        required: function() {
            return this.userType === 'corporate';
        }
    },
    registrationNumber: {
        type: String,
        trim: true,
        required: function() {
            return this.userType === 'corporate';
        }
    },
    companyAddress: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, trim: true }
    },
    companyWebsite: {
        type: String,
        trim: true
    },
    companyLogo: {
        type: String
    },
    
    // Dealer Specific Fields
    dealerLicense: {
        type: String,
        trim: true,
        required: function() {
            return this.userType === 'dealer';
        }
    },
    dealerSpecialization: {
        type: [String],
        default: []
    },
    
    // Security and Authentication
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationToken: String,
    lastLogin: Date,
    passwordChangedAt: Date,
    
    // Preferences
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: true }
        },
        language: {
            type: String,
            default: 'en'
        }
    },
    
    // References
    properties: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property'
    }],
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property'
    }],
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet'
    },
    threeDMappingRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ThreeDMappingRequest'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String
}, {
    timestamps: true
});

// Indexes for better query performance
UserSchema.index({ phone: 1 });
UserSchema.index({ userType: 1 });
UserSchema.index({ 'address.city': 1, 'address.state': 1 });

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Update passwordChangedAt when password is changed
UserSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();
    
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change
    next();
});

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Validate user type specific fields
UserSchema.pre('validate', function(next) {
    if (this.userType === 'corporate' && (!this.companyName || !this.registrationNumber)) {
        next(new Error('Company name and registration number are required for corporate users'));
    }
    if (this.userType === 'dealer' && !this.dealerLicense) {
        next(new Error('Dealer license is required for dealer users'));
    }
    next();
});

// Method to generate JWT token
UserSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { id: this._id, userType: this.userType, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// Method to check if password was changed after token was issued
UserSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Method to get user's active properties
UserSchema.methods.getActiveProperties = function() {
    return this.model('Property').find({
        owner: this._id,
        status: 'Active'
    });
};

// Method to check if user is admin
UserSchema.methods.isAdmin = function() {
    return this.userType === 'admin' || this.role === 'admin';
};

// Method to check if user is dealer
UserSchema.methods.isDealer = function() {
    return this.userType === 'dealer';
};

// Method to check if user is corporate
UserSchema.methods.isCorporate = function() {
    return this.userType === 'corporate';
};

const User = mongoose.model('User', UserSchema);

export default User;
