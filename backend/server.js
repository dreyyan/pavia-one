require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { prisma } = require('./lib/prisma');
const app = express();

// [MIDDLEWARE] CORS and JSON parsing
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// [REQUEST LOGGING]
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth/index'));
app.use('/api/adviser', require('./routes/adviser/index'));
app.use('/api/admin', require('./routes/admin/index'));

// [ERROR HANDLING]
app.use((err, req, res, next) => {
  console.error(err); // only log the error object
  res.status(err.status || 500).json({ error: err.message || "Something went wrong" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

module.exports = { prisma };