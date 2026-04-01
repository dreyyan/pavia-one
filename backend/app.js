require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { prisma } = require("./lib/prisma");

const app = express();

// [MIDDLEWARE] CORS and JSON parsing
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// [MIDDLEWARE] Request logging
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// [ROUTES] Main
app.use("/api/auth", require("./routes/auth/index"));
app.use("/api/adviser", require("./routes/adviser/index"));
app.use("/api/admin", require("./routes/admin/index"));

// [MIDDLEWARE] 404 Not Found
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// [MIDDLEWARE] Error Handling
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Something went wrong" });
});

module.exports = { app, prisma };
