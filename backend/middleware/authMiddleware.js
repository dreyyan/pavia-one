const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/response');
require('dotenv').config()

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

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

module.exports = { verifyToken };