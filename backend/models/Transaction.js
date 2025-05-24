import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  // References
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Transaction Details
  type: {
    type: String,
    enum: ['CREDIT', 'DEBIT', 'HOLD', 'RELEASE', 'REFUND'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  
  // Transaction Information
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Rent', 'Deposit', 'Refund', 'Commission', 'Other'],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Cancelled'],
    default: 'Completed'
  },
  
  // Reference Information
  referenceId: {
    type: String,
    trim: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  bill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill'
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['Wallet', 'Bank', 'Card', 'UPI', 'Cash', 'Other'],
    default: 'Wallet'
  },
  paymentDetails: {
    bankName: String,
    accountNumber: String,
    transactionId: String,
    upiId: String,
    cardLast4: String
  },
  
  // Metadata
  metadata: {
    type: Map,
    of: String
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  failedAt: Date,
  cancelledAt: Date
}, {
  timestamps: true
});

transactionSchema.index({ wallet: 1, createdAt: -1 });
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ referenceId: 1 });

transactionSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    switch (this.status) {
      case 'Completed':
        this.completedAt = Date.now();
        break;
      case 'Failed':
        this.failedAt = Date.now();
        break;
      case 'Cancelled':
        this.cancelledAt = Date.now();
        break;
    }
  }
  next();
});

transactionSchema.methods.getReceipt = async function() {
  const receipt = {
    transactionId: this._id,
    referenceId: this.referenceId,
    date: this.createdAt,
    type: this.type,
    amount: this.amount,
    currency: this.currency,
    status: this.status,
    description: this.description,
    category: this.category,
    paymentMethod: this.paymentMethod
  };
  
  // Populate user details
  await this.populate('user', 'firstName lastName email');
  receipt.user = {
    name: `${this.user.firstName} ${this.user.lastName}`,
    email: this.user.email
  };
  
  // Populate property details if exists
  if (this.property) {
    await this.populate('property', 'title location');
    receipt.property = {
      title: this.property.title,
      location: this.property.location
    };
  }
  
  return receipt;
};

transactionSchema.statics.getByDateRange = function(startDate, endDate, filter = {}) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    },
    ...filter
  }).sort({ createdAt: -1 });
};

transactionSchema.statics.getStatistics = async function(filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction; 