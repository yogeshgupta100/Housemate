import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  // Basic Information
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Coupon title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Discount Information
  type: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED', 'CASHBACK'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: [0, 'Discount value cannot be negative']
  },
  maxDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative']
  },
  minPurchase: {
    type: Number,
    default: 0,
    min: [0, 'Minimum purchase amount cannot be negative']
  },
  
  // Validity
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  
  // Usage Limits
  maxUses: {
    type: Number,
    default: null
  },
  usesPerUser: {
    type: Number,
    default: 1
  },
  currentUses: {
    type: Number,
    default: 0
  },
  
  // Applicability
  userType: [{
    type: String,
    enum: ['Admin', 'Dealer', 'Corporate', 'User']
  }],
  propertyTypes: [{
    type: String,
    enum: ['Apartment', 'House', 'Condo', 'Studio', 'Commercial Floor', 'Building', 'Office Space', 'Business Outlet', 'Other']
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Usage History
  usageHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    discountAmount: Number,
    transactionAmount: Number
  }],
  
  // Creator Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

couponSchema.index({ isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });

couponSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (this.maxUses === null || this.currentUses < this.maxUses)
  );
};

couponSchema.methods.canUserUse = function(userId) {
  if (!this.isValid()) return false;
  
  const userUses = this.usageHistory.filter(
    usage => usage.user.toString() === userId.toString()
  ).length;
  
  return userUses < this.usesPerUser;
};

couponSchema.methods.calculateDiscount = function(amount) {
  if (!this.isValid() || amount < this.minPurchase) return 0;
  
  let discount = 0;
  switch (this.type) {
    case 'PERCENTAGE':
      discount = (amount * this.value) / 100;
      break;
    case 'FIXED':
      discount = this.value;
      break;
    case 'CASHBACK':
      discount = this.value;
      break;
  }
  
  if (this.maxDiscount) {
    discount = Math.min(discount, this.maxDiscount);
  }
  
  return Math.min(discount, amount);
};

couponSchema.methods.use = async function(userId, propertyId, amount) {
  if (!this.canUserUse(userId)) {
    throw new Error('Coupon cannot be used');
  }
  
  const discount = this.calculateDiscount(amount);
  
  this.usageHistory.push({
    user: userId,
    property: propertyId,
    discountAmount: discount,
    transactionAmount: amount
  });
  
  this.currentUses += 1;
  
  if (this.maxUses && this.currentUses >= this.maxUses) {
    this.isActive = false;
  }
  
  return this.save();
};

couponSchema.statics.getValidCoupons = function(userId, userType, propertyType) {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { maxUses: null },
      { currentUses: { $lt: '$maxUses' } }
    ],
    $or: [
      { userType: { $exists: false } },
      { userType: userType }
    ],
    $or: [
      { propertyTypes: { $exists: false } },
      { propertyTypes: propertyType }
    ]
  });
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon; 