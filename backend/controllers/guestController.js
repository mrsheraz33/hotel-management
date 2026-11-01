const Guest = require('../models/Guest');
const { asyncHandler, createError } = require('../middleware/errorMiddleware');

exports.getGuests = asyncHandler(async (req, res) => {
  res.json(await Guest.find().sort({ createdAt: -1 }));
});

exports.getGuest = asyncHandler(async (req, res) => {
  const guest = await Guest.findById(req.params.id);
  if (!guest) throw createError(404, 'Guest not found');
  res.json(guest);
});

exports.createGuest = asyncHandler(async (req, res) => {
  res.status(201).json(await Guest.create(req.body));
});

exports.updateGuest = asyncHandler(async (req, res) => {
  const guest = await Guest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!guest) throw createError(404, 'Guest not found');
  res.json(guest);
});

exports.deleteGuest = asyncHandler(async (req, res) => {
  const guest = await Guest.findByIdAndDelete(req.params.id);
  if (!guest) throw createError(404, 'Guest not found');
  res.json({ message: 'Guest deleted' });
});
