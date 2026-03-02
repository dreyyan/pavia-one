require('dotenv').config({ path: __dirname + '/.env' });
const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not defined. Make sure your .env file has JWT_SECRET");
  process.exit(1);
}

const token = jwt.sign(
  { adminId: 1, role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '16h' }
);

console.log("Admin token:", token);