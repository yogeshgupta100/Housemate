import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
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
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: [true, 'Role is required']
    },
    userType: {
        type: String,
        required: [true, 'User type is required'],
        enum: ['individual', 'corporate', 'dealer', 'admin'],
        default: 'individual'
    },
    // Corporate user fields
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
    // Dealer user fields
    dealerLicense: {
        type: String,
        required: function() {
            return this.userType === 'dealer';
        }
    },
    // Address fields
    address: {
        city: { type: String },
        state: { type: String }
    },
    
    // Security and Authentication
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationToken: String,
    lastLogin: Date,
    passwordChangedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


UserSchema.methods.hasPermission = async function(permission) {
    await this.populate('role');
    return this.role.permissions.includes(permission);
};

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ userType: 1 });
UserSchema.index({ 'address.city': 1, 'address.state': 1 });

// Virtual for full name
UserSchema.virtual('name').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Update passwordChangedAt when password is changed
UserSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// Validate user type specific fields
UserSchema.pre('validate', function(next) {
    if (this.userType === 'corporate') {
        if (!this.companyName || !this.registrationNumber) {
            return next(new Error('Company name and registration number are required for corporate users'));
        }
    }
    if (this.userType === 'dealer') {
        if (!this.dealerLicense) {
            return next(new Error('Dealer license is required for dealer users'));
        }
    }
    next();
});

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to generate JWT token
UserSchema.methods.generateAuthToken = function() {
    try {
        return jwt.sign(
            {
                id: this._id,
                userType: this.userType,
                role: this.role,
                email: this.email
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
    } catch (error) {
        throw new Error('Token generation failed');
    }
};

// Method to check if password was changed after token was issued
UserSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Method to get user's active properties
UserSchema.methods.getActiveProperties = function() {
    return this.model('Property').find({
        owner: this._id,
        status: 'Active'
    });
};

// Method to check if user is admin
UserSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

UserSchema.methods.isDealer = function() {
    return this.userType === 'dealer';
};

UserSchema.methods.isCorporate = function() {
    return this.userType === 'corporate';
};

// Method to safely return user data (excluding sensitive information)
UserSchema.methods.toSafeObject = function() {
    return {
        id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        phone: this.phone,
        gender: this.gender,
        role: this.role,
        userType: this.userType,
        address: this.address,
        companyName: this.companyName,
        createdAt: this.createdAt
    };
};

const User = mongoose.model('User', UserSchema);

export default User;
