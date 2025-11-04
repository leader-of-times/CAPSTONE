const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const twilio = require('twilio');
const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(phone, { otp, expiresAt });

    if (client && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await client.messages.create({
          body: `Your AutoShare OTP is: ${otp}. Valid for 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
        console.log(`OTP sent to ${phone}: ${otp}`);
      } catch (twilioError) {
        console.error('Twilio error:', twilioError);
        console.log(`DEMO MODE: OTP for ${phone}: ${otp}`);
      }
    } else {
      console.log(`DEMO MODE: OTP for ${phone}: ${otp}`);
    }

    res.json({
      success: true,
      message: client ? 'OTP sent successfully' : `DEMO MODE - OTP: ${otp}`,
      demoOtp: !client ? otp : undefined
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const storedData = otpStore.get(phone);

    if (!storedData) {
      return res.status(400).json({ message: 'No OTP found for this phone number' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    otpStore.delete(phone);

    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({
        phone,
        email: `${phone}@autoshare.com`,
        password: Math.random().toString(36),
        name: `User_${phone.slice(-4)}`,
        role: 'student',
        phoneVerified: true
      });
      await user.save();
    } else {
      user.phoneVerified = true;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    otpStore.delete(phone);

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(phone, { otp, expiresAt });

    if (client && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await client.messages.create({
          body: `Your AutoShare OTP is: ${otp}. Valid for 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
        console.log(`OTP resent to ${phone}: ${otp}`);
      } catch (twilioError) {
        console.error('Twilio error:', twilioError);
        console.log(`DEMO MODE: OTP for ${phone}: ${otp}`);
      }
    } else {
      console.log(`DEMO MODE: OTP for ${phone}: ${otp}`);
    }

    res.json({
      success: true,
      message: client ? 'OTP resent successfully' : `DEMO MODE - OTP: ${otp}`,
      demoOtp: !client ? otp : undefined
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
});

module.exports = router;
