const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");

async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = auth.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user; // 👈 مهم جدًا
    next();

  } catch (err) {
    console.log("AUTH ERROR:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = { authMiddleware };
