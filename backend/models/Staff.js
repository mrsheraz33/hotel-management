const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    role: { type: String, enum: ['manager', 'receptionist', 'chef', 'cleaner', 'security'], required: [true, 'Role is required'] },
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    salary: { type: Number, required: [true, 'Salary is required'], min: 0 },
    joinDate: { type: Date, required: [true, 'Join date is required'] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);
