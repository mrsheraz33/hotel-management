const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { asyncHandler, createError } = require('../middleware/errorMiddleware');

const STATUSES = ['available', 'booked', 'cleaning', 'maintenance'];

exports.getRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find().sort({ number: 1 });
  res.json(rooms);
});

exports.getRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) throw createError(404, 'Room not found');
  res.json(room);
});

exports.filterRooms = asyncHandler(async (req, res) => {
  const { status } = req.params;
  if (!STATUSES.includes(status)) throw createError(400, `Status must be one of: ${STATUSES.join(', ')}`);
  const rooms = await Room.find({ status }).sort({ number: 1 });
  res.json(rooms);
});

exports.createRoom = asyncHandler(async (req, res) => {
  const room = await Room.create(req.body);
  res.status(201).json(room);
});

exports.updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!room) throw createError(404, 'Room not found');
  res.json(room);
});

exports.deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) throw createError(404, 'Room not found');
  const active = await Booking.countDocuments({ room: room._id, status: { $in: ['pending', 'confirmed', 'checkedin'] } });
  if (active > 0) throw createError(400, 'Cannot delete a room that has active bookings');
  await room.deleteOne();
  res.json({ message: 'Room deleted' });
});
