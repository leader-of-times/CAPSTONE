const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    type: {
      type: String,
      enum: ['driver-to-student', 'student-to-driver'],
      required: true
    }
  },
  { timestamps: true }
);

reviewSchema.index({ rideId: 1, reviewerId: 1 }, { unique: true });
reviewSchema.index({ revieweeId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
