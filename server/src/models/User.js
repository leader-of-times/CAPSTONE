const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ['student', 'driver'],
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      sparse: true
    },
    phoneVerified: {
      type: Boolean,
      default: false
    },
    // Driver-specific fields
    vehicleInfo: {
      model: String,
      plateNumber: String,
      color: String,
      capacity: { type: Number, default: 4 }
    },
    // Current status
    currentStatus: {
      online: { type: Boolean, default: false },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0]
        }
      },
      updatedAt: Date
    },
    // Ratings
    rating: {
      count: { type: Number, default: 0 },
      avg: { type: Number, default: 5.0 }
    },
    // Wallet (simulated)
    wallet: {
      balance: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

// Index for geospatial queries
userSchema.index({ 'currentStatus.location': '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
