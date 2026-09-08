// const express = require("express");
// const router = express.Router();

// const User = require("../models/userSchema");
// const Recipe = require("../models/recipeSchema");
// const Order = require("../models/order");
// const Contact = require("../models/contact");


// const { authMiddleware } = require("../middleWares/authMiddleware");
// const { roleMiddleware } = require("../middleWares/roleMiddleware");

// // router.get(
// //   "/stats",
// //   authMiddleware,
// //   roleMiddleware("admin"),
// //   async (req, res) => {
// //     try {
// //       const users = await User.countDocuments();
// //       const recipes = await Recipe.countDocuments();
// //       const orders = await Order.countDocuments();
// //       const contacts = await Contact.countDocuments();

// //       // 💰 Revenue (delivered orders only)
// //       const revenueData = await Order.aggregate([
// //         { $match: { status: "delivered" } },
// //         {
// //           $group: {
// //             _id: null,
// //             total: { $sum: "$totalPrice" }
// //           }
// //         }
// //       ]);

// //       const revenue = revenueData[0]?.total || 0;

// //       // 🚚 Delivery Fees (deliverd orders only)

// //       const deliveryData = await Order.aggregate([
// //         { $match: { status: "delivered" } },
// //         {
// //           $group: {
// //             _id: null,
// //             total: { $sum: "$deliveryFee" }
// //           }
// //         }
// //       ]);

// //       const deliveryFee = deliveryData[0]?.total || 0;

// //       res.json({
// //         users,
// //         recipes,
// //         contacts,
// //         orders,
// //         revenue,
// //         deliveryFee
// //       });

// //     } catch (err) {
// //       res.status(500).json({ message: err.message });
// //     }
// //   }
// // );

// // router.get(
// //   "/stats",
// //   authMiddleware,
// //   roleMiddleware("admin"),
// //   async (req, res) => {
// //     try {
// //       const users = await User.countDocuments();
// //       const recipes = await Recipe.countDocuments();
// //       const orders = await Order.countDocuments();
// //       const contacts = await Contact.countDocuments();

// //       // 💰 Revenue
// //       const revenueData = await Order.aggregate([
// //         { $match: { status: "delivered" } },
// //         {
// //           $group: {
// //             _id: null,
// //             total: { $sum: "$totalPrice" }
// //           }
// //         }
// //       ]);

// //       const revenue = revenueData[0]?.total || 0;

// //       // 🚚 Delivery Fees
// //       const deliveryData = await Order.aggregate([
// //         { $match: { status: "delivered" } },
// //         {
// //           $group: {
// //             _id: null,
// //             total: { $sum: "$deliveryFee" }
// //           }
// //         }
// //       ]);

// //       const deliveryFee = deliveryData[0]?.total || 0;

// //       // 📊 CHART DATA (🔥 أهم جزء)
// //       const chartData = await Order.aggregate([
// //         {
// //           $group: {
// //             _id: {
// //               $dateToString: {
// //                 format: "%Y-%m-%d",
// //                 date: "$createdAt"
// //               }
// //             },
// //             orders: { $sum: 1 },
// //             revenue: { $sum: "$totalPrice" }
// //           }
// //         },
// //         {
// //           $project: {
// //             name: "$_id",
// //             orders: 1,
// //             revenue: 1,
// //             _id: 0
// //           }
// //         },
// //         { $sort: { name: 1 } }
// //       ]);

// //       res.json({
// //         users,
// //         recipes,
// //         contacts,
// //         orders,
// //         revenue,
// //         deliveryFee,
// //         chartData
// //       });

// //     } catch (err) {
// //       res.status(500).json({ message: err.message });
// //     }
// //   }
// // );

// router.get(
//   "/stats",
//   authMiddleware,
//   roleMiddleware("admin"),
//   async (req, res) => {
//     try {
//       const resturantId = req.user.restaurantId; // Assuming the admin has a restaurantId field
//       const users = await User.countDocuments({ restaurantId: resturantId });
//       const recipes = await Recipe.countDocuments({ restaurantId: resturantId });
//       const orders = await Order.countDocuments({ restaurantId: resturantId });
//       const contacts = await Contact.countDocuments();

//       // 💰 Revenue (ONLY delivered)
//       const revenueData = await Order.aggregate([
//         { $match: { status: "delivered", restaurantId: resturantId } },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: "$totalPrice" },
//           },
//         },
//       ]);

//       const revenue = revenueData[0]?.total || 0;

//       // 🚚 Delivery Fees (ONLY delivered)
//       const deliveryData = await Order.aggregate([
//         { $match: { status: "delivered", restaurantId: resturantId } },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: "$deliveryFee" },
//           },
//         },
//       ]);

//       const deliveryFee = deliveryData[0]?.total || 0;

//       // 📊 CHART DATA (ONLY delivered + grouped by day)
//       const chartData = await Order.aggregate([
//         { $match: { status: "delivered", restaurantId: resturantId } },
//         {
//           $group: {
//             _id: {
//               $dateToString: {
//                 format: "%Y-%m-%d",
//                 date: "$createdAt",
//               },
//             },
//             orders: { $sum: 1 },
//             revenue: { $sum: "$totalPrice" },
//           },
//         },
//         {
//           $project: {
//             name: "$_id",
//             orders: 1,
//             revenue: 1,
//             _id: 0,
//           },
//         },
//         { $sort: { name: 1 } },
//       ]);

//       res.json({
//         users,
//         recipes,
//         contacts,
//         orders,
//         revenue,
//         deliveryFee,
//         chartData,
//       });
//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   }
// );

// // get all contacts with socket
// router.get(
//   "/contacts",
//   authMiddleware,
//   roleMiddleware("admin"),
//   async (req, res) => {
//     try {
//       const contacts = await Contact.find().sort({ createdAt: -1 });

//       res.json(contacts);
//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   }
// );

// // delete contact
// router.delete(
//   "/contacts/:id",
//   authMiddleware,
//   roleMiddleware("admin"),
//   async (req, res) => {
//     try {
//       const contact = await Contact.findByIdAndDelete(req.params.id);

//       if (!contact) {
//         return res.status(404).json({ message: "Contact not found" });
//       }

//       // 🔥 SOCKET EMIT
//       const io = req.app.get("io");
//       io.emit("contactDeleted", contact._id);

//       res.json({
//         message: "Contact deleted",
//         contact,
//       });
//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   }
// );

// module.exports = router;



const express = require("express");
const router = express.Router();

const User = require("../models/userSchema");
const Recipe = require("../models/recipeSchema");
const Order = require("../models/order");
const Contact = require("../models/contact");
// const Restaurant = require("../models/restaurantSchema");

const upload = require("../uplods/multer");
const Restaurant = require("../models/Restaurant");

const {
  authMiddleware,
} = require("../middleWares/authMiddleware");

const {
  roleMiddleware,
} = require("../middleWares/roleMiddleware");


// =====================================================
// ADMIN GLOBAL STATS
// =====================================================

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      // ================================
      // BASIC COUNTS
      // ================================

      const users = await User.countDocuments();

      const recipes = await Recipe.countDocuments();

      const orders = await Order.countDocuments();

      const contacts = await Contact.countDocuments();

      const restaurants = await Restaurant.countDocuments();


      // ================================
      // TOTAL REVENUE
      // DELIVERED ORDERS ONLY
      // ================================

      const revenueData = await Order.aggregate([
        {
          $match: {
            status: "delivered",
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: "$totalPrice",
            },
          },
        },
      ]);

      const revenue =
        revenueData[0]?.total || 0;


      // ================================
      // DELIVERY FEES
      // ================================

      const deliveryData = await Order.aggregate([
        {
          $match: {
            status: "delivered",
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: "$deliveryFee",
            },
          },
        },
      ]);

      const deliveryFee =
        deliveryData[0]?.total || 0;


      // ================================
      // CHART DATA
      // ================================

      const chartData = await Order.aggregate([
        {
          $match: {
            status: "delivered",
          },
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },

            orders: {
              $sum: 1,
            },

            revenue: {
              $sum: "$totalPrice",
            },
          },
        },

        {
          $project: {
            _id: 0,

            name: "$_id",

            orders: 1,

            revenue: 1,
          },
        },

        {
          $sort: {
            name: 1,
          },
        },
      ]);


      // ================================
      // RESPONSE
      // ================================

      res.json({
        users,
        recipes,
        contacts,
        orders,
        restaurants,
        revenue,
        deliveryFee,
        chartData,
      });

    } catch (err) {

      console.error("ADMIN STATS ERROR:", err);

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// =====================================================
// ALL RESTAURANTS DAILY STATS
// =====================================================

router.get(
  "/restaurants/daily-stats",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {

    try {

      // ==========================================
      // DATE
      // ==========================================

      const date =
        req.query.date ||
        new Date().toISOString().split("T")[0];


      // ==========================================
      // START OF DAY
      // ==========================================

      const startDate = new Date(`${date}T00:00:00.000`);

      const endDate = new Date(`${date}T23:59:59.999`);


      // ==========================================
      // GET ALL RESTAURANTS
      // ==========================================

      const restaurants = await Restaurant.find()
        .select("_id name image owner")
        .lean();


      // ==========================================
      // GET DAILY ORDERS
      // ==========================================

      const dailyStats = await Order.aggregate([

        {
          $match: {

            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },

            // Only completed orders
            status: "delivered",
          },
        },

        {
          $group: {

            _id: "$restaurantId",

            orders: {
              $sum: 1,
            },

            revenue: {
              $sum: "$totalPrice",
            },

            deliveryFees: {
              $sum: "$deliveryFee",
            },

          },
        },

      ]);


      // ==========================================
      // CONVERT TO MAP
      // ==========================================

      const statsMap = new Map();

      dailyStats.forEach((item) => {

        statsMap.set(
          item._id.toString(),
          {
            orders: item.orders || 0,

            revenue: item.revenue || 0,

            deliveryFees:
              item.deliveryFees || 0,
          }
        );

      });


      // ==========================================
      // MERGE RESTAURANTS + STATS
      // ==========================================

      const result = restaurants.map(
        (restaurant) => {

          const stats =
            statsMap.get(
              restaurant._id.toString()
            ) || {
              orders: 0,
              revenue: 0,
              deliveryFees: 0,
            };


          // ======================================
          // RESTAURANT SALES WITHOUT DELIVERY
          // ======================================

          const restaurantRevenue =
            stats.revenue -
            stats.deliveryFees;


          return {

            restaurantId:
              restaurant._id,

            name:
              restaurant.name,

            image:
              restaurant.image,

            orders:
              stats.orders,

            revenue:
              stats.revenue,

            deliveryFees:
              stats.deliveryFees,

            restaurantRevenue:
              restaurantRevenue,

          };

        }
      );


      // ==========================================
      // TOTALS
      // ==========================================

      const totalOrders =
        result.reduce(
          (sum, restaurant) =>
            sum + restaurant.orders,
          0
        );


      const totalRevenue =
        result.reduce(
          (sum, restaurant) =>
            sum + restaurant.revenue,
          0
        );


      const totalDeliveryFees =
        result.reduce(
          (sum, restaurant) =>
            sum + restaurant.deliveryFees,
          0
        );


      const totalRestaurantRevenue =
        result.reduce(
          (sum, restaurant) =>
            sum + restaurant.restaurantRevenue,
          0
        );


      // ==========================================
      // RESPONSE
      // ==========================================

      res.json({

        date,

        restaurants: result,

        totals: {

          orders:
            totalOrders,

          revenue:
            totalRevenue,

          deliveryFees:
            totalDeliveryFees,

          restaurantRevenue:
            totalRestaurantRevenue,

        },

      });

    } catch (err) {

      console.error(
        "RESTAURANT DAILY STATS ERROR:",
        err
      );

      res.status(500).json({

        message:
          err.message,

      });

    }

  }
);


// =====================================================
// ALL RESTAURANTS TOTAL STATS
// =====================================================

router.get(
  "/restaurants/total-stats",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      // ==========================================
      // GET ALL RESTAURANTS
      // ==========================================

      const restaurants = await Restaurant.find()
        .select("_id name image")
        .lean();

      // ==========================================
      // GET ALL DELIVERED ORDERS
      // ==========================================

      const totalStats = await Order.aggregate([
        {
          $match: {
            status: "delivered",
            restaurantId: {
              $ne: null,
            },
          },
        },

        {
          $group: {
            _id: "$restaurantId",

            orders: {
              $sum: 1,
            },

            totalRevenue: {
              $sum: "$totalPrice",
            },

            totalDeliveryFees: {
              $sum: "$deliveryFee",
            },
          },
        },
      ]);

      // ==========================================
      // CREATE MAP
      // ==========================================

      const statsMap = new Map();

      totalStats.forEach((item) => {
        statsMap.set(item._id.toString(), {
          orders: item.orders || 0,

          totalRevenue: item.totalRevenue || 0,

          totalDeliveryFees:
            item.totalDeliveryFees || 0,
        });
      });

      // ==========================================
      // MERGE RESTAURANTS + STATS
      // ==========================================

      const result = restaurants.map((restaurant) => {
        const stats =
          statsMap.get(
            restaurant._id.toString()
          ) || {
            orders: 0,
            totalRevenue: 0,
            totalDeliveryFees: 0,
          };

        // Revenue without delivery fees
        const restaurantRevenue =
          stats.totalRevenue -
          stats.totalDeliveryFees;

        // Average order
        const averageOrder =
          stats.orders > 0
            ? restaurantRevenue / stats.orders
            : 0;

        return {
          restaurantId: restaurant._id,

          name: restaurant.name,

          image: restaurant.image,

          orders: stats.orders,

          totalRevenue:
            stats.totalRevenue,

          deliveryFees:
            stats.totalDeliveryFees,

          restaurantRevenue,

          averageOrder,
        };
      });

      // ==========================================
      // SORT BY REVENUE
      // ==========================================

      result.sort(
        (a, b) =>
          b.restaurantRevenue -
          a.restaurantRevenue
      );

      // ==========================================
      // GLOBAL TOTALS
      // ==========================================

      const totalOrders =
        result.reduce(
          (sum, restaurant) =>
            sum + restaurant.orders,
          0
        );

      const totalRevenue =
        result.reduce(
          (sum, restaurant) =>
            sum + restaurant.totalRevenue,
          0
        );

      const totalDeliveryFees =
        result.reduce(
          (sum, restaurant) =>
            sum + restaurant.deliveryFees,
          0
        );

      const totalRestaurantRevenue =
        result.reduce(
          (sum, restaurant) =>
            sum +
            restaurant.restaurantRevenue,
          0
        );

      // ==========================================
      // RESPONSE
      // ==========================================

      res.json({
        restaurants: result,

        totals: {
          orders: totalOrders,

          revenue: totalRevenue,

          deliveryFees:
            totalDeliveryFees,

          restaurantRevenue:
            totalRestaurantRevenue,
        },
      });

    } catch (err) {
      console.error(
        "RESTAURANTS TOTAL STATS ERROR:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// =====================================================
// CONTACTS
// =====================================================

router.get(
  "/contacts",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {

    try {

      const contacts =
        await Contact.find()
          .sort({
            createdAt: -1,
          });

      res.json(contacts);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });

    }

  }
);


// =====================================================
// DELETE CONTACT
// =====================================================

router.delete(
  "/contacts/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {

    try {

      const contact =
        await Contact.findByIdAndDelete(
          req.params.id
        );


      if (!contact) {

        return res.status(404).json({

          message:
            "Contact not found",

        });

      }


      const io =
        req.app.get("io");


      if (io) {

        io.emit(
          "contactDeleted",
          contact._id
        );

      }


      res.json({

        message:
          "Contact deleted",

        contact,

      });

    } catch (err) {

      res.status(500).json({

        message:
          err.message,

      });

    }

  }
);


module.exports = router;