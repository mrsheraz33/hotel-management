const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    number: { type: String, required: [true, 'Room number is required'], unique: true, trim: true },
    type: { type: String, enum: ['Single', 'Double', 'Deluxe', 'Suite'], required: [true, 'Room type is required'] },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    capacity: { type: Number, required: [true, 'Capacity is required'], min: 1 },
    status: { type: String, enum: ['available', 'booked', 'cleaning', 'maintenance'], default: 'available' },
    amenities: { type: String, default: '' },
    description: { type: String, default: '' },
    floor: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
