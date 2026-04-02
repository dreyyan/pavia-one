// [IMPORT] Setup
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { errorResponse } = require("../utils/response");

// [MIDDLEWARE] Generic token verification
const verifyToken =
  (allowedRoles = []) =>
  async (req, res, next) => {
    try {
      if (req.method === "OPTIONS") return next();

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json(errorResponse("Unauthorized: token missing"));
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("[DEBUG] decoded:", decoded);

      if (!decoded || (!decoded.role && allowedRoles.length > 0)) {
        return res.status(403).json(errorResponse("Invalid token payload"));
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res
          .status(403)
          .json(errorResponse("Access denied: insufficient role"));
      }

      let user;
      if (decoded.role === "admin") {
        user = await prisma.admin.findUnique({
          where: { id: decoded.adminId },
        });
        if (!user)
          return res.status(403).json(errorResponse("Admin not found"));
        req.user = { id: user.id, role: "admin", email: user.email };
        req.adminId = user.id;
      } else if (decoded.role === "adviser") {
        user = await prisma.adviser.findUnique({
          where: { adviserId: decoded.adviserId },
        });
        if (!user)
          return res.status(403).json(errorResponse("Adviser not found"));
        req.user = { id: user.id, role: "adviser", email: user.email };
        req.adviserId = user.adviserId;
      }

      next();
    } catch (err) {
      console.error("[JWT VERIFY ERROR]", err.message || err);
      return res.status(401).json(errorResponse("Invalid or expired token"));
    }
  };

// [EXPORTS] Convenience middlewares
const verifyAdviser = verifyToken(["adviser"]);
const verifyAdmin = verifyToken(["admin"]);

module.exports = { verifyToken, verifyAdviser, verifyAdmin };
