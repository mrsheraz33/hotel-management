require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Room = require('./models/Room');
const Guest = require('./models/Guest');
const Booking = require('./models/Booking');
const Invoice = require('./models/Invoice');
const Staff = require('./models/Staff');

const day = (offset) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};

const seed = async () => {
  await connectDB();
  console.log('\nClearing old data...');
  await Promise.all([User, Room, Guest, Booking, Invoice, Staff].map((m) => m.deleteMany({})));

  // Users (passwords are hashed by the model)
  const users = [];
  for (const u of [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'reception', password: 'recep123', role: 'receptionist' },
    { username: 'staff', password: 'staff123', role: 'staff' },
  ]) users.push(await User.create(u));
  console.log('\nUsers created:');
  console.table(users.map((u) => ({ username: u.username, role: u.role })));

  // Rooms
  const rooms = await Room.insertMany([
    { number: '101', type: 'Single', price: 5000, capacity: 1, status: 'available', floor: '1', amenities: 'WiFi, AC, TV' },
    { number: '102', type: 'Single', price: 5000, capacity: 1, status: 'booked', floor: '1', amenities: 'WiFi, AC, TV' },
    { number: '103', type: 'Double', price: 8000, capacity: 2, status: 'available', floor: '1', amenities: 'WiFi, AC, TV, Mini fridge' },
    { number: '104', type: 'Double', price: 8000, capacity: 2, status: 'cleaning', floor: '1', amenities: 'WiFi, AC, TV, Mini fridge' },
    { number: '201', type: 'Deluxe', price: 12000, capacity: 3, status: 'booked', floor: '2', amenities: 'WiFi, AC, TV, Balcony' },
    { number: '202', type: 'Deluxe', price: 12000, capacity: 3, status: 'available', floor: '2', amenities: 'WiFi, AC, TV, Balcony' },
    { number: '203', type: 'Deluxe', price: 12000, capacity: 3, status: 'maintenance', floor: '2', amenities: 'WiFi, AC, TV, Balcony' },
    { number: '301', type: 'Suite', price: 25000, capacity: 4, status: 'booked', floor: '3', amenities: 'WiFi, AC, TV, Lounge, Jacuzzi' },
    { number: '302', type: 'Suite', price: 25000, capacity: 4, status: 'available', floor: '3', amenities: 'WiFi, AC, TV, Lounge, Jacuzzi' },
  ]);
  console.log(`\nRooms created: ${rooms.length}`);
  console.table(rooms.map((r) => ({ number: r.number, type: r.type, price: r.price, status: r.status })));
  const room = (n) => rooms.find((r) => r.number === n);

  // Guests
  const guests = await Guest.insertMany([
    { name: 'Ali Raza', phone: '0300-1112233', cnic: '35202-1234567-1', email: 'ali.raza@example.com', address: 'Model Town, Lahore' },
    { name: 'Sara Khan', phone: '0321-4445566', cnic: '61101-7654321-2', email: 'sara.khan@example.com', address: 'F-8, Islamabad' },
    { name: 'Usman Tariq', phone: '0333-7778899', cnic: '42101-1122334-5', email: 'usman.t@example.com', address: 'Clifton, Karachi' },
    { name: 'Ayesha Malik', phone: '0345-2223344', cnic: '33100-9988776-4', email: 'ayesha.m@example.com', address: 'Satellite Town, Sahiwal' },
    { name: 'Hamza Sheikh', phone: '0302-5556677', cnic: '34101-5566778-9', email: 'hamza.s@example.com', address: 'Cantt, Multan' },
  ]);
  console.log(`\nGuests created: ${guests.length}`);

  // Bookings (nights / amount computed like the API does)
  const mk = (guestName, phone, rm, inOff, outOff, status) => {
    const nights = outOff - inOff;
    return { guestName, phone, room: rm._id, checkIn: day(inOff), checkOut: day(outOff), nights, amount: nights * rm.price, status, createdBy: users[1]._id };
  };
  const bookings = await Booking.insertMany([
    mk('Ali Raza', '0300-1112233', room('102'), -1, 2, 'checkedin'),
    mk('Sara Khan', '0321-4445566', room('201'), 0, 3, 'confirmed'),
    mk('Usman Tariq', '0333-7778899', room('301'), -2, 1, 'checkedin'),
    mk('Ayesha Malik', '0345-2223344', room('103'), 5, 7, 'pending'),
    mk('Hamza Sheikh', '0302-5556677', room('101'), -10, -8, 'cancelled'),
  ]);
  console.log(`\nBookings created: ${bookings.length}`);
  console.table(bookings.map((b) => ({ guest: b.guestName, nights: b.nights, amount: b.amount, status: b.status })));

  // Invoices
  const invoices = await Invoice.insertMany([
    { invoiceNo: 'INV-0001', guestName: 'Ali Raza', room: room('102')._id, nights: 3, extra: 1500, amount: 3 * 5000 + 1500, status: 'paid', date: day(0) },
    { invoiceNo: 'INV-0002', guestName: 'Sara Khan', room: room('201')._id, nights: 3, extra: 0, amount: 3 * 12000, status: 'unpaid', date: day(0) },
    { invoiceNo: 'INV-0003', guestName: 'Usman Tariq', room: room('301')._id, nights: 3, extra: 4000, amount: 3 * 25000 + 4000, status: 'paid', date: day(-1) },
    { invoiceNo: 'INV-0004', guestName: 'Hamza Sheikh', room: room('101')._id, nights: 2, extra: 500, amount: 2 * 5000 + 500, status: 'paid', date: day(-9) },
  ]);
  console.log(`\nInvoices created: ${invoices.length}`);

  // Staff
  const staff = await Staff.insertMany([
    { name: 'Imran Siddiqui', role: 'manager', phone: '0300-9000001', salary: 120000, joinDate: new Date('2022-03-01') },
    { name: 'Fatima Noor', role: 'receptionist', phone: '0300-9000002', salary: 55000, joinDate: new Date('2023-06-15') },
    { name: 'Chef Bashir', role: 'chef', phone: '0300-9000003', salary: 80000, joinDate: new Date('2021-11-10') },
    { name: 'Rukhsana Bibi', role: 'cleaner', phone: '0300-9000004', salary: 32000, joinDate: new Date('2024-01-20') },
    { name: 'Zahid Mehmood', role: 'security', phone: '0300-9000005', salary: 38000, joinDate: new Date('2023-09-05') },
  ]);
  console.log(`\nStaff created: ${staff.length}`);

  console.log('\nSeed complete. Login with:');
  console.log('  admin / admin123   |   reception / recep123   |   staff / staff123\n');
};

seed()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
