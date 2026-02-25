// backend/lib/prisma.js
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in .env');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Singleton pattern (prevents multiple instances in dev with hot-reload)
let prisma;

if (!global.prisma) {
  global.prisma = new PrismaClient({ adapter });
}

prisma = global.prisma;

module.exports = prisma;