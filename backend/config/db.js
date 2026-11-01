const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hotel_management';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message}`);
    console.error('Is MongoDB running, and is MONGO_URI correct in your .env file?');
    throw err;
  }
};

module.exports = connectDB;
