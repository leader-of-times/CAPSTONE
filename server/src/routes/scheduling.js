const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Ride = require('../models/Ride');
const { calculateFare } = require('../utils/fare');
const { calculateDistance } = require('../utils/haversine');

router.post('/schedule-ride', authenticateToken, async (req, res) => {
  try {
    const { pickup, dropoff, scheduledFor } = req.body;

    if (!pickup || !dropoff || !scheduledFor) {
      return res.status(400).json({ message: 'Pickup, dropoff, and scheduled time are required' });
    }

    const scheduledDate = new Date(scheduledFor);
    const now = new Date();

    if (scheduledDate <= now) {
      return res.status(400).json({ message: 'Scheduled time must be in the future' });
    }

    const maxScheduleTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (scheduledDate > maxScheduleTime) {
      return res.status(400).json({ message: 'Can only schedule rides up to 24 hours in advance' });
    }

    const pickupCoords = pickup.coordinates;
    const dropoffCoords = dropoff.coordinates;

    const distance = calculateDistance(
      pickupCoords[1],
      pickupCoords[0],
      dropoffCoords[1],
      dropoffCoords[0]
    );

    const fare = calculateFare(distance);

    const ride = new Ride({
      requesterId: req.user.userId,
      riders: [{
        userId: req.user.userId,
        pickup: {
          address: pickup.address,
          location: {
            type: 'Point',
            coordinates: pickupCoords
          }
        },
        dropoff: {
          address: dropoff.address,
          location: {
            type: 'Point',
            coordinates: dropoffCoords
          }
        },
        fare: fare
      }],
      status: 'Requested',
      fare: {
        total: fare,
        currency: 'INR'
      },
      estimatedDistance: distance,
      scheduledFor: scheduledDate,
      isScheduled: true
    });

    await ride.save();

    res.status(201).json({
      success: true,
      message: 'Ride scheduled successfully',
      ride: {
        id: ride._id,
        scheduledFor: ride.scheduledFor,
        fare: ride.fare.total,
        distance: distance.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Schedule ride error:', error);
    res.status(500).json({ 
      message: 'Failed to schedule ride',
      error: error.message 
    });
  }
});

router.get('/scheduled-rides', authenticateToken, async (req, res) => {
  try {
    const now = new Date();

    const scheduledRides = await Ride.find({
      requesterId: req.user.userId,
      isScheduled: true,
      scheduledFor: { $gte: now },
      status: { $in: ['Requested', 'Accepted'] }
    }).sort({ scheduledFor: 1 });

    res.json({
      success: true,
      scheduledRides
    });
  } catch (error) {
    console.error('Get scheduled rides error:', error);
    res.status(500).json({ message: 'Failed to get scheduled rides' });
  }
});

router.delete('/cancel-scheduled/:rideId', authenticateToken, async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.requesterId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You are not authorized to cancel this ride' });
    }

    if (!ride.isScheduled) {
      return res.status(400).json({ message: 'This is not a scheduled ride' });
    }

    if (ride.status !== 'Requested') {
      return res.status(400).json({ message: 'Cannot cancel ride that is already accepted' });
    }

    await Ride.findByIdAndUpdate(rideId, {
      status: 'Cancelled'
    });

    res.json({
      success: true,
      message: 'Scheduled ride cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel scheduled ride error:', error);
    res.status(500).json({ message: 'Failed to cancel scheduled ride' });
  }
});

module.exports = router;
