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
        req.lrn = decoded.lrn;
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
        req.adviserId = decoded.adviserId;
        next();
    } catch (err) {
        return res.status(401).json(errorResponse('Invalid or expired token'));
    }
};

// ?[MIDDLEWARE] Verify Admin JWT
function verifyAdmin(req, res, next) {
    // ?[READ TOKEN] Expect "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized: token missing' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // ?[DECODE TOKEN] Must match payload { adminId, role }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || decoded.role !== 'admin' || !decoded.adminId) {
            return res.status(401).json({ success: false, message: 'Unauthorized: invalid token' });
        }

        // ?[ATTACH] adminId to request
        req.adminId = decoded.adminId;
        next();
    } catch (err) {
        console.error('[DEBUG] verifyAdmin error:', err.message);
        return res.status(401).json({ success: false, message: 'Unauthorized: invalid token' });
    }
}

module.exports = { verifyToken, verifyStudent, verifyAdviser, verifyAdmin };