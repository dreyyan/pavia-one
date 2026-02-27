// generateStudentToken.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

const studentLRN = "117591120149";

const token = jwt.sign(
  { lrn: studentLRN },
  process.env.JWT_SECRET,
  { expiresIn: '16h' }
);

console.log(token);