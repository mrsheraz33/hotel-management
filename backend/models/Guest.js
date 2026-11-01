const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Guest name is required'], trim: true },
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    cnic: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Guest', guestSchema);
