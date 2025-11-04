const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

chatMessageSchema.index({ rideId: 1, createdAt: 1 });
chatMessageSchema.index({ senderId: 1, receiverId: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
