const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
require("dotenv").config();
const path = require("path");

const app = express();

// =====================================================
// ENV
// =====================================================

// const isProduction = process.env.NODE_ENV === "production";

// const allowedOrigin = isProduction
//   ? process.env.PROD_CLIENT_URL
//   : process.env.CLIENT_URL;


const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL === "1" ||
  process.env.VERCEL === "true";

const allowedOrigin = isProduction
  ? process.env.PROD_CLIENT_URL
  : process.env.CLIENT_URL;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());

app.use(
  cors({
    origin: allowedOrigin || "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// =====================================================
// STATIC FILES
// =====================================================

app.use(
  "/images",
  express.static(path.join(__dirname, "public/images"))
);

// =====================================================
// SOCKET.IO
// =====================================================

let io = null;
let server = null;

if (!process.env.VERCEL) {
  server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: allowedOrigin || "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
    },
  });

  app.set("io", io);

  io.on("connection", (socket) => {
    console.log("⚡ Connected:", socket.id);

    socket.on("joinUser", (userId) => {
      if (userId) {
        socket.join(userId);
      }
    });

    socket.on("joinAdmin", () => {
      socket.join("adminRoom");
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
    });
  });
} else {
  // Vercel Serverless لا يشغل Socket.IO server
  app.set("io", null);
}

// =====================================================
// DATABASE CONNECTION
// =====================================================

let isDBConnected = false;

const connectDB = async () => {
  // لو متصل بالفعل
  if (
    isDBConnected &&
    mongoose.connection.readyState === 1
  ) {
    return;
  }

  // تأكد أن الـ URI موجود
  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is missing from environment variables"
    );
  }

  try {
    // لو mongoose متصل بالفعل
    if (mongoose.connection.readyState === 1) {
      isDBConnected = true;
      return;
    }

    await mongoose.connect(process.env.MONGO_URI);

    isDBConnected = true;

    console.log("🟢 MongoDB Connected");
  } catch (error) {
    isDBConnected = false;

    console.error(
      "🔴 MongoDB Connection Error:",
      error.message
    );

    throw error;
  }
};

// =====================================================
// DATABASE MIDDLEWARE
// =====================================================
//
// مهم:
// الاتصال بالـ MongoDB يحصل قبل تنفيذ الـ routes.
// =====================================================

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(
      "❌ Database Middleware Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// =====================================================
// ROUTES
// =====================================================

app.use(
  "/api/v1/orders",
  require("./routes/orderRoutes")
);

app.use(
  "/api/v1/users",
  require("./routes/UserRoutes")
);

app.use(
  "/api/v1/recipes",
  require("./routes/RecipeRoutes")
);

app.use(
  "/api/v1/admin",
  require("./routes/adminRoutes")
);

app.use(
  "/api/v1/contact",
  require("./routes/contactRoutes")
);

app.use(
  "/api/v1/book",
  require("./routes/bookingRoutes")
);

app.use(
  "/api/v1/offers",
  require("./routes/offersRoutes")
);

app.use(
  "/api/v1/restaurants",
  require("./routes/restaurantRoutes")
);

app.use(
  "/api/v1/loyalty",
  require("./routes/loyaltyRoutes")
);

// =====================================================
// ROOT ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Restaurant API Ready",
    environment: isProduction
      ? "production"
      : "development",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// =====================================================
// 404
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message:
      err.message || "Internal Server Error",
  });
});

// =====================================================
// LOCAL SERVER
// =====================================================

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(
      `🚀 Server running on port ${PORT} in ${
        isProduction
          ? "production"
          : "development"
      } mode`
    );
  });
}

// =====================================================
// VERCEL EXPORT
// =====================================================

module.exports = app;