require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./lib/prisma');
const app = express();

// [MIDDLEWARE] CORS and JSON parsing
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Routes
app.use('/api/student', require('./routes/student'));
app.use('/api/adviser', require('./routes/adviser'));
app.use('/api/admin/students', require('./routes/admin/students'));
app.use('/api/admin/advisers', require('./routes/admin/advisers'));
app.use('/api/admin/sections', require('./routes/admin/sections'));
app.use('/api/auth/students', require('./routes/auth/students'));
app.use('/api/auth/advisers', require('./routes/auth/advisers'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = { prisma };