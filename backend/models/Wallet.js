import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  // User Reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Balance Information
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  holdBalance: {
    type: Number,
    default: 0,
    min: [0, 'Hold balance cannot be negative']
  },
  totalCredit: {
    type: Number,
    default: 0,
    min: [0, 'Total credit cannot be negative']
  },
  totalDebit: {
    type: Number,
    default: 0,
    min: [0, 'Total debit cannot be negative']
  },
  
  // Currency
  currency: {
    type: String,
    default: 'INR',
    required: true
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isFrozen: {
    type: Boolean,
    default: false
  },
  
  // Limits
  dailyLimit: {
    type: Number,
    default: 100000
  },
  monthlyLimit: {
    type: Number,
    default: 1000000
  },
  
  // Transaction History Reference
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  
  // Timestamps
  lastTransactionDate: {
    type: Date
  },
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

walletSchema.index({ user: 1 });
walletSchema.index({ isActive: 1 });

walletSchema.methods.credit = async function(amount, description = '') {
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }
  
  this.balance += amount;
  this.totalCredit += amount;
  this.lastTransactionDate = new Date();
  
  // Create transaction record
  await this.model('Transaction').create({
    wallet: this._id,
    user: this.user,
    type: 'CREDIT',
    amount: amount,
    description: description,
    balanceAfter: this.balance
  });
  
  return this.save();
};

walletSchema.methods.debit = async function(amount, description = '') {
  if (amount <= 0) {
    throw new Error('Debit amount must be positive');
  }
  
  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  this.balance -= amount;
  this.totalDebit += amount;
  this.lastTransactionDate = new Date();
  
  // Create transaction record
  await this.model('Transaction').create({
    wallet: this._id,
    user: this.user,
    type: 'DEBIT',
    amount: amount,
    description: description,
    balanceAfter: this.balance
  });
  
  return this.save();
};

walletSchema.methods.hold = async function(amount, description = '') {
  if (amount <= 0) {
    throw new Error('Hold amount must be positive');
  }
  
  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  this.balance -= amount;
  this.holdBalance += amount;
  this.lastTransactionDate = new Date();
  
  // Create transaction record
  await this.model('Transaction').create({
    wallet: this._id,
    user: this.user,
    type: 'HOLD',
    amount: amount,
    description: description,
    balanceAfter: this.balance
  });
  
  return this.save();
};

walletSchema.methods.release = async function(amount, description = '') {
  if (amount <= 0) {
    throw new Error('Release amount must be positive');
  }
  
  if (this.holdBalance < amount) {
    throw new Error('Insufficient hold balance');
  }
  
  this.balance += amount;
  this.holdBalance -= amount;
  this.lastTransactionDate = new Date();
  
  // Create transaction record
  await this.model('Transaction').create({
    wallet: this._id,
    user: this.user,
    type: 'RELEASE',
    amount: amount,
    description: description,
    balanceAfter: this.balance
  });
  
  return this.save();
};

walletSchema.methods.isWithinDailyLimit = async function(amount) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dailyTransactions = await this.model('Transaction').aggregate([
    {
      $match: {
        wallet: this._id,
        createdAt: { $gte: today },
        type: { $in: ['DEBIT', 'HOLD'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  const dailyTotal = dailyTransactions[0]?.total || 0;
  return (dailyTotal + amount) <= this.dailyLimit;
};

walletSchema.methods.isWithinMonthlyLimit = async function(amount) {
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);
  
  const monthlyTransactions = await this.model('Transaction').aggregate([
    {
      $match: {
        wallet: this._id,
        createdAt: { $gte: firstDayOfMonth },
        type: { $in: ['DEBIT', 'HOLD'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  const monthlyTotal = monthlyTransactions[0]?.total || 0;
  return (monthlyTotal + amount) <= this.monthlyLimit;
};

walletSchema.methods.getTransactionHistory = function(limit = 10, skip = 0) {
  return this.model('Transaction').find({
    wallet: this._id
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

const Wallet = mongoose.model('Wallet', walletSchema);

export default Wallet; 