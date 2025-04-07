import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minLength: [5, 'Title must be at least 5 characters'],
    maxLength: [100, 'Title cannot be more than 100 characters']
  },
  subtitle: {
    type: String,
    trim: true,
    maxLength: [200, 'Subtitle cannot be more than 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  
  // Property Details
  listingType: {
    type: String,
    required: [true, 'Listing type is required'],
    enum: ['sale', 'rent'],
    lowercase: true
  },
  type: {
    type: String,
    required: [true, 'Property type is required'],
    enum: ['PG', 'flat', 'RK', 'house', 'apartment', 'villa'],
    lowercase: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  rentType: {
    type: String,
    enum: ['monthly', 'yearly', 'daily'],
    default: 'monthly',
    lowercase: true
  },
  deposit: {
    type: Number,
    min: [0, 'Deposit cannot be negative']
  },
  
  // Sale-specific fields
  propertyAge: {
    type: Number,
    min: [0, 'Property age cannot be negative']
  },
  propertyCondition: {
    type: String,
    enum: ['new', 'good', 'average', 'needs_repair'],
    default: 'good',
    lowercase: true
  },
  propertyStatus: {
    type: String,
    enum: ['ready_to_move', 'under_construction', 'renovated'],
    default: 'ready_to_move',
    lowercase: true
  },
  
  // Location
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  region: {
    type: String,
    trim: true
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    }
  },
  
  // Property Features
  floorArea: {
    type: Number,
    required: [true, 'Floor area is required'],
    min: [0, 'Floor area cannot be negative']
  },
  sqft: {
    type: Number,
    required: [true, 'Square footage is required'],
    min: [0, 'Square footage cannot be negative']
  },
  floorNo: {
    type: Number,
    min: [0, 'Floor number cannot be negative']
  },
  totalFloors: {
    type: Number,
    min: [1, 'Total floors must be at least 1']
  },
  beds: {
    type: Number,
    required: [true, 'Number of beds is required'],
    min: [0, 'Number of beds cannot be negative']
  },
  baths: {
    type: Number,
    required: [true, 'Number of baths is required'],
    min: [0, 'Number of baths cannot be negative']
  },
  
  // Furnishing and Amenities
  furnishing: {
    type: String,
    enum: ['Furnished', 'Semi-Furnished', 'Unfurnished'],
    default: 'Unfurnished'
  },
  amenities: {
    type: [String],
    required: [true, 'At least one amenity is required'],
    default: []
  },
  
  // Commercial Property Features
  balcony: {
    type: Boolean,
    default: false
  },
  centralAC: {
    type: Boolean,
    default: false
  },
  powerBackup: {
    type: Boolean,
    default: false
  },
  lift: {
    type: Boolean,
    default: false
  },
  fireSafety: {
    type: Boolean,
    default: false
  },
  securityRoom: {
    type: Boolean,
    default: false
  },
  pantry: {
    type: Boolean,
    default: false
  },
  receptionArea: {
    type: Boolean,
    default: false
  },
  officeCabins: {
    type: Number,
    min: [0, 'Number of office cabins cannot be negative']
  },
  conferenceRooms: {
    type: Number,
    min: [0, 'Number of conference rooms cannot be negative']
  },
  openWorkstations: {
    type: Number,
    min: [0, 'Number of open workstations cannot be negative']
  },
  showroomArea: {
    type: Number,
    min: [0, 'Showroom area cannot be negative']
  },
  storageArea: {
    type: Number,
    min: [0, 'Storage area cannot be negative']
  },
  
  // Parking
  carParking: {
    available: {
      type: Boolean,
      default: false
    },
    noOfCars: {
      type: Number,
      min: [0, 'Number of car parking spaces cannot be negative']
    }
  },
  bikeParking: {
    available: {
      type: Boolean,
      default: false
    },
    noOfBikes: {
      type: Number,
      min: [0, 'Number of bike parking spaces cannot be negative']
    }
  },
  
  // Media
  images: {
    type: [String],
    required: [true, 'At least one image is required'],
    validate: [arr => arr.length > 0, 'At least one image is required']
  },
  imageUrl: {
    type: String
  },
  
  // Description
  description: {
    type: String,
    required: [true, 'Description is required'],
    minLength: [50, 'Description must be at least 50 characters'],
    maxLength: [2000, 'Description cannot be more than 2000 characters']
  },
  
  // Contact Information
  contact: {
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true
    }
  },
  
  // Owner & Creator
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner information is required']
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'Creator information is required']
  },
  threeDMappingRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ThreeDMappingRequest'
  }],
  threeDModel: {
    modelUrl: String,
    thumbnailUrl: String,
    lastUpdated: Date
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'Creator information is required']
  },
  
  // Availability
  availability: {
    status: {
      type: String,
      required: [true, 'Availability status is required'],
      enum: ['Available', 'Rented', 'Pending', 'Unavailable', 'Sold'],
      default: 'Available'
    },
    availableFrom: {
      type: Date,
      required: function() {
        return this.listingType === 'Rent';
      }
    },
    minLeasePeriod: {
      type: String,
      default: '12 months',
      required: function() {
        return this.listingType === 'Rent';
      }
    }
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['active', 'inactive', 'sold', 'rented'],
    default: 'active',
    lowercase: true
  },
  tag: {
    type: String,
    trim: true
  },
  check: {
    type: Boolean,
    default: false
  },
  
  // Extras
  views: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  scheduledVisits: [{
    date: Date,
    visitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending'
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  featured: {
    type: Boolean,
    default: false
  },
  minimumLease: {
    type: Number,
    min: [1, 'Minimum lease must be at least 1 month']
  }
}, {
  timestamps: true
});

// Pre-save hook to update updatedAt
propertySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (!this.isModified('title')) {
    next();
    return;
  }

  this.slug = this.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
  
  next();
});

// Add index for better search performance
propertySchema.index({ title: 'text', description: 'text', 'address.city': 'text' });
propertySchema.index({ listingType: 1, type: 1, 'availability.status': 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ 'address.city': 1, 'address.state': 1 });
propertySchema.index({ featured: 1, status: 1 });
propertySchema.index({ createdBy: 1 });

// Method to check if property is available
propertySchema.methods.isAvailable = function() {
  return this.availability.status === 'Available';
};

// Method to calculate price per square foot
propertySchema.methods.getPricePerSqft = function() {
  if (this.sqft && this.sqft > 0) {
    return this.price / this.sqft;
  }
  return 0;
};

// Method to get similar properties
propertySchema.methods.getSimilarProperties = function() {
  return this.model('Property').find({
    listingType: this.listingType,
    type: this.type,
    'address.city': this.address.city,
    _id: { $ne: this._id },
    'availability.status': 'Available'
  }).limit(5);
};

// Method to get rental properties
propertySchema.statics.getRentalProperties = function() {
  return this.find({
    listingType: 'Rent',
    'availability.status': 'Available',
    status: 'Active'
  });
};

// Method to get properties for sale
propertySchema.statics.getPropertiesForSale = function() {
  return this.find({
    listingType: 'Sale',
    'availability.status': 'Available',
    status: 'Active'
  });
};

const Property = mongoose.model('Property', propertySchema);

export default Property; 