// generateAdviserToken.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

// Replace with the adviser's DB ID you want to generate a token for
const adviserId = "2026-0002";

const token = jwt.sign(
  { adviserId },
  process.env.JWT_SECRET,
  { expiresIn: '16h' }
);

console.log(token);