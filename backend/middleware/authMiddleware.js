const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: token missing' });
    }
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Unauthorized: user no longer exists' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized: token invalid or expired' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied for your role' });
  }
  next();
};

const adminOnly = authorize('admin');

module.exports = { protect, authorize, adminOnly };
