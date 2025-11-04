require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

// Routes
const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');
const paymentRoutes = require('./routes/payments');
const otpRoutes = require('./routes/otp');
const reviewRoutes = require('./routes/reviews');
const promoRoutes = require('./routes/promos');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const schedulingRoutes = require('./routes/scheduling');

// Socket handlers
const socketHandler = require('./sockets/handler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:8081', 'http://localhost:19006', '*'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/scheduling', schedulingRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Auto-Share API running' });
});

// Socket.IO
socketHandler(io);

// Database connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/autoshare';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(PORT, 'localhost', () => {
      console.log(`🚀 Server running on localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = { app, io };
