const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Guest = require('../models/Guest');
const Room = require('../models/Room');
const { asyncHandler } = require('../middleware/errorMiddleware');

const sumInvoices = async (match) => {
  const r = await Invoice.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  return r.length ? r[0].total : 0;
};

// GET /api/reports/summary
exports.getSummary = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalBookings, totalGuests, totalRooms, availableRooms, bookedRooms, revenue, unpaid, todayRevenue] =
    await Promise.all([
      Booking.countDocuments({ status: { $ne: 'cancelled' } }),
      Guest.countDocuments(),
      Room.countDocuments(),
      Room.countDocuments({ status: 'available' }),
      Room.countDocuments({ status: 'booked' }),
      sumInvoices({ status: 'paid' }),
      sumInvoices({ status: 'unpaid' }),
      sumInvoices({ status: 'paid', date: { $gte: startOfDay } }),
    ]);

  res.json({ totalBookings, totalGuests, totalRooms, availableRooms, bookedRooms, revenue, unpaid, todayRevenue });
});

// GET /api/reports/occupancy
exports.getOccupancy = asyncHandler(async (req, res) => {
  const rows = await Room.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const counts = { available: 0, booked: 0, cleaning: 0, maintenance: 0 };
  rows.forEach((r) => { counts[r._id] = r.count; });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const percent = {};
  Object.keys(counts).forEach((k) => { percent[k] = total ? Math.round((counts[k] / total) * 100) : 0; });
  res.json({ total, counts, percent });
});

// GET /api/reports/monthly-revenue  (non-cancelled bookings, grouped by check-in month)
exports.getMonthlyRevenue = asyncHandler(async (req, res) => {
  const rows = await Booking.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $group: { _id: { y: { $year: '$checkIn' }, m: { $month: '$checkIn' } }, bookings: { $sum: 1 }, revenue: { $sum: '$amount' } } },
    { $sort: { '_id.y': -1, '_id.m': -1 } },
    { $limit: 12 },
  ]);
  res.json(rows.map((r) => ({
    month: `${r._id.y}-${String(r._id.m).padStart(2, '0')}`,
    bookings: r.bookings,
    revenue: r.revenue,
  })));
});

// GET /api/reports/top-guests
exports.getTopGuests = asyncHandler(async (req, res) => {
  const rows = await Booking.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $group: { _id: '$guestName', totalBookings: { $sum: 1 }, totalSpent: { $sum: '$amount' } } },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 },
  ]);
  res.json(rows.map((r) => ({ guest: r._id, totalBookings: r.totalBookings, totalSpent: r.totalSpent })));
});
