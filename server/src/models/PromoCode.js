const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    maxDiscount: {
      type: Number,
      default: null
    },
    minFare: {
      type: Number,
      default: 0
    },
    validFrom: {
      type: Date,
      required: true
    },
    validUntil: {
      type: Date,
      required: true
    },
    maxUses: {
      type: Number,
      default: null
    },
    usedCount: {
      type: Number,
      default: 0
    },
    usersUsed: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ validFrom: 1, validUntil: 1 });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
