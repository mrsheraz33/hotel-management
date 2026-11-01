const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { asyncHandler, createError } = require('../middleware/errorMiddleware');

const ACTIVE = ['pending', 'confirmed', 'checkedin'];
const DAY = 24 * 60 * 60 * 1000;

// Keep room.status in step with its bookings (confirmed / checked in => booked)
async function refreshRoom(roomId) {
  if (!roomId) return;
  const room = await Room.findById(roomId);
  if (!room) return;
  const occupied = await Booking.countDocuments({ room: roomId, status: { $in: ['confirmed', 'checkedin'] } });
  if (occupied > 0 && room.status === 'available') {
    room.status = 'booked';
    await room.save();
  } else if (occupied === 0 && room.status === 'booked') {
    room.status = 'available';
    await room.save();
  }
}

// Validate input, check room + overlap, compute nights and amount
async function buildBooking(data, ignoreId) {
  const { guestName, phone, room, checkIn, checkOut } = data;
  if (!guestName || !phone || !room || !checkIn || !checkOut) {
    throw createError(400, 'Guest name, phone, room, check-in and check-out are required');
  }
  const inD = new Date(checkIn);
  const outD = new Date(checkOut);
  if (isNaN(inD) || isNaN(outD)) throw createError(400, 'Invalid dates');
  if (outD <= inD) throw createError(400, 'Check-out must be after check-in');

  const roomDoc = await Room.findById(room);
  if (!roomDoc) throw createError(404, 'Room not found');
  if (roomDoc.status === 'maintenance') throw createError(400, `Room ${roomDoc.number} is under maintenance`);

  const status = data.status || 'pending';
  if (status !== 'cancelled') {
    const query = { room: roomDoc._id, status: { $in: ACTIVE }, checkIn: { $lt: outD }, checkOut: { $gt: inD } };
    if (ignoreId) query._id = { $ne: ignoreId };
    const clash = await Booking.findOne(query);
    if (clash) throw createError(409, `Room ${roomDoc.number} is already booked for these dates`);
  }

  const nights = Math.ceil((outD - inD) / DAY);
  return {
    guestName: String(guestName).trim(),
    phone: String(phone).trim(),
    room: roomDoc._id,
    checkIn: inD,
    checkOut: outD,
    nights,
    amount: nights * roomDoc.price,
    status,
  };
}

exports.getBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find().populate('room', 'number type price status').sort({ createdAt: -1 });
  res.json(bookings);
});

exports.getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('room', 'number type price status');
  if (!booking) throw createError(404, 'Booking not found');
  res.json(booking);
});

exports.createBooking = asyncHandler(async (req, res) => {
  const data = await buildBooking(req.body);
  const booking = await Booking.create({ ...data, createdBy: req.user._id });
  await refreshRoom(booking.room);
  await booking.populate('room', 'number type price status');
  res.status(201).json(booking);
});

exports.updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw createError(404, 'Booking not found');

  const oldRoom = booking.room;
  const merged = { ...booking.toObject(), ...req.body };
  const data = await buildBooking(merged, booking._id);

  Object.assign(booking, data);
  await booking.save();
  await refreshRoom(booking.room);
  if (String(oldRoom) !== String(booking.room)) await refreshRoom(oldRoom);

  await booking.populate('room', 'number type price status');
  res.json(booking);
});

exports.deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw createError(404, 'Booking not found');
  const roomId = booking.room;
  await booking.deleteOne();
  await refreshRoom(roomId);
  res.json({ message: 'Booking deleted' });
});
