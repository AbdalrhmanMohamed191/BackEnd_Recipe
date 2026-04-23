const express = require("express");
const router = express.Router();

const User = require("../models/userSchema");
const Recipe = require("../models/recipeSchema");
const Order = require("../models/order");
const Contact = require("../models/contact");


const { authMiddleware } = require("../middleWares/authMiddleware");
const { roleMiddleware } = require("../middleWares/roleMiddleware");

// router.get(
//   "/stats",
//   authMiddleware,
//   roleMiddleware("admin"),
//   async (req, res) => {
//     try {
//       const users = await User.countDocuments();
//       const recipes = await Recipe.countDocuments();
//       const orders = await Order.countDocuments();
//       const contacts = await Contact.countDocuments();

//       // 💰 Revenue (delivered orders only)
//       const revenueData = await Order.aggregate([
//         { $match: { status: "delivered" } },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: "$totalPrice" }
//           }
//         }
//       ]);

//       const revenue = revenueData[0]?.total || 0;

//       // 🚚 Delivery Fees (deliverd orders only)

//       const deliveryData = await Order.aggregate([
//         { $match: { status: "delivered" } },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: "$deliveryFee" }
//           }
//         }
//       ]);

//       const deliveryFee = deliveryData[0]?.total || 0;

//       res.json({
//         users,
//         recipes,
//         contacts,
//         orders,
//         revenue,
//         deliveryFee
//       });

//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   }
// );

// router.get(
//   "/stats",
//   authMiddleware,
//   roleMiddleware("admin"),
//   async (req, res) => {
//     try {
//       const users = await User.countDocuments();
//       const recipes = await Recipe.countDocuments();
//       const orders = await Order.countDocuments();
//       const contacts = await Contact.countDocuments();

//       // 💰 Revenue
//       const revenueData = await Order.aggregate([
//         { $match: { status: "delivered" } },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: "$totalPrice" }
//           }
//         }
//       ]);

//       const revenue = revenueData[0]?.total || 0;

//       // 🚚 Delivery Fees
//       const deliveryData = await Order.aggregate([
//         { $match: { status: "delivered" } },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: "$deliveryFee" }
//           }
//         }
//       ]);

//       const deliveryFee = deliveryData[0]?.total || 0;

//       // 📊 CHART DATA (🔥 أهم جزء)
//       const chartData = await Order.aggregate([
//         {
//           $group: {
//             _id: {
//               $dateToString: {
//                 format: "%Y-%m-%d",
//                 date: "$createdAt"
//               }
//             },
//             orders: { $sum: 1 },
//             revenue: { $sum: "$totalPrice" }
//           }
//         },
//         {
//           $project: {
//             name: "$_id",
//             orders: 1,
//             revenue: 1,
//             _id: 0
//           }
//         },
//         { $sort: { name: 1 } }
//       ]);

//       res.json({
//         users,
//         recipes,
//         contacts,
//         orders,
//         revenue,
//         deliveryFee,
//         chartData
//       });

//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   }
// );

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const users = await User.countDocuments();
      const recipes = await Recipe.countDocuments();
      const orders = await Order.countDocuments();
      const contacts = await Contact.countDocuments();

      // 💰 Revenue (ONLY delivered)
      const revenueData = await Order.aggregate([
        { $match: { status: "delivered" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" },
          },
        },
      ]);

      const revenue = revenueData[0]?.total || 0;

      // 🚚 Delivery Fees (ONLY delivered)
      const deliveryData = await Order.aggregate([
        { $match: { status: "delivered" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$deliveryFee" },
          },
        },
      ]);

      const deliveryFee = deliveryData[0]?.total || 0;

      // 📊 CHART DATA (ONLY delivered + grouped by day)
      const chartData = await Order.aggregate([
        { $match: { status: "delivered" } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            orders: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
          },
        },
        {
          $project: {
            name: "$_id",
            orders: 1,
            revenue: 1,
            _id: 0,
          },
        },
        { $sort: { name: 1 } },
      ]);

      res.json({
        users,
        recipes,
        contacts,
        orders,
        revenue,
        deliveryFee,
        chartData,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// get all contacts with socket
router.get(
  "/contacts",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const contacts = await Contact.find().sort({ createdAt: -1 });

      res.json(contacts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// delete contact
router.delete(
  "/contacts/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const contact = await Contact.findByIdAndDelete(req.params.id);

      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      // 🔥 SOCKET EMIT
      const io = req.app.get("io");
      io.emit("contactDeleted", contact._id);

      res.json({
        message: "Contact deleted",
        contact,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;