const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const authenticateToken = require('../middleware/auth');
const Ride = require('../models/Ride');
const User = require('../models/User');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const { rideId } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'Completed') {
      return res.status(400).json({ message: 'Can only pay for completed rides' });
    }

    const isRider = ride.riders.some(rider => rider.userId.toString() === req.user.userId);
    if (!isRider) {
      return res.status(403).json({ message: 'You are not authorized to pay for this ride' });
    }

    const amountInPaise = Math.round(ride.fare.total * 100);

    const options = {
      amount: amountInPaise,
      currency: ride.fare.currency || 'INR',
      receipt: `ride_${rideId}_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    await Ride.findByIdAndUpdate(rideId, {
      'payment.orderId': order.id,
      'payment.status': 'pending'
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy'
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Unable to create payment order',
      error: error.message 
    });
  }
});

router.post('/verify-payment', authenticateToken, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      rideId 
    } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const isRider = ride.riders.some(rider => rider.userId.toString() === req.user.userId);
    if (!isRider) {
      return res.status(403).json({ message: 'You are not authorized to pay for this ride' });
    }

    const isDemoMode = process.env.NODE_ENV === 'development' && 
                       razorpay_payment_id.startsWith('pay_sim_');

    let isAuthentic = false;

    if (isDemoMode) {
      isAuthentic = true;
      console.log('DEMO MODE: Payment verification bypassed for testing');
    } else {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
        .update(body.toString())
        .digest('hex');
      isAuthentic = expectedSignature === razorpay_signature;
    }

    if (isAuthentic) {
      const ride = await Ride.findByIdAndUpdate(
        rideId,
        {
          'payment.paymentId': razorpay_payment_id,
          'payment.orderId': razorpay_order_id,
          'payment.signature': razorpay_signature,
          'payment.status': 'completed',
          'payment.paidAt': new Date()
        },
        { new: true }
      );

      const driverId = ride.driverId;
      const driverCommission = ride.fare.total * 0.8;

      await User.findByIdAndUpdate(driverId, {
        $inc: { 'wallet.balance': driverCommission }
      });

      res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        ride 
      });
    } else {
      await Ride.findByIdAndUpdate(rideId, {
        'payment.status': 'failed'
      });

      res.status(400).json({ 
        success: false, 
        message: 'Invalid payment signature' 
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed',
      error: error.message 
    });
  }
});

router.get('/status/:rideId', authenticateToken, async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await Ride.findById(rideId).select('payment riders driverId');

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const isRider = ride.riders.some(rider => rider.userId.toString() === req.user.userId);
    const isDriver = ride.driverId && ride.driverId.toString() === req.user.userId;

    if (!isRider && !isDriver) {
      return res.status(403).json({ message: 'You are not authorized to view payment status for this ride' });
    }

    res.json({ 
      success: true, 
      payment: ride.payment || { status: 'not_initiated' }
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get payment status' 
    });
  }
});

module.exports = router;
