import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^[0-9]{10}$/, 'Invalid phone number']
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    userType: {
        type: String,
        required: true,
        enum: ['individual', 'corporate', 'dealer', 'admin'],
        default: 'individual'
    },
    companyName: {
        type: String,
        trim: true
    },
    registrationNumber: {
        type: String,
        trim: true
    },
    dealerLicense: {
        type: String
    },
    address: {
        city: String,
        state: String
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationToken: String,
    lastLogin: Date,
    passwordChangedAt: Date,
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property'
    }],
    bio: {
        type: String,
        trim: true
    },
}, {
    timestamps: true
});

// Hash password before save
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const User = mongoose.model('User', UserSchema);
export default User;
