require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

// Serve the frontend from the same server
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/guests', require('./routes/guestRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Landing / login page
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

app.use('/api', notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();
