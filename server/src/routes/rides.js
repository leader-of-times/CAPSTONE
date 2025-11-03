const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const Ride = require('../models/Ride');
const User = require('../models/User');
const { findDriverMatch, findRideShareMatch } = require('../services/matchmaker');
const { haversineDistance } = require('../utils/haversine');
const { calculateFare } = require('../utils/fare');

const router = express.Router();

// Request a ride
router.post(
  '/request',
  authMiddleware,
  [
    body('pickup.address').notEmpty(),
    body('pickup.coordinates').isArray({ min: 2, max: 2 }),
    body('dropoff.address').notEmpty(),
    body('dropoff.coordinates').isArray({ min: 2, max: 2 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { pickup, dropoff } = req.body;

      // Calculate distance and fare estimate
      const distance = haversineDistance(
        pickup.coordinates[1], pickup.coordinates[0],
        dropoff.coordinates[1], dropoff.coordinates[0]
      );

      const fareEstimate = calculateFare(distance);

      // Create ride request
      const ride = new Ride({
        requesterId: req.userId,
        riders: [
          {
            userId: req.userId,
            pickup: {
              address: pickup.address,
              location: {
                type: 'Point',
                coordinates: pickup.coordinates
              }
            },
            dropoff: {
              address: dropoff.address,
              location: {
                type: 'Point',
                coordinates: dropoff.coordinates
              }
            },
            fare: fareEstimate.total
          }
        ],
        fare: {
          total: fareEstimate.total
        },
        estimatedDistance: distance,
        status: 'Requested'
      });

      await ride.save();

      // Auto-expire ride request after 10 minutes if not accepted
      setTimeout(async () => {
        try {
          const rideCheck = await Ride.findById(ride._id);
          if (rideCheck && rideCheck.status === 'Requested') {
            rideCheck.status = 'Expired';
            await rideCheck.save();
            
            console.log(`Ride ${ride._id} auto-expired after 10 minutes`);
            
            // Notify student that request expired
            const io = req.app.get('io');
            if (io) {
              io.to(`user:${req.userId}`).emit('rideExpired', {
                rideId: ride._id,
                message: 'No drivers available. Please try again.'
              });
            }
          }
        } catch (error) {
          console.error('Auto-expire error:', error);
        }
      }, 10 * 60 * 1000); // 10 minutes

      // Try to find a driver match
      const driverMatch = await findDriverMatch(ride);

      if (driverMatch) {
        ride.matchScore = driverMatch.score;
        await ride.save();
      }

      res.status(201).json({
        message: 'Ride requested successfully',
        ride: {
          id: ride._id,
          status: ride.status,
          estimatedDistance: distance,
          fareEstimate: fareEstimate,
          matchFound: !!driverMatch,
          driverETA: driverMatch ? driverMatch.eta : null
        }
      });

      // Emit socket event to notify nearby drivers
      const io = req.app.get('io');
      if (io) {
        // If we found a specific driver match, notify them
        if (driverMatch) {
          io.to(`driver:${driverMatch.driver._id}`).emit('newRideRequest', {
            rideId: ride._id,
            pickup: pickup.address,
            dropoff: dropoff.address,
            fareEstimate: fareEstimate.total,
            distance: distance
          });
        } else {
          // Fallback: broadcast to all online drivers (for testing/debugging)
          // Find all online drivers and notify them
          const onlineDrivers = await User.find({
            role: 'driver',
            'currentStatus.online': true
          });
          
          console.log(`Broadcasting ride ${ride._id} to ${onlineDrivers.length} online drivers`);
          
          onlineDrivers.forEach(driver => {
            io.to(`driver:${driver._id}`).emit('newRideRequest', {
              rideId: ride._id,
              pickup: pickup.address,
              dropoff: dropoff.address,
              fareEstimate: fareEstimate.total,
              distance: distance
            });
          });
        }
      }
    } catch (error) {
      console.error('Request ride error:', error);
      res.status(500).json({ error: 'Failed to request ride' });
    }
  }
);

// Accept a ride (Driver)
router.post('/accept/:rideId', authMiddleware, async (req, res) => {
  console.log('Accept ride called for rideId:', req.params.rideId, 'by user:', req.userId);
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can accept rides' });
    }

    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.status !== 'Requested') {
      return res.status(400).json({ error: 'Ride is no longer available' });
    }

    // Atomic update to prevent race conditions
    const updatedRide = await Ride.findOneAndUpdate(
      { _id: req.params.rideId, status: 'Requested', driverId: null },
      { 
        $set: { 
          driverId: req.userId,
          status: 'Accepted'
        }
      },
      { new: true }
    ).populate('requesterId', 'name phone');

    if (!updatedRide) {
      return res.status(409).json({ error: 'Ride already accepted by another driver' });
    }

    res.json({
      message: 'Ride accepted successfully',
      ride: updatedRide
    });

    // Notify student via socket with full ride details
    const io = req.app.get('io');
    if (io) {
      const driver = await User.findById(req.userId);
      io.to(`user:${updatedRide.requesterId._id}`).emit('rideAccepted', {
        rideId: updatedRide._id,
        status: 'Accepted',
        driver: {
          id: req.userId,
          name: driver.name,
          phone: driver.phone,
          vehicleInfo: driver.vehicleInfo
        },
        fare: updatedRide.fare
      });
      
      console.log(`Notified student ${updatedRide.requesterId._id} about ride acceptance`);
      console.log('Sockets in room user:' + updatedRide.requesterId._id, io.sockets.adapter.rooms.get(`user:${updatedRide.requesterId._id}`));
    }
  } catch (error) {
    console.error('Accept ride error:', error);
    res.status(500).json({ error: 'Failed to accept ride' });
  }
});

// Start ride (Driver)
router.post('/start/:rideId', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.rideId, driverId: req.userId, status: 'Accepted' },
      { $set: { status: 'OnRide' } },
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found or cannot be started' });
    }

    res.json({ message: 'Ride started', ride });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${ride.requesterId}`).emit('rideStarted', { 
        rideId: ride._id,
        status: 'OnRide'
      });
      
      console.log(`Notified student ${ride.requesterId} that ride started`);
    }
  } catch (error) {
    console.error('Start ride error:', error);
    res.status(500).json({ error: 'Failed to start ride' });
  }
});

// Complete ride (Driver)
router.post('/complete/:rideId', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findOne({ 
      _id: req.params.rideId, 
      driverId: req.userId,
      status: 'OnRide'
    });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found or cannot be completed' });
    }

    ride.status = 'Completed';
    await ride.save();

    // Update driver wallet (simulated)
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'wallet.balance': ride.fare.total }
    });

    res.json({ 
      message: 'Ride completed successfully',
      ride,
      fareCharged: ride.fare.total
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${ride.requesterId}`).emit('rideCompleted', {
        rideId: ride._id,
        fare: ride.fare.total
      });
    }
  } catch (error) {
    console.error('Complete ride error:', error);
    res.status(500).json({ error: 'Failed to complete ride' });
  }
});

// Get ride details
router.get('/:rideId', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate('requesterId', 'name phone email')
      .populate('driverId', 'name phone vehicleInfo');

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json({ ride });
  } catch (error) {
    console.error('Get ride error:', error);
    res.status(500).json({ error: 'Failed to get ride details' });
  }
});

// Get user's rides
router.get('/user/history', authMiddleware, async (req, res) => {
  try {
    const query = req.user.role === 'driver' 
      ? { driverId: req.userId }
      : { requesterId: req.userId };

    const rides = await Ride.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('requesterId', 'name')
      .populate('driverId', 'name vehicleInfo');

    res.json({ rides });
  } catch (error) {
    console.error('Get ride history error:', error);
    res.status(500).json({ error: 'Failed to get ride history' });
  }
});

module.exports = router;
