const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    riders: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        pickup: {
          address: String,
          location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: [Number] // [lng, lat]
          }
        },
        dropoff: {
          address: String,
          location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: [Number]
          }
        },
        fare: { type: Number, default: 0 }
      }
    ],
    status: {
      type: String,
      enum: ['Requested', 'Matched', 'Accepted', 'OnRoute', 'OnRide', 'Completed', 'Cancelled', 'Expired'],
      default: 'Requested'
    },
    fare: {
      total: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' }
    },
    matchScore: {
      type: Number,
      default: 0
    },
    estimatedDistance: {
      type: Number, // in km
      default: 0
    },
    estimatedDuration: {
      type: Number, // in minutes
      default: 0
    },
    payment: {
      orderId: String,
      paymentId: String,
      signature: String,
      status: {
        type: String,
        enum: ['not_initiated', 'pending', 'completed', 'failed'],
        default: 'not_initiated'
      },
      paidAt: Date
    },
    scheduledFor: {
      type: Date,
      default: null
    },
    isScheduled: {
      type: Boolean,
      default: false
    },
    promoCode: {
      code: String,
      discount: Number,
      originalFare: Number
    }
  },
  { timestamps: true }
);

rideSchema.index({ status: 1, createdAt: -1 });
rideSchema.index({ driverId: 1 });
rideSchema.index({ requesterId: 1 });

module.exports = mongoose.model('Ride', rideSchema);
