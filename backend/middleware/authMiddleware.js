const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/response');
require('dotenv').config()

// ?[MIDDLEWARE] Verify JWT for protected routes (generic, can be used for both student and adviser if token payload is standardized)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // ![ERROR] No token provided
    if (!authHeader) return res.status(401).json(errorResponse("Missing token"));

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(403).json(errorResponse('Invalid or expired token'));
    }
}

// ?[MIDDLEWARE] Verify Student JWT
const verifyStudent = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    // ![ERROR] No token provided
    if (!token) {
        return res.status(401).json(errorResponse('No token provided'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.studentId = decoded.studentId;
        next();
    } catch (err) {
        return res.status(401).json(errorResponse('Invalid or expired token'));
    }
};

// ?[MIDDLEWARE] Verify Adviser JWT
const verifyAdviser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json(errorResponse('No token provided'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.adviserId = decoded.adviserId; // you will need to change token payload later
        next();
    } catch (err) {
        return res.status(401).json(errorResponse('Invalid or expired token'));
    }
};

// ?[MIDDLEWARE] Verify Admin JWT
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // ![ERROR] No token provided
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json(errorResponse('No token provided'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ![ERROR] Non-admin
        if (decoded.role !== 'admin') {
            return res.status(403).json(errorResponse('Admin access required'));
        }
        req.adminId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json(errorResponse('Invalid or expired token'));
    }
};

module.exports = { verifyToken, verifyStudent, verifyAdmin };