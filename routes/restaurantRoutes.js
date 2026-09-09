// const express = require("express");
// const router = express.Router();

// const bcrypt = require("bcrypt");

// const Restaurant = require("../models/Restaurant");
// const Recipe = require("../models/recipeSchema");
// const User = require("../models/userSchema");
// const Order = require("../models/order");
// const upload = require("../uplods/multer");

// const {
//   authMiddleware,
// } = require("../middleWares/authMiddleware");

// const {
//   roleMiddleware,
// } = require("../middleWares/roleMiddleware");

// // =====================================================
// // SOCKET
// // =====================================================

// const getIo = (req) => req.app.get("io");

// // =====================================================
// // CREATE RESTAURANT + OWNER
// // ADMIN ONLY
// // =====================================================

// router.post(
//   "/",
//   authMiddleware,
//   roleMiddleware("admin"),
//   upload.single("image"),

//   async (req, res) => {
//     try {
//       const {
//         name,
//         description,
//         address,
//         phone,

//         ownerName,
//         ownerEmail,
//         ownerPhone,
//         ownerPassword,
//       } = req.body;

//       // ===============================
//       // VALIDATION
//       // ===============================

//       if (!name) {
//         return res.status(400).json({
//           message: "Restaurant name is required",
//         });
//       }

//       if (
//         !ownerName ||
//         !ownerEmail ||
//         !ownerPhone ||
//         !ownerPassword
//       ) {
//         return res.status(400).json({
//           message: "Owner information is required",
//         });
//       }

//       // ===============================
//       // CHECK EMAIL
//       // ===============================

//       const existingEmail =
//         await User.findOne({
//           email: ownerEmail,
//         });

//       if (existingEmail) {
//         return res.status(400).json({
//           message: "Owner email already exists",
//         });
//       }

//       // ===============================
//       // CHECK PHONE
//       // ===============================

//       const existingPhone =
//         await User.findOne({
//           phone: ownerPhone,
//         });

//       if (existingPhone) {
//         return res.status(400).json({
//           message: "Owner phone already exists",
//         });
//       }

//       // ===============================
//       // HASH PASSWORD
//       // ===============================

//       const hashedPassword =
//         await bcrypt.hash(
//           ownerPassword,
//           10
//         );

//       // ===============================
//       // CREATE OWNER
//       // ===============================

//       const owner = await User.create({
//         name: ownerName,
//         email: ownerEmail,
//         password: hashedPassword,
//         phone: ownerPhone,
//         role: "restaurantOwner",
//       });

//       // ===============================
//       // CREATE RESTAURANT
//       // ===============================

//       const restaurant =
//         await Restaurant.create({
//           name,
//           description: description || "",
//           address: address || "",
//           phone: phone || "",

//           image: req.file
//             ? `/images/${req.file.filename}`
//             : "",

//           owner: owner._id,
//         });

//       // ===============================
//       // LINK OWNER
//       // ===============================

//       owner.restaurantId =
//         restaurant._id;

//       await owner.save();

//       // ===============================
//       // SOCKET
//       // ===============================

//       const io = getIo(req);

//       if (io) {
//         io.emit(
//           "restaurantCreated",
//           {
//             restaurant,

//             owner: {
//               _id: owner._id,
//               name: owner.name,
//               email: owner.email,
//               phone: owner.phone,
//               role: owner.role,
//               restaurantId:
//                 owner.restaurantId,
//             },
//           }
//         );
//       }

//       // ===============================
//       // RESPONSE
//       // ===============================

//       res.status(201).json({
//         message:
//           "Restaurant and owner created successfully",

//         restaurant,

//         owner: {
//           _id: owner._id,
//           name: owner.name,
//           email: owner.email,
//           phone: owner.phone,
//           role: owner.role,
//           restaurantId:
//             owner.restaurantId,
//         },
//       });
//     } catch (err) {
//       console.error(
//         "CREATE RESTAURANT ERROR:",
//         err
//       );

//       res.status(500).json({
//         message: err.message,
//       });
//     }
//   }
// );

// // =====================================================
// // GET ALL RESTAURANTS
// // ADMIN / PUBLIC
// // =====================================================

// router.get("/", async (req, res) => {
//   try {
//     const restaurants =
//       await Restaurant.find()
//         .populate(
//           "owner",
//           "name email phone role restaurantId"
//         )
//         .sort({
//           createdAt: -1,
//         });

//     res.json(restaurants);
//   } catch (err) {
//     console.error(
//       "GET ALL RESTAURANTS ERROR:",
//       err
//     );

//     res.status(500).json({
//       message: err.message,
//     });
//   }
// });

// // =====================================================
// // GET MY RESTAURANT
// // RESTAURANT OWNER
// // =====================================================

// router.get(
//   "/my-restaurant",
//   authMiddleware,
//   roleMiddleware("restaurantOwner"),

//   async (req, res) => {
//     try {
//       // ===============================
//       // CHECK RESTAURANT
//       // ===============================

//       if (!req.user.restaurantId) {
//         return res.status(400).json({
//           message:
//             "You are not assigned to a restaurant",
//         });
//       }

//       // ===============================
//       // GET RESTAURANT
//       // ===============================

//       const restaurant =
//         await Restaurant.findById(
//           req.user.restaurantId
//         ).populate(
//           "owner",
//           "name email phone role restaurantId"
//         );

//       if (!restaurant) {
//         return res.status(404).json({
//           message:
//             "Restaurant not found",
//         });
//       }

//       res.json(restaurant);
//     } catch (err) {
//       console.error(
//         "GET MY RESTAURANT ERROR:",
//         err
//       );

//       res.status(500).json({
//         message: err.message,
//       });
//     }
//   }
// );

// // =====================================================
// // RESTAURANT DASHBOARD STATS
// // RESTAURANT OWNER
// // GET /api/v1/restaurants/dashboard/stats
// // =====================================================

// router.get(
//   "/dashboard/stats",
//   authMiddleware,
//   roleMiddleware("restaurantOwner"),

//   async (req, res) => {
//     try {
//       // =================================================
//       // CHECK RESTAURANT
//       // =================================================

//       if (!req.user.restaurantId) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "You are not assigned to a restaurant",
//         });
//       }

//       const restaurantId =
//         req.user.restaurantId;

//       // =================================================
//       // GET RESTAURANT
//       // =================================================

//       const restaurant =
//         await Restaurant.findById(
//           restaurantId
//         ).lean();

//       if (!restaurant) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Restaurant not found",
//         });
//       }

//       // =================================================
//       // GET ORDERS
//       // =================================================

//       const orders =
//         await Order.find({
//           restaurantId,
//         })
//           .sort({
//             createdAt: -1,
//           })
//           .lean();

//       // =================================================
//       // ORDER STATS
//       // =================================================

//       const totalOrders =
//         orders.length;

//       const pendingOrders =
//         orders.filter(
//           (order) =>
//             order.status === "pending"
//         ).length;

//       const preparingOrders =
//         orders.filter(
//           (order) =>
//             order.status === "preparing"
//         ).length;

//       const deliveredOrders =
//         orders.filter(
//           (order) =>
//             order.status === "delivered"
//         ).length;

//       const cancelledOrders =
//         orders.filter(
//           (order) =>
//             order.status === "cancelled"
//         ).length;

//       // =================================================
//       // REVENUE
//       // DELIVERED ORDERS ONLY
//       // =================================================

//       const totalRevenue =
//         orders
//           .filter(
//             (order) =>
//               order.status === "delivered"
//           )
//           .reduce(
//             (total, order) =>
//               total +
//               Number(
//                 order.totalPrice || 0
//               ),
//             0
//           );

//       // =================================================
//       // RECIPES COUNT
//       // =================================================

//       const recipesCount =
//         await Recipe.countDocuments({
//           restaurantId,
//         });

//       // =================================================
//       // RECENT ORDERS
//       // =================================================

//       const recentOrders =
//         orders
//           .slice(0, 5)
//           .map((order) => ({
//             _id: order._id,
//             name:
//               order.name ||
//               "Customer",
//             phone:
//               order.phone ||
//               "No phone",
//             status:
//               order.status,
//             totalPrice:
//               Number(
//                 order.totalPrice || 0
//               ),
//             itemsCount:
//               order.items?.reduce(
//                 (total, item) =>
//                   total +
//                   Number(
//                     item.quantity || 0
//                   ),
//                 0
//               ) || 0,
//             createdAt:
//               order.createdAt,
//           }));

//       // =================================================
//       // LAST 7 DAYS CHART
//       // =================================================

//       const chartData = [];

//       for (
//         let i = 6;
//         i >= 0;
//         i--
//       ) {
//         const startDate =
//           new Date();

//         startDate.setHours(
//           0,
//           0,
//           0,
//           0
//         );

//         startDate.setDate(
//           startDate.getDate() - i
//         );

//         const endDate =
//           new Date(startDate);

//         endDate.setDate(
//           endDate.getDate() + 1
//         );

//         // =============================================
//         // ORDERS OF THIS DAY
//         // =============================================

//         const dayOrders =
//           orders.filter(
//             (order) => {
//               const orderDate =
//                 new Date(
//                   order.createdAt
//                 );

//               return (
//                 orderDate >=
//                   startDate &&
//                 orderDate <
//                   endDate
//               );
//             }
//           );

//         // =============================================
//         // DAY REVENUE
//         // DELIVERED ONLY
//         // =============================================

//         const dayRevenue =
//           dayOrders
//             .filter(
//               (order) =>
//                 order.status ===
//                 "delivered"
//             )
//             .reduce(
//               (total, order) =>
//                 total +
//                 Number(
//                   order.totalPrice ||
//                     0
//                 ),
//               0
//             );

//         // =============================================
//         // CHART DATA
//         // =============================================

//         chartData.push({
//           name:
//             startDate.toLocaleDateString(
//               "en-EG",
//               {
//                 weekday:
//                   "short",
//               }
//             ),

//           date:
//             startDate
//               .toISOString()
//               .split("T")[0],

//           orders:
//             dayOrders.length,

//           revenue:
//             dayRevenue,
//         });
//       }

//       // =================================================
//       // BEST SELLING PRODUCTS
//       // DELIVERED ORDERS ONLY
//       // =================================================

//       const bestSales =
//         await Order.aggregate([
//           // =============================================
//           // ONLY THIS RESTAURANT + DELIVERED
//           // =============================================

//           {
//             $match: {
//               restaurantId:
//                 restaurantId,

//               status:
//                 "delivered",
//             },
//           },

//           // =============================================
//           // SPLIT ITEMS
//           // =============================================

//           {
//             $unwind:
//               "$items",
//           },

//           // =============================================
//           // GROUP PRODUCTS
//           // =============================================

//           {
//             $group: {
//               _id:
//                 "$items.productId",

//               title: {
//                 $first:
//                   "$items.title",
//               },

//               totalQuantity: {
//                 $sum:
//                   "$items.quantity",
//               },

//               totalRevenue: {
//                 $sum: {
//                   $multiply: [
//                     "$items.price",
//                     "$items.quantity",
//                   ],
//                 },
//               },
//             },
//           },

//           // =============================================
//           // MOST SOLD FIRST
//           // =============================================

//           {
//             $sort: {
//               totalQuantity:
//                 -1,
//             },
//           },

//           // =============================================
//           // TOP 5
//           // =============================================

//           {
//             $limit: 5,
//           },

//           // =============================================
//           // RESPONSE FIELDS
//           // =============================================

//           {
//             $project: {
//               _id: 1,

//               title: 1,

//               totalQuantity: 1,

//               totalRevenue: 1,
//             },
//           },
//         ]);

//       // =================================================
//       // RESPONSE
//       // =================================================

//       res.json({
//         success: true,

//         stats: {
//           // =============================================
//           // RESTAURANT
//           // =============================================

//           restaurant: {
//             _id:
//               restaurant._id,

//             name:
//               restaurant.name,

//             image:
//               restaurant.image,

//             address:
//               restaurant.address,

//             phone:
//               restaurant.phone,
//           },

//           // =============================================
//           // ORDERS
//           // =============================================

//           totalOrders,

//           pendingOrders,

//           preparingOrders,

//           deliveredOrders,

//           cancelledOrders,

//           // =============================================
//           // MONEY
//           // =============================================

//           totalRevenue,

//           // =============================================
//           // MENU
//           // =============================================

//           recipesCount,

//           // =============================================
//           // CHART
//           // =============================================

//           chartData,

//           // =============================================
//           // RECENT ORDERS
//           // =============================================

//           recentOrders,

//           // =============================================
//           // BEST SALES
//           // =============================================

//           bestSales,
//         },
//       });
//     } catch (err) {
//       console.error(
//         "RESTAURANT DASHBOARD ERROR:",
//         err
//       );

//       res.status(500).json({
//         success: false,

//         message:
//           "Failed to load restaurant dashboard",

//         error:
//           process.env.NODE_ENV ===
//           "development"
//             ? err.message
//             : undefined,
//       });
//     }
//   }
// );

// // =====================================================
// // UPDATE MY RESTAURANT
// // RESTAURANT OWNER
// // =====================================================

// router.put(
//   "/my-restaurant",
//   authMiddleware,
//   roleMiddleware("restaurantOwner"),
//   upload.single("image"),

//   async (req, res) => {
//     try {
//       // ===============================
//       // CHECK RESTAURANT ID
//       // ===============================

//       if (!req.user.restaurantId) {
//         return res.status(400).json({
//           message:
//             "You are not assigned to a restaurant",
//         });
//       }

//       // ===============================
//       // FIND RESTAURANT
//       // ===============================

//       const restaurant =
//         await Restaurant.findById(
//           req.user.restaurantId
//         );

//       if (!restaurant) {
//         return res.status(404).json({
//           message:
//             "Restaurant not found",
//         });
//       }

//       // ===============================
//       // UPDATE TEXT DATA
//       // ===============================

//       if (req.body.name !== undefined) {
//         restaurant.name =
//           req.body.name;
//       }

//       if (
//         req.body.description !==
//         undefined
//       ) {
//         restaurant.description =
//           req.body.description;
//       }

//       if (
//         req.body.address !==
//         undefined
//       ) {
//         restaurant.address =
//           req.body.address;
//       }

//       if (
//         req.body.phone !==
//         undefined
//       ) {
//         restaurant.phone =
//           req.body.phone;
//       }

//       // ===============================
//       // UPDATE IMAGE ONLY
//       // IF NEW IMAGE EXISTS
//       // ===============================

//       if (req.file) {
//         restaurant.image =
//           `/images/${req.file.filename}`;
//       }

//       // ===============================
//       // SAVE
//       // ===============================

//       await restaurant.save();

//       // ===============================
//       // GET UPDATED
//       // ===============================

//       const updatedRestaurant =
//         await Restaurant.findById(
//           restaurant._id
//         ).populate(
//           "owner",
//           "name email phone role restaurantId"
//         );

//       // ===============================
//       // SOCKET
//       // ===============================

//       const io = getIo(req);

//       if (io) {
//         io.emit(
//           "restaurantUpdated",
//           updatedRestaurant
//         );
//       }

//       // ===============================
//       // RESPONSE
//       // ===============================

//       res.json({
//         message:
//           "Restaurant updated successfully",

//         restaurant:
//           updatedRestaurant,
//       });
//     } catch (err) {
//       console.error(
//         "UPDATE MY RESTAURANT ERROR:",
//         err
//       );

//       res.status(500).json({
//         message: err.message,
//       });
//     }
//   }
// );

// // =====================================================
// // GET RESTAURANT MENU
// // PUBLIC
// // =====================================================

// router.get(
//   "/:id/menu",
//   async (req, res) => {
//     try {
//       const recipes =
//         await Recipe.find({
//           restaurantId:
//             req.params.id,
//         })
//           .populate(
//             "restaurantId",
//             "name image address phone"
//           )
//           .sort({
//             createdAt: -1,
//           });

//       res.json(recipes);
//     } catch (err) {
//       console.error(
//         "GET RESTAURANT MENU ERROR:",
//         err
//       );

//       res.status(500).json({
//         message: err.message,
//       });
//     }
//   }
// );

// // =====================================================
// // GET ONE RESTAURANT
// // PUBLIC
// // =====================================================

// router.get(
//   "/:id",
//   async (req, res) => {
//     try {
//       const restaurant =
//         await Restaurant.findById(
//           req.params.id
//         ).populate(
//           "owner",
//           "name email phone role restaurantId"
//         );

//       if (!restaurant) {
//         return res.status(404).json({
//           message:
//             "Restaurant not found",
//         });
//       }

//       res.json(restaurant);
//     } catch (err) {
//       console.error(
//         "GET ONE RESTAURANT ERROR:",
//         err
//       );

//       res.status(500).json({
//         message: err.message,
//       });
//     }
//   }
// );

// // =====================================================
// // UPDATE RESTAURANT
// // ADMIN ONLY
// // =====================================================

// router.put(
//   "/:id",
//   authMiddleware,
//   roleMiddleware("admin"),
//   upload.single("image"),

//   async (req, res) => {
//     try {
//       // ===============================
//       // FIND
//       // ===============================

//       const restaurant =
//         await Restaurant.findById(
//           req.params.id
//         );

//       if (!restaurant) {
//         return res.status(404).json({
//           message:
//             "Restaurant not found",
//         });
//       }

//       // ===============================
//       // UPDATE TEXT
//       // ===============================

//       if (req.body.name !== undefined) {
//         restaurant.name =
//           req.body.name;
//       }

//       if (
//         req.body.description !==
//         undefined
//       ) {
//         restaurant.description =
//           req.body.description;
//       }

//       if (
//         req.body.address !==
//         undefined
//       ) {
//         restaurant.address =
//           req.body.address;
//       }

//       if (
//         req.body.phone !==
//         undefined
//       ) {
//         restaurant.phone =
//           req.body.phone;
//       }

//       // ===============================
//       // NEW IMAGE ONLY
//       // ===============================

//       if (req.file) {
//         restaurant.image =
//           `/images/${req.file.filename}`;
//       }

//       // ===============================
//       // NEVER CHANGE OWNER
//       // ===============================

//       await restaurant.save();

//       // ===============================
//       // POPULATE
//       // ===============================

//       const updated =
//         await Restaurant.findById(
//           restaurant._id
//         ).populate(
//           "owner",
//           "name email phone role restaurantId"
//         );

//       // ===============================
//       // SOCKET
//       // ===============================

//       const io = getIo(req);

//       if (io) {
//         io.emit(
//           "restaurantUpdated",
//           updated
//         );
//       }

//       // ===============================
//       // RESPONSE
//       // ===============================

//       res.json({
//         message:
//           "Restaurant updated successfully",

//         restaurant: updated,
//       });
//     } catch (err) {
//       console.error(
//         "UPDATE RESTAURANT ERROR:",
//         err
//       );

//       res.status(500).json({
//         message: err.message,
//       });
//     }
//   }
// );

// // =====================================================
// // DELETE RESTAURANT
// // ADMIN ONLY
// // =====================================================

// router.delete(
//   "/:id",
//   authMiddleware,
//   roleMiddleware("admin"),

//   async (req, res) => {
//     try {
//       // ===============================
//       // FIND RESTAURANT
//       // ===============================

//       const restaurant =
//         await Restaurant.findById(
//           req.params.id
//         );

//       if (!restaurant) {
//         return res.status(404).json({
//           message:
//             "Restaurant not found",
//         });
//       }

//       // ===============================
//       // DELETE
//       // ===============================

//       await Restaurant.findByIdAndDelete(
//         req.params.id
//       );

//       // ===============================
//       // RESET OWNER
//       // ===============================

//       await User.updateMany(
//         {
//           restaurantId:
//             req.params.id,

//           role: "restaurantOwner",
//         },
//         {
//           $set: {
//             restaurantId: null,
//             role: "user",
//           },
//         }
//       );

//       // ===============================
//       // SOCKET
//       // ===============================

//       const io = getIo(req);

//       if (io) {
//         io.emit(
//           "restaurantDeleted",
//           req.params.id
//         );
//       }

//       // ===============================
//       // RESPONSE
//       // ===============================

//       res.json({
//         message:
//           "Restaurant deleted successfully",
//       });
//     } catch (err) {
//       console.error(
//         "DELETE RESTAURANT ERROR:",
//         err
//       );

//       res.status(500).json({
//         message: err.message,
//       });
//     }
//   }
// );

// module.exports = router;

//////  


const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const stream = require("stream");

const Restaurant = require("../models/Restaurant");
const Recipe = require("../models/recipeSchema");
const User = require("../models/userSchema");
const Order = require("../models/order");

const upload = require("../uplods/multer");
const cloudinary = require("../config/cloudinary");

const {
  authMiddleware,
} = require("../middleWares/authMiddleware");

const {
  roleMiddleware,
} = require("../middleWares/roleMiddleware");

// =====================================================
// SOCKET
// =====================================================

const getIo = (req) => req.app.get("io");

// =====================================================
// CLOUDINARY UPLOAD HELPER
// =====================================================

const uploadToCloudinary = (
  buffer,
  folder = "famy/restaurants"
) => {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        }
      );

    const readableStream =
      new stream.Readable();

    readableStream.push(buffer);
    readableStream.push(null);

    readableStream.pipe(uploadStream);
  });
};

// =====================================================
// CREATE RESTAURANT + OWNER
// ADMIN ONLY
// =====================================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  upload.single("image"),

  async (req, res) => {
    try {
      const {
        name,
        description,
        address,
        phone,

        ownerName,
        ownerEmail,
        ownerPhone,
        ownerPassword,
      } = req.body;

      // ===============================
      // VALIDATION
      // ===============================

      if (!name) {
        return res.status(400).json({
          message:
            "Restaurant name is required",
        });
      }

      if (
        !ownerName ||
        !ownerEmail ||
        !ownerPhone ||
        !ownerPassword
      ) {
        return res.status(400).json({
          message:
            "Owner information is required",
        });
      }

      // ===============================
      // CHECK EMAIL
      // ===============================

      const existingEmail =
        await User.findOne({
          email: ownerEmail,
        });

      if (existingEmail) {
        return res.status(400).json({
          message:
            "Owner email already exists",
        });
      }

      // ===============================
      // CHECK PHONE
      // ===============================

      const existingPhone =
        await User.findOne({
          phone: ownerPhone,
        });

      if (existingPhone) {
        return res.status(400).json({
          message:
            "Owner phone already exists",
        });
      }

      // ===============================
      // HASH PASSWORD
      // ===============================

      const hashedPassword =
        await bcrypt.hash(
          ownerPassword,
          10
        );

      // ===============================
      // CREATE OWNER
      // ===============================

      const owner =
        await User.create({
          name: ownerName,
          email: ownerEmail,
          password: hashedPassword,
          phone: ownerPhone,
          role: "restaurantOwner",
        });

      // ===============================
      // UPLOAD IMAGE
      // ===============================

      let imageUrl = "";

      if (req.file) {
        const result =
          await uploadToCloudinary(
            req.file.buffer,
            "famy/restaurants"
          );

        imageUrl =
          result.secure_url;
      }

      // ===============================
      // CREATE RESTAURANT
      // ===============================

      const restaurant =
        await Restaurant.create({
          name,
          description:
            description || "",
          address:
            address || "",
          phone:
            phone || "",

          image: imageUrl,

          owner: owner._id,
        });

      // ===============================
      // LINK OWNER
      // ===============================

      owner.restaurantId =
        restaurant._id;

      await owner.save();

      // ===============================
      // SOCKET
      // ===============================

      const io = getIo(req);

      if (io) {
        io.emit(
          "restaurantCreated",
          {
            restaurant,

            owner: {
              _id: owner._id,
              name: owner.name,
              email: owner.email,
              phone: owner.phone,
              role: owner.role,
              restaurantId:
                owner.restaurantId,
            },
          }
        );
      }

      // ===============================
      // RESPONSE
      // ===============================

      res.status(201).json({
        message:
          "Restaurant and owner created successfully",

        restaurant,

        owner: {
          _id: owner._id,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
          role: owner.role,
          restaurantId:
            owner.restaurantId,
        },
      });
    } catch (err) {
      console.error(
        "CREATE RESTAURANT ERROR:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// =====================================================
// GET ALL RESTAURANTS
// ADMIN / PUBLIC
// =====================================================

router.get("/", async (req, res) => {
  try {
    const restaurants =
      await Restaurant.find()
        .populate(
          "owner",
          "name email phone role restaurantId"
        )
        .sort({
          createdAt: -1,
        });

    res.json(restaurants);
  } catch (err) {
    console.error(
      "GET ALL RESTAURANTS ERROR:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
});

// =====================================================
// GET MY RESTAURANT
// RESTAURANT OWNER
// =====================================================

router.get(
  "/my-restaurant",
  authMiddleware,
  roleMiddleware("restaurantOwner"),

  async (req, res) => {
    try {
      // ===============================
      // CHECK RESTAURANT
      // ===============================

      if (!req.user.restaurantId) {
        return res.status(400).json({
          message:
            "You are not assigned to a restaurant",
        });
      }

      // ===============================
      // GET RESTAURANT
      // ===============================

      const restaurant =
        await Restaurant.findById(
          req.user.restaurantId
        ).populate(
          "owner",
          "name email phone role restaurantId"
        );

      if (!restaurant) {
        return res.status(404).json({
          message:
            "Restaurant not found",
        });
      }

      res.json(restaurant);
    } catch (err) {
      console.error(
        "GET MY RESTAURANT ERROR:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// =====================================================
// RESTAURANT DASHBOARD STATS
// RESTAURANT OWNER
// GET /api/v1/restaurants/dashboard/stats
// =====================================================

router.get(
  "/dashboard/stats",
  authMiddleware,
  roleMiddleware("restaurantOwner"),

  async (req, res) => {
    try {
      // =================================================
      // CHECK RESTAURANT
      // =================================================

      if (!req.user.restaurantId) {
        return res.status(400).json({
          success: false,
          message:
            "You are not assigned to a restaurant",
        });
      }

      const restaurantId =
        req.user.restaurantId;

      // =================================================
      // GET RESTAURANT
      // =================================================

      const restaurant =
        await Restaurant.findById(
          restaurantId
        ).lean();

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message:
            "Restaurant not found",
        });
      }

      // =================================================
      // GET ORDERS
      // =================================================

      const orders =
        await Order.find({
          restaurantId,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      // =================================================
      // ORDER STATS
      // =================================================

      const totalOrders =
        orders.length;

      const pendingOrders =
        orders.filter(
          (order) =>
            order.status === "pending"
        ).length;

      const preparingOrders =
        orders.filter(
          (order) =>
            order.status === "preparing"
        ).length;

      const deliveredOrders =
        orders.filter(
          (order) =>
            order.status === "delivered"
        ).length;

      const cancelledOrders =
        orders.filter(
          (order) =>
            order.status === "cancelled"
        ).length;

      // =================================================
      // REVENUE
      // DELIVERED ORDERS ONLY
      // =================================================

      const totalRevenue =
        orders
          .filter(
            (order) =>
              order.status === "delivered"
          )
          .reduce(
            (total, order) =>
              total +
              Number(
                order.totalPrice || 0
              ),
            0
          );

      // =================================================
      // RECIPES COUNT
      // =================================================

      const recipesCount =
        await Recipe.countDocuments({
          restaurantId,
        });

      // =================================================
      // RECENT ORDERS
      // =================================================

      const recentOrders =
        orders
          .slice(0, 5)
          .map((order) => ({
            _id: order._id,

            name:
              order.name ||
              "Customer",

            phone:
              order.phone ||
              "No phone",

            status:
              order.status,

            totalPrice:
              Number(
                order.totalPrice || 0
              ),

            itemsCount:
              order.items?.reduce(
                (total, item) =>
                  total +
                  Number(
                    item.quantity || 0
                  ),
                0
              ) || 0,

            createdAt:
              order.createdAt,
          }));

      // =================================================
      // LAST 7 DAYS CHART
      // =================================================

      const chartData = [];

      for (
        let i = 6;
        i >= 0;
        i--
      ) {
        const startDate =
          new Date();

        startDate.setHours(
          0,
          0,
          0,
          0
        );

        startDate.setDate(
          startDate.getDate() - i
        );

        const endDate =
          new Date(startDate);

        endDate.setDate(
          endDate.getDate() + 1
        );

        // =============================================
        // ORDERS OF THIS DAY
        // =============================================

        const dayOrders =
          orders.filter(
            (order) => {
              const orderDate =
                new Date(
                  order.createdAt
                );

              return (
                orderDate >=
                  startDate &&
                orderDate <
                  endDate
              );
            }
          );

        // =============================================
        // DAY REVENUE
        // DELIVERED ONLY
        // =============================================

        const dayRevenue =
          dayOrders
            .filter(
              (order) =>
                order.status ===
                "delivered"
            )
            .reduce(
              (total, order) =>
                total +
                Number(
                  order.totalPrice ||
                    0
                ),
              0
            );

        // =============================================
        // CHART DATA
        // =============================================

        chartData.push({
          name:
            startDate.toLocaleDateString(
              "en-EG",
              {
                weekday:
                  "short",
              }
            ),

          date:
            startDate
              .toISOString()
              .split("T")[0],

          orders:
            dayOrders.length,

          revenue:
            dayRevenue,
        });
      }

      // =================================================
      // BEST SELLING PRODUCTS
      // DELIVERED ORDERS ONLY
      // =================================================

      const bestSales =
        await Order.aggregate([
          // =============================================
          // ONLY THIS RESTAURANT + DELIVERED
          // =============================================

          {
            $match: {
              restaurantId:
                restaurantId,

              status:
                "delivered",
            },
          },

          // =============================================
          // SPLIT ITEMS
          // =============================================

          {
            $unwind:
              "$items",
          },

          // =============================================
          // GROUP PRODUCTS
          // =============================================

          {
            $group: {
              _id:
                "$items.productId",

              title: {
                $first:
                  "$items.title",
              },

              totalQuantity: {
                $sum:
                  "$items.quantity",
              },

              totalRevenue: {
                $sum: {
                  $multiply: [
                    "$items.price",
                    "$items.quantity",
                  ],
                },
              },
            },
          },

          // =============================================
          // MOST SOLD FIRST
          // =============================================

          {
            $sort: {
              totalQuantity:
                -1,
            },
          },

          // =============================================
          // TOP 5
          // =============================================

          {
            $limit: 5,
          },

          // =============================================
          // RESPONSE FIELDS
          // =============================================

          {
            $project: {
              _id: 1,

              title: 1,

              totalQuantity: 1,

              totalRevenue: 1,
            },
          },
        ]);

      // =================================================
      // RESPONSE
      // =================================================

      res.json({
        success: true,

        stats: {
          // =============================================
          // RESTAURANT
          // =============================================

          restaurant: {
            _id:
              restaurant._id,

            name:
              restaurant.name,

            image:
              restaurant.image,

            address:
              restaurant.address,

            phone:
              restaurant.phone,
          },

          // =============================================
          // ORDERS
          // =============================================

          totalOrders,

          pendingOrders,

          preparingOrders,

          deliveredOrders,

          cancelledOrders,

          // =============================================
          // MONEY
          // =============================================

          totalRevenue,

          // =============================================
          // MENU
          // =============================================

          recipesCount,

          // =============================================
          // CHART
          // =============================================

          chartData,

          // =============================================
          // RECENT ORDERS
          // =============================================

          recentOrders,

          // =============================================
          // BEST SALES
          // =============================================

          bestSales,
        },
      });
    } catch (err) {
      console.error(
        "RESTAURANT DASHBOARD ERROR:",
        err
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to load restaurant dashboard",

        error:
          process.env.NODE_ENV ===
          "development"
            ? err.message
            : undefined,
      });
    }
  }
);

// =====================================================
// UPDATE MY RESTAURANT
// RESTAURANT OWNER
// =====================================================

router.put(
  "/my-restaurant",
  authMiddleware,
  roleMiddleware("restaurantOwner"),
  upload.single("image"),

  async (req, res) => {
    try {
      // ===============================
      // CHECK RESTAURANT ID
      // ===============================

      if (!req.user.restaurantId) {
        return res.status(400).json({
          message:
            "You are not assigned to a restaurant",
        });
      }

      // ===============================
      // FIND RESTAURANT
      // ===============================

      const restaurant =
        await Restaurant.findById(
          req.user.restaurantId
        );

      if (!restaurant) {
        return res.status(404).json({
          message:
            "Restaurant not found",
        });
      }

      // ===============================
      // UPDATE TEXT DATA
      // ===============================

      if (
        req.body.name !==
        undefined
      ) {
        restaurant.name =
          req.body.name;
      }

      if (
        req.body.description !==
        undefined
      ) {
        restaurant.description =
          req.body.description;
      }

      if (
        req.body.address !==
        undefined
      ) {
        restaurant.address =
          req.body.address;
      }

      if (
        req.body.phone !==
        undefined
      ) {
        restaurant.phone =
          req.body.phone;
      }

      // ===============================
      // UPDATE IMAGE
      // CLOUDINARY
      // ===============================

      if (req.file) {
        const result =
          await uploadToCloudinary(
            req.file.buffer,
            "famy/restaurants"
          );

        restaurant.image =
          result.secure_url;
      }

      // ===============================
      // SAVE
      // ===============================

      await restaurant.save();

      // ===============================
      // GET UPDATED
      // ===============================

      const updatedRestaurant =
        await Restaurant.findById(
          restaurant._id
        ).populate(
          "owner",
          "name email phone role restaurantId"
        );

      // ===============================
      // SOCKET
      // ===============================

      const io = getIo(req);

      if (io) {
        io.emit(
          "restaurantUpdated",
          updatedRestaurant
        );
      }

      // ===============================
      // RESPONSE
      // ===============================

      res.json({
        message:
          "Restaurant updated successfully",

        restaurant:
          updatedRestaurant,
      });
    } catch (err) {
      console.error(
        "UPDATE MY RESTAURANT ERROR:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// =====================================================
// GET RESTAURANT MENU
// PUBLIC
// =====================================================

router.get(
  "/:id/menu",
  async (req, res) => {
    try {
      const recipes =
        await Recipe.find({
          restaurantId:
            req.params.id,
        })
          .populate(
            "restaurantId",
            "name image address phone"
          )
          .sort({
            createdAt: -1,
          });

      res.json(recipes);
    } catch (err) {
      console.error(
        "GET RESTAURANT MENU ERROR:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// =====================================================
// GET ONE RESTAURANT
// PUBLIC
// =====================================================

router.get(
  "/:id",
  async (req, res) => {
    try {
      const restaurant =
        await Restaurant.findById(
          req.params.id
        ).populate(
          "owner",
          "name email phone role restaurantId"
        );

      if (!restaurant) {
        return res.status(404).json({
          message:
            "Restaurant not found",
        });
      }

      res.json(restaurant);
    } catch (err) {
      console.error(
        "GET ONE RESTAURANT ERROR:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// =====================================================
// UPDATE RESTAURANT
// ADMIN ONLY
// =====================================================

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  upload.single("image"),

  async (req, res) => {
    try {
      // ===============================
      // FIND
      // ===============================

      const restaurant =
        await Restaurant.findById(
          req.params.id
        );

      if (!restaurant) {
        return res.status(404).json({
          message:
            "Restaurant not found",
        });
      }

      // ===============================
      // UPDATE TEXT
      // ===============================

      if (
        req.body.name !==
        undefined
      ) {
        restaurant.name =
          req.body.name;
      }

      if (
        req.body.description !==
        undefined
      ) {
        restaurant.description =
          req.body.description;
      }

      if (
        req.body.address !==
        undefined
      ) {
        restaurant.address =
          req.body.address;
      }

      if (
        req.body.phone !==
        undefined
      ) {
        restaurant.phone =
          req.body.phone;
      }

      // ===============================
      // NEW IMAGE
      // CLOUDINARY
      // ===============================

      if (req.file) {
        const result =
          await uploadToCloudinary(
            req.file.buffer,
            "famy/restaurants"
          );

        restaurant.image =
          result.secure_url;
      }

      // ===============================
      // NEVER CHANGE OWNER
      // ===============================

      await restaurant.save();

      // ===============================
      // POPULATE
      // ===============================

      const updated =
        await Restaurant.findById(
          restaurant._id
        ).populate(
          "owner",
          "name email phone role restaurantId"
        );

      // ===============================
      // SOCKET
      // ===============================

      const io = getIo(req);

      if (io) {
        io.emit(
          "restaurantUpdated",
          updated
        );
      }

      // ===============================
      // RESPONSE
      // ===============================

      res.json({
        message:
          "Restaurant updated successfully",

        restaurant: updated,
      });
    } catch (err) {
      console.error(
        "UPDATE RESTAURANT ERROR:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// =====================================================
// DELETE RESTAURANT
// ADMIN ONLY
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),

  async (req, res) => {
    try {
      // ===============================
      // FIND RESTAURANT
      // ===============================

      const restaurant =
        await Restaurant.findById(
          req.params.id
        );

      if (!restaurant) {
        return res.status(404).json({
          message:
            "Restaurant not found",
        });
      }

      // ===============================
      // DELETE
      // ===============================

      await Restaurant.findByIdAndDelete(
        req.params.id
      );

      // ===============================
      // RESET OWNER
      // ===============================

      await User.updateMany(
        {
          restaurantId:
            req.params.id,

          role: "restaurantOwner",
        },
        {
          $set: {
            restaurantId: null,
            role: "user",
          },
        }
      );

      // ===============================
      // SOCKET
      // ===============================

      const io = getIo(req);

      if (io) {
        io.emit(
          "restaurantDeleted",
          req.params.id
        );
      }

      // ===============================
      // RESPONSE
      // ===============================

      res.json({
        message:
          "Restaurant deleted successfully",
      });
    } catch (err) {
      console.error(
        "DELETE RESTAURANT ERROR:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

module.exports = router;