// [IMPORT] Setup
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { errorResponse } = require("../utils/response");

// [MIDDLEWARE] Generic token verification
const verifyToken =
  (allowedRoles = []) =>
  async (req, res, next) => {
    try {
      // ? Skip preflight requests
      if (req.method === "OPTIONS") return next();

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json(errorResponse("Unauthorized: token missing"));
      }

      const token = authHeader.split(" ")[1];

      // ? Decode JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("[DEBUG] authHeader:", authHeader);
      console.log("[DEBUG] token:", token);
      console.log("[DEBUG] decoded:", decoded);
      // ! Ensure required payload exists
      if (!decoded || (!decoded.role && allowedRoles.length > 0)) {
        return res.status(403).json(errorResponse("Invalid token payload"));
      }

      // ? Role check if roles are specified
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res
          .status(403)
          .json(errorResponse("Access denied: insufficient role"));
      }

      // ? Attach role-specific identifiers and fetch user from DB
      let user;
      if (decoded.role === "admin") {
        user = await prisma.admin.findUnique({
          where: { id: decoded.adminId },
        });

        if (!user)
          return res.status(403).json(errorResponse("Admin not found"));

        // * Attach user info
        req.user = { id: user.id, role: "admin", email: user.email };

        // * Attach convenience property for dashboard.js
        req.adminId = user.id; // this allows req.adminId to exist
      } else if (decoded.role === "adviser") {
        user = await prisma.adviser.findUnique({
          where: { id: decoded.adviserId },
        });

        if (!user)
          return res.status(403).json(errorResponse("Adviser not found"));

        req.user = { id: user.id, role: "adviser", email: user.email };
        req.adviserId = user.id; // optional
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
