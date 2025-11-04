const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');

const pushTokens = new Map();

router.post('/register-token', authenticateToken, async (req, res) => {
  try {
    const { expoPushToken } = req.body;

    if (!expoPushToken) {
      return res.status(400).json({ message: 'Push token is required' });
    }

    pushTokens.set(req.user.userId, expoPushToken);

    res.json({
      success: true,
      message: 'Push token registered successfully'
    });
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({ message: 'Failed to register push token' });
  }
});

router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    const pushToken = pushTokens.get(userId);

    if (!pushToken) {
      return res.status(404).json({ message: 'User has no registered push token' });
    }

    const message = {
      to: pushToken,
      sound: 'default',
      title: title || 'AutoShare',
      body,
      data: data || {}
    };

    if (process.env.NODE_ENV === 'production') {
      const fetch = require('node-fetch');
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      const result = await response.json();
      console.log('Push notification sent:', result);
    } else {
      console.log('DEMO MODE: Push notification:', message);
    }

    res.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

module.exports = router;
