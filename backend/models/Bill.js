import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  // References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  // Bill Information
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  billDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  
  // Bill Type
  type: {
    type: String,
    enum: ['Rent', 'Deposit', 'Maintenance', 'Commission', 'Other'],
    required: true
  },
  
  // Amount Details
  amount: {
    baseAmount: {
      type: Number,
      required: true,
      min: [0, 'Base amount cannot be negative']
    },
    taxes: [{
      name: String,
      percentage: Number,
      amount: Number
    }],
    fees: [{
      name: String,
      amount: Number
    }],
    discounts: [{
      name: String,
      type: {
        type: String,
        enum: ['PERCENTAGE', 'FIXED']
      },
      value: Number,
      amount: Number
    }],
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    }
  },
  
  // Payment Details
  payment: {
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Completed', 'Failed', 'Cancelled'],
      default: 'Pending'
    },
    method: {
      type: String,
      enum: ['Wallet', 'Bank', 'Card', 'UPI', 'Cash', 'Other']
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      default: function() {
        return this.amount.totalAmount;
      }
    },
    paidAt: Date,
    paymentDetails: {
      bankName: String,
      accountNumber: String,
      transactionId: String,
      upiId: String,
      cardLast4: String
    }
  },
  
  // Period Information (for recurring bills)
  period: {
    startDate: Date,
    endDate: Date,
    frequency: {
      type: String,
      enum: ['One-time', 'Monthly', 'Quarterly', 'Yearly']
    }
  },
  
  // Additional Information
  items: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  
  // Notes and Terms
  notes: {
    type: String,
    trim: true
  },
  terms: {
    type: String,
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Sent', 'Viewed', 'Paid', 'Cancelled', 'Overdue'],
    default: 'Draft'
  },
  
  // Metadata
  metadata: {
    type: Map,
    of: String
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
  cancelledAt: Date,
  paidAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
billSchema.index({ user: 1, status: 1 });
billSchema.index({ property: 1 });
billSchema.index({ 'payment.status': 1 });
billSchema.index({ billDate: -1 });

// Pre-save middleware to generate bill number
billSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Get the last bill number
    const lastBill = await this.constructor.findOne({}, {}, { sort: { billNumber: -1 } });
    let sequence = '0001';
    
    if (lastBill && lastBill.billNumber) {
      const lastSequence = parseInt(lastBill.billNumber.substr(-4));
      sequence = (lastSequence + 1).toString().padStart(4, '0');
    }
    
    this.billNumber = `BILL${year}${month}${sequence}`;
  }
  next();
});

// Pre-save middleware to calculate totals
billSchema.pre('save', function(next) {
  // Calculate items total
  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      item.amount = item.quantity * item.unitPrice;
    });
  }
  
  // Calculate taxes
  let taxTotal = 0;
  if (this.amount.taxes && this.amount.taxes.length > 0) {
    this.amount.taxes.forEach(tax => {
      tax.amount = (this.amount.baseAmount * tax.percentage) / 100;
      taxTotal += tax.amount;
    });
  }
  
  // Calculate fees
  let feeTotal = 0;
  if (this.amount.fees && this.amount.fees.length > 0) {
    this.amount.fees.forEach(fee => {
      feeTotal += fee.amount;
    });
  }
  
  // Calculate discounts
  let discountTotal = 0;
  if (this.amount.discounts && this.amount.discounts.length > 0) {
    this.amount.discounts.forEach(discount => {
      if (discount.type === 'PERCENTAGE') {
        discount.amount = (this.amount.baseAmount * discount.value) / 100;
      } else {
        discount.amount = discount.value;
      }
      discountTotal += discount.amount;
    });
  }
  
  // Calculate total amount
  this.amount.totalAmount = this.amount.baseAmount + taxTotal + feeTotal - discountTotal;
  
  // Update remaining amount if not paid
  if (this.payment.status !== 'Completed') {
    this.payment.remainingAmount = this.amount.totalAmount - this.payment.paidAmount;
  }
  
  next();
});

// Method to generate PDF
billSchema.methods.generatePDF = async function() {
  // Implementation for PDF generation
  // This would typically use a PDF generation library
};

// Method to send bill via email
billSchema.methods.sendViaEmail = async function(email) {
  // Implementation for sending email
  // This would typically use an email service
};

// Method to record payment
billSchema.methods.recordPayment = async function(amount, paymentMethod, paymentDetails = {}) {
  if (amount <= 0) {
    throw new Error('Payment amount must be positive');
  }
  
  if (amount > this.payment.remainingAmount) {
    throw new Error('Payment amount exceeds remaining amount');
  }
  
  this.payment.paidAmount += amount;
  this.payment.remainingAmount -= amount;
  this.payment.method = paymentMethod;
  this.payment.paymentDetails = { ...this.payment.paymentDetails, ...paymentDetails };
  
  if (this.payment.remainingAmount === 0) {
    this.payment.status = 'Completed';
    this.status = 'Paid';
    this.paidAt = new Date();
  } else {
    this.payment.status = 'Partial';
  }
  
  return this.save();
};

// Static method to get overdue bills
billSchema.statics.getOverdueBills = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    'payment.status': { $in: ['Pending', 'Partial'] },
    status: { $ne: 'Cancelled' }
  });
};

// Static method to get bills by date range
billSchema.statics.getByDateRange = function(startDate, endDate, filter = {}) {
  return this.find({
    billDate: {
      $gte: startDate,
      $lte: endDate
    },
    ...filter
  }).sort({ billDate: -1 });
};

const Bill = mongoose.model('Bill', billSchema);

export default Bill; 