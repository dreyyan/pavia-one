import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "backend/prisma/schema.prisma",
  migrations: {
    path: "backend/prisma/migrations",
  },
  datasource: {
    adapter: {
      url: process.env.DATABASE_URL, // <-- Prisma CLI / Migrate reads it from here
    },
  },
});