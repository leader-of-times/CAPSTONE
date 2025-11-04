const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Review = require('../models/Review');
const PromoCode = require('../models/PromoCode');

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalRides = await Ride.countDocuments();
    const completedRides = await Ride.countDocuments({ status: 'Completed' });
    const activeRides = await Ride.countDocuments({ 
      status: { $in: ['Requested', 'Accepted', 'OnRoute', 'OnRide'] }
    });

    const totalRevenue = await Ride.aggregate([
      { $match: { status: 'Completed', 'payment.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$fare.total' } } }
    ]);

    const recentRides = await Ride.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('requesterId', 'name email')
      .populate('driverId', 'name email');

    const topDrivers = await User.aggregate([
      { $match: { role: 'driver' } },
      { $sort: { 'rating.avg': -1, 'rating.count': -1 } },
      { $limit: 10 },
      { $project: { name: 1, email: 1, rating: 1, 'wallet.balance': 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          drivers: totalDrivers,
          students: totalStudents
        },
        rides: {
          total: totalRides,
          completed: completedRides,
          active: activeRides
        },
        revenue: {
          total: totalRevenue[0]?.total || 0
        }
      },
      recentRides,
      topDrivers
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Failed to get admin stats' });
  }
});

router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;

    const filter = {};
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

router.get('/rides', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const rides = await Ride.find(filter)
      .populate('requesterId', 'name email')
      .populate('driverId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ride.countDocuments(filter);

    res.json({
      success: true,
      rides,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get rides error:', error);
    res.status(500).json({ message: 'Failed to get rides' });
  }
});

router.patch('/users/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { active } = req.body;

    await User.findByIdAndUpdate(userId, { active });

    res.json({
      success: true,
      message: 'User status updated successfully'
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

module.exports = router;
