const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
require("dotenv").config();
const path = require("path");

const app = express();
const server = http.createServer(app);

// =====================
// ENV
// =====================
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigin = isProduction
  ? process.env.PROD_CLIENT_URL
  : process.env.CLIENT_URL;

// =====================
// MIDDLEWARE
// =====================
app.use(express.json());

app.use(
  cors({
    
    origin: allowedOrigin ,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE" , "OPTIONS"],
    credentials: true,
  })
);

// =====================
// STATIC FILES
// =====================
app.use(
  "/images",
  express.static(path.join(__dirname, "public/images"))
);

// =====================
// SOCKET.IO
// =====================
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ Connected:", socket.id);

  socket.on("joinUser", (userId) => socket.join(userId));
  socket.on("joinAdmin", () => socket.join("adminRoom"));

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

// =====================
// ROUTES
// =====================
app.use("/api/v1/orders", require("./routes/orderRoutes"));
app.use("/api/v1/users", require("./routes/userRoutes"));
app.use("/api/v1/recipes", require("./routes/recipeRoutes"));
app.use("/api/v1/admin", require("./routes/adminRoutes"));
app.use("/api/v1/contact", require("./routes/contactRoutes"));
app.use("/api/v1/book", require("./routes/bookingRoutes"));
// app.use("/api/v1/offers", require("./routes/offersRoutes"));
app.use("/api/v1/offers", require("./routes/offersRoutes"));

// =====================
// DB
// =====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 DB Connected"))
  .catch((err) => console.log("🔴 DB Error:", err));

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("Restaurant API Ready");
});
server.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT} in ${
      isProduction ? "production" : "development"
    } mode`
  );
});