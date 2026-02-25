require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import the shared singleton Prisma instance
const prisma = require('./lib/prisma');  // ← note: ./lib (since server.js is in backend/)

const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Routes
app.use('/api/student', require('./routes/student'));
app.use('/api/adviser', require('./routes/adviser'));
app.use('/api/auth', require('./routes/auth'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Optional: export prisma for other modules if needed (e.g. seeding scripts)
module.exports = { prisma };