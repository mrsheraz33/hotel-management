const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, unique: true },
    guestName: { type: String, required: [true, 'Guest name is required'], trim: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    nights: { type: Number, default: 0 },
    extra: { type: Number, default: 0, min: 0 },
    amount: { type: Number, required: [true, 'Amount is required'] },
    status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
