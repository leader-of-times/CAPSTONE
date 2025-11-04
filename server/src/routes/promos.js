const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const PromoCode = require('../models/PromoCode');

router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { code, fareAmount } = req.body;

    const promo = await PromoCode.findOne({ code: code.toUpperCase() });

    if (!promo) {
      return res.status(404).json({ message: 'Invalid promo code' });
    }

    if (!promo.active) {
      return res.status(400).json({ message: 'Promo code is inactive' });
    }

    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      return res.status(400).json({ message: 'Promo code has expired' });
    }

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ message: 'Promo code usage limit reached' });
    }

    if (promo.usersUsed.includes(req.user.userId)) {
      return res.status(400).json({ message: 'You have already used this promo code' });
    }

    if (fareAmount < promo.minFare) {
      return res.status(400).json({ 
        message: `Minimum fare of ₹${promo.minFare} required for this promo code` 
      });
    }

    let discount = 0;
    if (promo.discountType === 'percentage') {
      discount = (fareAmount * promo.discountValue) / 100;
      if (promo.maxDiscount && discount > promo.maxDiscount) {
        discount = promo.maxDiscount;
      }
    } else {
      discount = promo.discountValue;
    }

    const finalFare = Math.max(fareAmount - discount, 0);

    res.json({
      success: true,
      message: 'Promo code applied successfully',
      promo: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue
      },
      originalFare: fareAmount,
      discount,
      finalFare
    });
  } catch (error) {
    console.error('Validate promo error:', error);
    res.status(500).json({ message: 'Failed to validate promo code' });
  }
});

router.post('/apply', authenticateToken, async (req, res) => {
  try {
    const { code, rideId } = req.body;

    const promo = await PromoCode.findOne({ code: code.toUpperCase() });

    if (!promo || !promo.active) {
      return res.status(404).json({ message: 'Invalid promo code' });
    }

    await PromoCode.findByIdAndUpdate(promo._id, {
      $inc: { usedCount: 1 },
      $push: { usersUsed: req.user.userId }
    });

    res.json({
      success: true,
      message: 'Promo code applied successfully'
    });
  } catch (error) {
    console.error('Apply promo error:', error);
    res.status(500).json({ message: 'Failed to apply promo code' });
  }
});

router.post('/create', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const promoData = req.body;
    const promo = new PromoCode(promoData);
    await promo.save();

    res.status(201).json({
      success: true,
      message: 'Promo code created successfully',
      promo
    });
  } catch (error) {
    console.error('Create promo error:', error);
    res.status(500).json({ message: 'Failed to create promo code' });
  }
});

router.get('/list', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const promos = await PromoCode.find({
      active: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now }
    }).select('code discountType discountValue maxDiscount minFare validUntil');

    res.json({
      success: true,
      promos
    });
  } catch (error) {
    console.error('List promos error:', error);
    res.status(500).json({ message: 'Failed to list promo codes' });
  }
});

module.exports = router;
