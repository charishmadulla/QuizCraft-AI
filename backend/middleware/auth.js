const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET =
  process.env.JWT_SECRET || "quizcraft_jwt_secret_token_secure_2026";

// Protect routes: verifies token and attaches authenticated user
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found or account no longer exists.",
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error("Auth token verification failed:", error.message);
      return res.status(401).json({
        success: false,
        message: "Session expired or invalid token. Please log in again.",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Authentication token required.",
    });
  }
};

module.exports = { protect };
