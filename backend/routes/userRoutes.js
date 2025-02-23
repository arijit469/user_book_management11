const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Register (allow both user and admin roles)
router.post('/register', async (req, res) => {
  const { username, password, role = 'user' } = req.body; // Default to 'user', no email
  try {
    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Validate role (optional, to ensure only 'user' or 'admin' are allowed)
    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ message: 'Role must be either "user" or "admin"' });
    }

    user = new User({ username, password: await bcrypt.hash(password, 10), role });
    await user.save();
    console.log('User saved:', user); // Debug log to verify saving

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Registration error:', err); // Debug log for errors
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Login (allow both user and admin roles)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Add to favorites (authenticated users only, no role restriction)
router.post('/favorites/:bookId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.favorites.includes(req.params.bookId)) {
      user.favorites.push(req.params.bookId);
      await user.save();
    }
    res.json({ message: 'Book added to favorites' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;