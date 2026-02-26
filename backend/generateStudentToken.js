// generateStudentToken.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

const studentId = 1; // Student's DB ID

const token = jwt.sign(
  { studentId },
  process.env.JWT_SECRET,
  { expiresIn: '16h' }
);

console.log(token);