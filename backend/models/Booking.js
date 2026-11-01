const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    guestName: { type: String, required: [true, 'Guest name is required'], trim: true },
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: [true, 'Room is required'] },
    checkIn: { type: Date, required: [true, 'Check-in date is required'] },
    checkOut: { type: Date, required: [true, 'Check-out date is required'] },
    nights: { type: Number },
    amount: { type: Number },
    status: { type: String, enum: ['pending', 'confirmed', 'checkedin', 'cancelled'], default: 'pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
