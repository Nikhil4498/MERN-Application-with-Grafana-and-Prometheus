const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection file
const conn = require('./conn');

app.use(express.json());
app.use(cors());

const client = require('prom-client');
client.collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

// Routes
const tripRoutes = require('./routes/trip.routes');
app.use('/trip', tripRoutes); // http://localhost:3001/trip

// Test route
app.get('/hello', (req, res) => {
  res.send('Hello World!');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server started at http://localhost:${PORT}`);
});