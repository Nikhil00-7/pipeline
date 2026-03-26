const userModel = require('../models/user.model');
const blacklisttokenModel = require('../models/blacklisttoken.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { subscribeToQueue } = require('../service/rabbit');
const EventEmitter = require('events');

// Event emitter for ride acceptance
const rideEventEmitter = new EventEmitter();

/**
 * Register a new user
 */
module.exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = new userModel({ name, email, password: hash });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token);

    delete newUser._doc.password;

    res.status(200).json({ token, newUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Login user
 */
module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token);

    delete user._doc.password;

    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Logout user
 */
module.exports.logout = async (req, res) => {
  try {
    const token = req.cookies.token;
    await blacklisttokenModel.create({ token });
    res.clearCookie('token');
    res.status(200).json({ message: 'User logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get profile
 */
module.exports.profile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Long polling for accepted ride
 */
module.exports.acceptedRide = async (req, res) => {
  let timeoutId;

  // Promise resolves when ride is accepted
  const ridePromise = new Promise((resolve) => {
    rideEventEmitter.once('ride-accepted', (data) => {
      clearTimeout(timeoutId);
      resolve(data);
    });
  });

  // Timeout after 30 seconds
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(null), 30000);
  });

  const rideData = await Promise.race([ridePromise, timeoutPromise]);

  if (rideData) {
    res.status(200).json(rideData);
  } else {
    res.status(204).send();
  }
};

// Subscribe to RabbitMQ ride-accepted messages
subscribeToQueue('ride-accepted', async (msg) => {
  try {
    const data = JSON.parse(msg);
    rideEventEmitter.emit('ride-accepted', data);
  } catch (err) {
    console.error('Failed to parse ride-accepted message:', err);
  }
});

// Export rideEventEmitter for tests if needed
module.exports.rideEventEmitter = rideEventEmitter;