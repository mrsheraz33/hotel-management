const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { asyncHandler, createError } = require('../middleware/errorMiddleware');

const ROLES = ['admin', 'receptionist', 'staff'];
const safeUser = (u) => ({ id: u._id, username: u.username, role: u.role });

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) throw createError(400, 'Username and password are required');
  if (password.length < 6) throw createError(400, 'Password must be at least 6 characters');

  const wanted = role || 'staff';
  if (!ROLES.includes(wanted)) throw createError(400, 'Invalid role');

  // Only an existing admin may create admin / receptionist accounts
  if (wanted !== 'staff') {
    let allowed = false;
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
        const caller = await User.findById(decoded.id);
        allowed = !!caller && caller.role === 'admin';
      } catch (e) {
        allowed = false;
      }
    }
    if (!allowed) throw createError(403, 'Only an admin can create admin or receptionist accounts');
  }

  const exists = await User.findOne({ username: username.toLowerCase().trim() });
  if (exists) throw createError(409, 'Username already taken');

  const user = await User.create({ username, password, role: wanted });
  res.status(201).json({ token: generateToken(user._id), user: safeUser(user) });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) throw createError(400, 'Username and password are required');

  const user = await User.findOne({ username: username.toLowerCase().trim() });
  if (!user || !(await user.matchPassword(password))) {
    throw createError(401, 'Invalid username or password');
  }
  if (role && role.toLowerCase() !== user.role) {
    throw createError(401, `This account is not registered as ${role}`);
  }
  res.json({ token: generateToken(user._id), user: safeUser(user) });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ user: safeUser(req.user) });
});

// PUT /api/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw createError(400, 'Current and new password are required');
  if (newPassword.length < 6) throw createError(400, 'New password must be at least 6 characters');

  const user = await User.findById(req.user._id);
  if (!(await user.matchPassword(currentPassword))) throw createError(400, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});
