const mongoose = require('mongoose');
require('dotenv').config(); // Make sure to load env variables

const URL = process.env.MONGO_URI || "mongodb://localhost:27017/TravelMemory-Mern";

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/TravelMemory-Mern", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Optional: Set global promise
mongoose.Promise = global.Promise;

// Connection events (for logging/debug)
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'DB ERROR:'));

module.exports = { db, mongoose };