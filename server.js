// // // const express = require("express");
// // // const http = require("http");
// // // const cors = require("cors");
// // // const mongoose = require("mongoose");
// // // const { Server } = require("socket.io");
// // // require("dotenv").config();
// // // const path = require("path");

// // // const app = express();
// // // const server = http.createServer(app);

// // // app.use(express.json());
// // // app.use(cors({ origin: "*" }));
// // // app.use("/images", express.static(path.join(__dirname, "public/images")));

// // // // SOCKET
// // // const io = new Server(server, {
// // //   cors: { origin: "*" },
// // // });

// // // app.set("io", io);

// // // io.on("connection", (socket) => {
// // //   console.log("⚡ Connected:", socket.id);

// // //   socket.on("joinUser", (userId) => socket.join(userId));
// // //   socket.on("joinAdmin", () => socket.join("adminRoom"));

// // //   socket.on("disconnect", () => {
// // //     console.log("❌ Disconnected:", socket.id);
// // //   });
// // // });

// // // // ROUTES
// // // const recipeRoutes = require("./routes/recipeRoutes");
// // // const orderRoutes = require("./routes/orderRoutes");
// // // const userRoutes = require("./routes/userRoutes");
// // // const adminRoutes = require("./routes/adminRoutes");

// // // app.use("/api/v1/orders", orderRoutes);
// // // app.use("/api/v1/users", userRoutes);
// // // app.use("/api/v1/recipes", recipeRoutes);
// // // app.use("/api/v1/admin", adminRoutes);

// // // // DB
// // // mongoose.connect(process.env.MONGO_URI)
// // //   .then(() => console.log("🟢 DB Connected"))
// // //   .catch(console.log);

// // // // START
// // // const PORT = process.env.PORT || 5000;

// // // server.listen(PORT, () => {
// // //   console.log("🚀 Running on", PORT);
// // // });


// const express = require("express");
// const http = require("http");
// const cors = require("cors");
// const mongoose = require("mongoose");
// const { Server } = require("socket.io");
// require("dotenv").config();
// const path = require("path");

// const app = express();
// const server = http.createServer(app);

// // 1. تحديد الرابط المسموح به من ملف الـ .env
// const allowedOrigin = process.env.CLIENT_ORIGIN || "*"; 

// app.use(express.json());


// app.use(cors({
//   origin: allowedOrigin,
//   credentials: true
// }));

// app.use("/images", express.static(path.join(__dirname, "public/images")));

// // 3. تحديث SOCKET لتستخدم الرابط المحدد
// const io = new Server(server, {
//   cors: { 
//     origin: '*',
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true
//   },
// });

// app.set("io", io);

// io.on("connection", (socket) => {
//   console.log("⚡ Connected:", socket.id);
//   socket.on("joinUser", (userId) => socket.join(userId));
//   socket.on("joinAdmin", () => socket.join("adminRoom"));
//   socket.on("disconnect", () => {
//     console.log("❌ Disconnected:", socket.id);
//   });
// });

// // ROUTES
// const recipeRoutes = require("./routes/recipeRoutes");
// const orderRoutes = require("./routes/orderRoutes");
// const userRoutes = require("./routes/userRoutes");
// const adminRoutes = require("./routes/adminRoutes");

// app.use("/api/v1/orders", orderRoutes);
// app.use("/api/v1/users", userRoutes);
// app.use("/api/v1/recipes", recipeRoutes);
// app.use("/api/v1/admin", adminRoutes);

// app.get("/", (req, res) => {
//   res.send("Restaurant API Ready");
// });


// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("🟢 DB Connected"))
//   .catch(err => console.log("🔴 DB Error:", err));

// // START
// const PORT = process.env.PORT || 5000;

// server.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
// });


// // const express = require("express");
// // const http = require("http");
// // const cors = require("cors");
// // const mongoose = require("mongoose");
// // const { Server } = require("socket.io");
// // require("dotenv").config();
// // const path = require("path");

// // const app = express();
// // const server = http.createServer(app);

// // const allowedOrigin = process.env.CLIENT_ORIGIN || "*"; 

// // app.use(express.json());
// // app.use(cors({
// //   origin: allowedOrigin,
// //   credentials: true
// // }));

// // // إعداد المسارات الثابتة (Static)
// // app.use("/images", express.static(path.join(__dirname, "public/images")));

// // // SOCKET.IO (تنبيه: لن يعمل بشكل دائم على فيرسيل)
// // const io = new Server(server, {
// //   cors: { 
// //     origin: allowedOrigin,
// //     methods: ["GET", "POST", "PUT", "DELETE"],
// //     credentials: true
// //   },
// //   addTrailingSlash: false // مهم لـ Vercel
// // });

// // app.set("io", io);

// // io.on("connection", (socket) => {
// //   console.log("⚡ Connected:", socket.id);
// //   socket.on("joinUser", (userId) => socket.join(userId));
// //   socket.on("joinAdmin", () => socket.join("adminRoom"));
// // });

// // // ROUTES
// // app.use("/api/v1/orders", require("./routes/orderRoutes"));
// // app.use("/api/v1/users", require("./routes/userRoutes"));
// // app.use("/api/v1/recipes", require("./routes/recipeRoutes"));
// // app.use("/api/v1/admin", require("./routes/adminRoutes"));

// // app.get("/", (req, res) => {
// //   res.send("Restaurant API Ready");
// // });

// // // توصيل الداتا بيز (بدون .listen داخل الـ then)
// // mongoose.connect(process.env.MONGO_URI)
// //   .then(() => console.log("🟢 DB Connected"))
// //   .catch(err => console.log("🔴 DB Error:", err));

// // // تصدير السيرفر (مهم جداً لفيرسيل)
// // module.exports = server;

// // const express = require("express");
// // const cors = require("cors");
// // const mongoose = require("mongoose");
// // require("dotenv").config();
// // const path = require("path");

// // const app = express();

// // // ================= CONFIG =================
// // const allowedOrigin = process.env.CLIENT_ORIGIN || "*";

// // // ================= MIDDLEWARE =================
// // app.use(express.json());
// // app.use(cors({
// //   origin: allowedOrigin,
// //   credentials: true
// // }));

// // // ================= STATIC FILES =================
// // app.use("/images", express.static(path.join(__dirname, "../public/images")));

// // // ================= TEST ROUTE =================
// // app.get("/", (req, res) => {
// //   res.send("Restaurant API Ready 🚀");
// // });

// // app.get("/test", (req, res) => {
// //   res.json({ status: "ok", message: "Backend working ✅" });
// // });

// // // ================= ROUTES =================
// // app.use("/api/v1/orders", require("./routes/orderRoutes"));
// // app.use("/api/v1/users", require("./routes/userRoutes"));
// // app.use("/api/v1/recipes", require("./routes/recipeRoutes"));
// // app.use("/api/v1/admin", require("./routes/adminRoutes"));

// // // ================= SOCKET (OPTIONAL TEST ONLY) =================
// // let io;

// // try {
// //   const { Server } = require("socket.io");

// //   io = new Server({
// //     cors: {
// //       origin: allowedOrigin,
// //       methods: ["GET", "POST"],
// //       credentials: true
// //     }
// //   });

// //   app.set("io", io);

// //   console.log("🟡 Socket initialized (may fallback to polling)");

// // } catch (err) {
// //   console.log("🔴 Socket disabled on Vercel");
// // }

// // // ================= DB CONNECTION =================
// // mongoose.connect(process.env.MONGO_URI)
// //   .then(() => console.log("🟢 DB Connected"))
// //   .catch(err => console.log("🔴 DB Error:", err));

// // // ================= EXPORT =================
// // module.exports = app;



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
    origin: allowedOrigin,
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

app.get("/", (req, res) => {
  res.send("Restaurant API Ready");
});

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

server.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT} in ${
      isProduction ? "production" : "development"
    } mode`
  );
});