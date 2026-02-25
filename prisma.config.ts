import "dotenv/config";

export default {
  schema: "backend/prisma/schema.prisma",
  migrations: {
    path: "backend/prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!, // REQUIRED for migrate dev
  },
};