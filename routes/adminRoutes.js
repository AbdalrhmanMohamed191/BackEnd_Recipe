const express = require("express");
const router = express.Router();

const User = require("../models/userSchema");
const Recipe = require("../models/recipeSchema");
const Order = require("../models/order");

const { authMiddleware } = require("../middleWares/authMiddleware");
const { roleMiddleware } = require("../middleWares/roleMiddleware");

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const users = await User.countDocuments();
      const recipes = await Recipe.countDocuments();
      const orders = await Order.countDocuments();

      // 💰 Revenue (delivered orders only)
      const revenueData = await Order.aggregate([
        { $match: { status: "delivered" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" }
          }
        }
      ]);

      const revenue = revenueData[0]?.total || 0;

      // 🚚 Delivery Fees (deliverd orders only)

      const deliveryData = await Order.aggregate([
        { $match: { status: "delivered" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$deliveryFee" }
          }
        }
      ]);

      const deliveryFee = deliveryData[0]?.total || 0;

      res.json({
        users,
        recipes,
        orders,
        revenue,
        deliveryFee
      });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;