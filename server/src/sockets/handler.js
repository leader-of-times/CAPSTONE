const User = require('../models/User');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Authenticate and join user room
    socket.on('authenticate', async (data) => {
      try {
        const { userId, role } = data;
        
        if (!userId) {
          socket.emit('error', { message: 'User ID required' });
          return;
        }

        // Join user-specific room
        socket.join(`user:${userId}`);
        
        if (role === 'driver') {
          socket.join(`driver:${userId}`);
        }

        socket.userId = userId;
        socket.userRole = role;

        socket.emit('authenticated', { userId, role });
        console.log(`User ${userId} authenticated as ${role}`);
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Driver goes online/offline
    socket.on('driverStatus', async (data) => {
      try {
        const { online, location } = data;
        
        if (!socket.userId || socket.userRole !== 'driver') {
          socket.emit('error', { message: 'Only drivers can update status' });
          return;
        }

        const updateData = {
          'currentStatus.online': online,
          'currentStatus.updatedAt': new Date()
        };

        if (location && location.coordinates) {
          updateData['currentStatus.location'] = {
            type: 'Point',
            coordinates: location.coordinates
          };
        }

        await User.findByIdAndUpdate(socket.userId, updateData);

        socket.emit('statusUpdated', { online, location });
        console.log(`Driver ${socket.userId} is now ${online ? 'online' : 'offline'}`);

        // If driver goes online, send all pending ride requests
        if (online) {
          const Ride = require('../models/Ride');
          
          // Only send rides that are still in 'Requested' status and not expired
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
          const pendingRides = await Ride.find({ 
            status: 'Requested',
            createdAt: { $gte: tenMinutesAgo } // Only rides created within last 10 minutes
          })
            .sort({ createdAt: -1 })
            .limit(50);

          console.log(`Sending ${pendingRides.length} pending rides to driver ${socket.userId}`);

          pendingRides.forEach(ride => {
            const rider = ride.riders[0];
            socket.emit('newRideRequest', {
              rideId: ride._id,
              pickup: rider.pickup.address,
              dropoff: rider.dropoff.address,
              fareEstimate: ride.fare.total,
              distance: ride.estimatedDistance
            });
          });
        }
      } catch (error) {
        console.error('Driver status error:', error);
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // Update driver location in real-time
    socket.on('updateLocation', async (data) => {
      try {
        const { coordinates } = data;
        
        if (!socket.userId || socket.userRole !== 'driver') {
          return;
        }

        if (!coordinates || coordinates.length !== 2) {
          socket.emit('error', { message: 'Invalid coordinates' });
          return;
        }

        await User.findByIdAndUpdate(socket.userId, {
          'currentStatus.location': {
            type: 'Point',
            coordinates
          },
          'currentStatus.updatedAt': new Date()
        });

        // Broadcast to riders in active rides
        const Ride = require('../models/Ride');
        const activeRides = await Ride.find({
          driverId: socket.userId,
          status: { $in: ['Accepted', 'OnRoute', 'OnRide'] }
        });

        activeRides.forEach(ride => {
          ride.riders.forEach(rider => {
            io.to(`user:${rider.userId}`).emit('driverLocationUpdate', {
              rideId: ride._id,
              coordinates
            });
          });
        });

        socket.emit('locationUpdated', { coordinates });
      } catch (error) {
        console.error('Update location error:', error);
      }
    });

    // Chat messaging
    socket.on('sendMessage', async (data) => {
      try {
        const { rideId, receiverId, message } = data;

        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const ChatMessage = require('../models/ChatMessage');
        
        const chatMessage = new ChatMessage({
          rideId,
          senderId: socket.userId,
          receiverId,
          message
        });

        await chatMessage.save();

        io.to(`user:${receiverId}`).emit('newMessage', {
          rideId,
          senderId: socket.userId,
          message,
          createdAt: chatMessage.createdAt
        });

        socket.emit('messageSent', {
          messageId: chatMessage._id,
          createdAt: chatMessage.createdAt
        });
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('markMessagesRead', async (data) => {
      try {
        const { rideId } = data;

        if (!socket.userId) {
          return;
        }

        const ChatMessage = require('../models/ChatMessage');
        
        await ChatMessage.updateMany(
          {
            rideId,
            receiverId: socket.userId,
            read: false
          },
          { read: true }
        );

        socket.emit('messagesMarkedRead', { rideId });
      } catch (error) {
        console.error('Mark messages read error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      // Set driver offline on disconnect
      if (socket.userId && socket.userRole === 'driver') {
        try {
          await User.findByIdAndUpdate(socket.userId, {
            'currentStatus.online': false,
            'currentStatus.updatedAt': new Date()
          });
          console.log(`Driver ${socket.userId} auto-set to offline`);
        } catch (error) {
          console.error('Disconnect update error:', error);
        }
      }
    });
  });

  return io;
};
