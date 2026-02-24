// [IMPORT] Database
const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

// [IMPORT] Tools
require('dotenv').config()

// [IMPORT] Express.js
const express = require('express')
const cors = require('cors')
const app = express()

// [IMPORT] Routers
const studentRoutes = require('./routes/student')
const adviserRoutes = require('./routes/adviser')
const authRoutes = require('./routes/auth')

// =================================================================
// (1)[MIDDLEWARE] Parse incoming JSON request bodies
app.use(express.json())

// (2)[MIDDLEWARE] Allow request from React frontend
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
}));

// (3)[MIDDLEWARE] Custom error handling
app.use((err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.status || 500;
    const errorMessage = err.message || "Something went wrong";

    res.status(statusCode).json(errorResponse(errorMessage));
});

// =================================================================
// [ROUTES]
app.use('/api/student', studentRoutes);
app.use('/api/auth', authRoutes);

// =================================================================
// [LISTENER] Start HTTP server
app.listen(process.env.PORT, () => {
    console.log(`Express.js server started at ${process.env.PORT}`)
})