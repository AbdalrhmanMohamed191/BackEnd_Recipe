const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const { authMiddleware } = require("../middleWares/authMiddleware");
const User = require("../models/userSchema");


// ================= CREATE ORDER =================
// router.post("/create", authMiddleware, async (req, res) => {
//   try {
//         let totalPrice = items.reduce((acc, item) => {
//       return acc + item.price * item.quantity;
//     }, 0);
//     const { items, totalPrice  , address} = req.body;

//     if (!items || items.length === 0) {
//       return res.status(400).json({ message: "Cart is empty" });
//     }
//     if (!address || !address.street || !address.city) {
//   return res.status(400).json({ message: "Address is required" });
// }

//     const order = await Order.create({
//       userId: req.user._id,
//       items,
//       totalPrice,
//       status: "pending",
//       address
//     });

//     const fullOrder = await Order.findById(order._id)
//       .populate("userId", "name phone");

//     const io = req.app.get("io");

//     io.to(req.user._id.toString()).emit("orderCreated", fullOrder);
//     io.to("adminRoom").emit("orderCreated", fullOrder);

//     res.status(201).json(fullOrder);

//   } catch (err) {
//     console.log("CREATE ORDER ERROR:", err);
//     res.status(500).json({ message: err.message });
//   }
// });

router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { items, address } = req.body;
    // validation
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!address?.street || !address?.city) {
      return res.status(400).json({ message: "Address is required" });
    }

    //  CALCULATE TOTAL 
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const deliveryFee = 15; 
    //  CALCULATE TOTAL 
    const totalPrice = subtotal + deliveryFee;

    // CREATE ORDER
    const order = await Order.create({
      userId: req.user._id,
      items,
      totalPrice,
      phone : req.user.phone,
      status: "pending",
      address,
      deliveryFee,
    });

    const fullOrder = await Order.findById(order._id).populate(
      "userId",
      "name phone"
    );

    // SOCKET
    const io = req.app.get("io");

    if (io) {
      io.to(req.user._id.toString()).emit("orderCreated", fullOrder);
      io.to("adminRoom").emit("orderCreated", fullOrder);
    }

    // RESPONSE
    res.status(201).json(fullOrder);

  } catch (err) {
    console.log("CREATE ORDER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


// ================= GET MY ORDERS =================
router.get("/myorders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("userId", "name phone")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ================= GET ALL ORDERS (ADMIN ONLY) =================
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ isArchived: false })
      .populate("userId", "name phone")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ================= UPDATE STATUS =================
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = ["pending", "preparing", "delivered", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id)
      .populate("userId", "name phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    const io = req.app.get("io");

    io.to(order.userId._id.toString()).emit("orderUpdated", order);
    io.to("adminRoom").emit("orderUpdated", order);

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ================= DELETE ORDER =================
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const io = req.app.get("io");
    io.to("adminRoom").emit("orderDeleted", order);

    res.json({ message: "Order deleted", order });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ================= ARCHIVE ONE =================
router.put("/archive/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ================= ARCHIVE ALL =================
router.put("/archive-all", authMiddleware, async (req, res) => {
  try {
    await Order.updateMany({}, { isArchived: true });

    res.json({ message: "All orders archived" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;