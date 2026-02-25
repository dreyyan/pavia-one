require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { adminId: 1, role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '16h' }
);

console.log(token);