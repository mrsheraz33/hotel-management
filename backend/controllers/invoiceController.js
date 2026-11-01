const Invoice = require('../models/Invoice');
const Room = require('../models/Room');
const { asyncHandler, createError } = require('../middleware/errorMiddleware');

async function nextInvoiceNo() {
  const last = await Invoice.findOne().sort({ invoiceNo: -1 });
  const n = last ? parseInt(String(last.invoiceNo).replace(/\D/g, ''), 10) || 0 : 0;
  return `INV-${String(n + 1).padStart(4, '0')}`;
}

// total = nights x room price + extra charges
async function computeAmount({ room, nights, extra }) {
  const ex = Number(extra) || 0;
  const n = Number(nights) || 0;
  if (ex < 0 || n < 0) throw createError(400, 'Nights and extra charges cannot be negative');
  let base = 0;
  if (room) {
    const roomDoc = await Room.findById(room);
    if (!roomDoc) throw createError(404, 'Room not found');
    base = n * roomDoc.price;
  }
  const amount = base + ex;
  if (amount <= 0) throw createError(400, 'Invoice total must be greater than zero');
  return { nights: n, extra: ex, amount };
}

exports.getInvoices = asyncHandler(async (req, res) => {
  res.json(await Invoice.find().populate('room', 'number type price').sort({ createdAt: -1 }));
});

exports.getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('room', 'number type price');
  if (!invoice) throw createError(404, 'Invoice not found');
  res.json(invoice);
});

exports.createInvoice = asyncHandler(async (req, res) => {
  const { guestName, room, status, date } = req.body;
  if (!guestName || !String(guestName).trim()) throw createError(400, 'Guest name is required');
  const totals = await computeAmount(req.body);
  const invoice = await Invoice.create({
    invoiceNo: await nextInvoiceNo(),
    guestName: String(guestName).trim(),
    room: room || undefined,
    status: status || 'unpaid',
    date: date || Date.now(),
    ...totals,
  });
  await invoice.populate('room', 'number type price');
  res.status(201).json(invoice);
});

exports.updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw createError(404, 'Invoice not found');

  const merged = {
    room: req.body.room !== undefined ? req.body.room : invoice.room,
    nights: req.body.nights !== undefined ? req.body.nights : invoice.nights,
    extra: req.body.extra !== undefined ? req.body.extra : invoice.extra,
  };
  const totals = await computeAmount(merged);

  if (req.body.guestName) invoice.guestName = String(req.body.guestName).trim();
  if (req.body.status) invoice.status = req.body.status;
  if (req.body.date) invoice.date = req.body.date;
  invoice.room = merged.room || undefined;
  Object.assign(invoice, totals);

  await invoice.save();
  await invoice.populate('room', 'number type price');
  res.json(invoice);
});

exports.deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByIdAndDelete(req.params.id);
  if (!invoice) throw createError(404, 'Invoice not found');
  res.json({ message: 'Invoice deleted' });
});
