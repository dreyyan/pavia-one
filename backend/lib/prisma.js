require('dotenv').config();

const { PrismaClient } = require('@prisma/client');   // Prisma Client for database interactions
const { PrismaPg } = require('@prisma/adapter-pg');   // Prisma adapter for PostgreSQL using connection pooling
const { Pool } = require('pg');                       // Node's PostgreSQL client for connection pooling

// Ensure DATABASE_URL is set in environment variables
const connectionString = process.env.DATABASE_URL;

// Throw an error if DATABASE_URL is not provided
if (!connectionString) {
  throw new Error('DATABASE_URL is missing in .env');
}

// Set up PostgreSQL connection pool and Prisma adapter
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Create a singleton Prisma Client instance
let prisma;

// This ensures that we reuse the same Prisma Client instance across the entire application, which is crucial for performance and resource management, especially when using connection pooling.
if (!global.prisma) {
  global.prisma = new PrismaClient({ adapter });
}

// Export the singleton Prisma Client instance for use in other modules
prisma = global.prisma;

module.exports = prisma;