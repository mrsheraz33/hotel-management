const Staff = require('../models/Staff');
const { asyncHandler, createError } = require('../middleware/errorMiddleware');

exports.getStaff = asyncHandler(async (req, res) => {
  res.json(await Staff.find().sort({ createdAt: -1 }));
});

exports.getStaffMember = asyncHandler(async (req, res) => {
  const member = await Staff.findById(req.params.id);
  if (!member) throw createError(404, 'Staff member not found');
  res.json(member);
});

exports.createStaff = asyncHandler(async (req, res) => {
  res.status(201).json(await Staff.create(req.body));
});

exports.updateStaff = asyncHandler(async (req, res) => {
  const member = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!member) throw createError(404, 'Staff member not found');
  res.json(member);
});

exports.deleteStaff = asyncHandler(async (req, res) => {
  const member = await Staff.findByIdAndDelete(req.params.id);
  if (!member) throw createError(404, 'Staff member not found');
  res.json({ message: 'Staff member deleted' });
});
