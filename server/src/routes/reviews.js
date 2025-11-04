const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Review = require('../models/Review');
const User = require('../models/User');
const Ride = require('../models/Ride');

router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { rideId, revieweeId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'Completed') {
      return res.status(400).json({ message: 'Can only review completed rides' });
    }

    const isRider = ride.riders.some(r => r.userId.toString() === req.user.userId);
    const isDriver = ride.driverId && ride.driverId.toString() === req.user.userId;

    if (!isRider && !isDriver) {
      return res.status(403).json({ message: 'You are not part of this ride' });
    }

    const type = isDriver ? 'driver-to-student' : 'student-to-driver';

    const existingReview = await Review.findOne({
      rideId,
      reviewerId: req.user.userId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this ride' });
    }

    const review = new Review({
      rideId,
      reviewerId: req.user.userId,
      revieweeId,
      rating,
      comment,
      type
    });

    await review.save();

    const reviews = await Review.find({ revieweeId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await User.findByIdAndUpdate(revieweeId, {
      'rating.avg': avgRating,
      'rating.count': reviews.length
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Failed to create review', error: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ revieweeId: userId })
      .populate('reviewerId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Failed to get reviews' });
  }
});

router.get('/ride/:rideId', authenticateToken, async (req, res) => {
  try {
    const { rideId } = req.params;

    const reviews = await Review.find({ rideId })
      .populate('reviewerId', 'name')
      .populate('revieweeId', 'name rating');

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Get ride reviews error:', error);
    res.status(500).json({ message: 'Failed to get ride reviews' });
  }
});

module.exports = router;
