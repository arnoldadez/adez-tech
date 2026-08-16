import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Create new order
router.post('/create', auth, async (req, res) => {
  try {
    const { service, platform, quantity, link } = req.body;
    const userId = req.userId;

    // Calculate price (example pricing)
    let pricePerUnit = 0;
    if (service === 'instagram') pricePerUnit = 0.01;
    else if (service === 'tiktok') pricePerUnit = 0.02;
    else if (service === 'youtube') pricePerUnit = 0.03;
    else if (service === 'telegram') pricePerUnit = 0.005;

    const amount = pricePerUnit * quantity;

    // Check wallet balance
    const user = await User.findById(userId);
    if (user.wallet < amount) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    // Deduct from wallet
    user.wallet -= amount;
    await user.save();

    // Create order
    const order = new Order({
      userId,
      service,
      platform: platform || service,
      quantity,
      link,
      amount,
      status: 'pending'
    });
    await order.save();

    res.status(201).json({ 
      message: 'Order placed successfully',
      order,
      newBalance: user.wallet
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (admin only)
router.get('/all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const orders = await Order.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status (admin only)
router.put('/:orderId/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );
    res.json({ message: 'Order updated', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
