import mongoose from 'mongoose';

const threeDMappingRequestSchema = new mongoose.Schema({
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
  
  // Request Information
  requestNumber: {
    type: String,
    unique: true
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  
  // Mapping Details
  mappingType: {
    type: String,
    enum: ['Full Interior', 'Full Exterior', 'Interior + Exterior', 'Floor Plan', 'Custom'],
    required: true
  },
  customRequirements: {
    type: String,
    trim: true
  },
  specialInstructions: {
    type: String,
    trim: true
  },
  
  // Scheduling
  preferredDate: {
    type: Date
  },
  preferredTimeSlot: {
    type: String,
    enum: ['Morning (9AM-12PM)', 'Afternoon (12PM-3PM)', 'Evening (3PM-6PM)', 'Flexible']
  },
  isFlexible: {
    type: Boolean,
    default: false
  },
  
  // Access Information
  accessInstructions: {
    type: String,
    trim: true
  },
  contactPerson: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Rejected'],
    default: 'Pending'
  },
  
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDate: {
    type: Date
  },
  
  // Completion Details
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  },
  completionNotes: {
    type: String,
    trim: true
  },
  
  // Deliverables
  deliverables: {
    modelUrl: {
      type: String
    },
    thumbnailUrl: {
      type: String
    },
    downloadUrl: {
      type: String
    },
    format: {
      type: String,
      enum: ['OBJ', 'FBX', 'GLB', 'GLTF', 'Other']
    },
    resolution: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Ultra High']
    },
    fileSize: {
      type: Number
    },
    estimatedRenderTime: {
      type: Number
    }
  },
  
  // Pricing
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: [0, 'Base price cannot be negative']
    },
    additionalCharges: [{
      description: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'Additional charge cannot be negative']
      }
    }],
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative']
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Partial', 'Completed', 'Refunded'],
      default: 'Pending'
    },
    paidAmount: {
      type: Number,
      default: 0
    }
  },
  
  // Feedback
  userFeedback: {
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      trim: true
    },
    submittedAt: {
      type: Date
    }
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
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
threeDMappingRequestSchema.index({ user: 1, status: 1 });
threeDMappingRequestSchema.index({ property: 1 });
threeDMappingRequestSchema.index({ status: 1 });
threeDMappingRequestSchema.index({ assignedTo: 1 });
threeDMappingRequestSchema.index({ requestDate: -1 });

// Pre-save middleware to generate request number
threeDMappingRequestSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Get the last request number
    const lastRequest = await this.constructor.findOne({}, {}, { sort: { requestNumber: -1 } });
    let sequence = '0001';
    
    if (lastRequest && lastRequest.requestNumber) {
      const lastSequence = parseInt(lastRequest.requestNumber.substr(-4));
      sequence = (lastSequence + 1).toString().padStart(4, '0');
    }
    
    this.requestNumber = `3DM${year}${month}${sequence}`;
  }
  next();
});

// Pre-save middleware to calculate total price
threeDMappingRequestSchema.pre('save', function(next) {
  if (this.isModified('pricing')) {
    let total = this.pricing.basePrice;
    
    // Add additional charges
    if (this.pricing.additionalCharges && this.pricing.additionalCharges.length > 0) {
      this.pricing.additionalCharges.forEach(charge => {
        total += charge.amount;
      });
    }
    
    // Apply discount
    if (this.pricing.discount && this.pricing.discount > 0) {
      total = total - (total * this.pricing.discount / 100);
    }
    
    this.pricing.totalPrice = total;
  }
  next();
});

// Method to assign the request to a user
threeDMappingRequestSchema.methods.assign = async function(userId) {
  this.assignedTo = userId;
  this.assignedDate = new Date();
  this.status = 'Scheduled';
  return this.save();
};

// Method to mark the request as completed
threeDMappingRequestSchema.methods.complete = async function(userId, notes = '') {
  this.completedBy = userId;
  this.completedAt = new Date();
  this.completionNotes = notes;
  this.status = 'Completed';
  return this.save();
};

// Method to cancel the request
threeDMappingRequestSchema.methods.cancel = async function() {
  this.status = 'Cancelled';
  this.cancelledAt = new Date();
  return this.save();
};

// Method to record payment
threeDMappingRequestSchema.methods.recordPayment = async function(amount) {
  if (amount <= 0) {
    throw new Error('Payment amount must be positive');
  }
  
  this.pricing.paidAmount += amount;
  
  if (this.pricing.paidAmount >= this.pricing.totalPrice) {
    this.pricing.paymentStatus = 'Completed';
  } else if (this.pricing.paidAmount > 0) {
    this.pricing.paymentStatus = 'Partial';
  }
  
  return this.save();
};

// Static method to get pending requests
threeDMappingRequestSchema.statics.getPendingRequests = function() {
  return this.find({
    status: 'Pending'
  }).sort({ requestDate: 1 });
};

// Static method to get requests by date range
threeDMappingRequestSchema.statics.getByDateRange = function(startDate, endDate, filter = {}) {
  return this.find({
    requestDate: {
      $gte: startDate,
      $lte: endDate
    },
    ...filter
  }).sort({ requestDate: -1 });
};

const ThreeDMappingRequest = mongoose.model('ThreeDMappingRequest', threeDMappingRequestSchema);

export default ThreeDMappingRequest; 