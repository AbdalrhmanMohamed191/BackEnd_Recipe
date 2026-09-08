const express = require("express");
const router = express.Router();

const Order = require("../models/order");
const Recipe = require("../models/recipeSchema");
const Offer = require("../models/offerSchema");

const { authMiddleware } = require("../middleWares/authMiddleware");
const { roleMiddleware } = require("../middleWares/roleMiddleware");


// =====================================================
// CREATE ORDER
// USER
// =====================================================

// router.post("/create", authMiddleware, async (req, res) => {
//   try {
//     const {
//       items,
//       address,
//       paymentMethod,
//     } = req.body;


//     // ===============================
//     // VALIDATION
//     // ===============================

//     if (!Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({
//         message: "Cart is empty",
//       });
//     }

//     if (!address?.street || !address?.city) {
//       return res.status(400).json({
//         message: "Address is required",
//       });
//     }


//     // ===============================
//     // GET PRODUCTS FROM DATABASE
//     // ===============================

//     let processedItems = [];

//     let restaurantId = null;


//     for (const item of items) {

//       const product = await Recipe.findById(item.productId);

//       if (!product) {
//         return res.status(404).json({
//           message: `Product not found: ${item.productId}`,
//         });
//       }


//       // ===============================
//       // RESTAURANT CHECK
//       // ===============================

//       if (!restaurantId) {
//         restaurantId = product.restaurantId;
//       }


//       // ممنوع أوردر من أكتر من مطعم
//       if (
//         product.restaurantId.toString() !==
//         restaurantId.toString()
//       ) {
//         return res.status(400).json({
//           message: "You can only order from one restaurant at a time",
//         });
//       }


//       // ===============================
//       // VARIANT
//       // ===============================

//       let selectedVariant = null;

//       if (item.variant?.name) {

//         selectedVariant = product.variants.find(
//           (variant) =>
//             variant.name === item.variant.name
//         );

//         if (!selectedVariant) {
//           return res.status(400).json({
//             message: `Variant not found for ${product.title}`,
//           });
//         }
//       }


//       // ===============================
//       // PRICE
//       // ===============================

//       const price = selectedVariant
//         ? selectedVariant.price
//         : product.price;


//       if (price === undefined || price === null) {
//         return res.status(400).json({
//           message: `Price not found for ${product.title}`,
//         });
//       }


//       // ===============================
//       // ADD ITEM
//       // ===============================

//       processedItems.push({
//         productId: product._id,

//         title: product.title,

//         price: Number(price),

//         variant: selectedVariant
//           ? {
//               name: selectedVariant.name,
//               price: Number(selectedVariant.price),
//             }
//           : null,

//         quantity: Number(item.quantity) || 1,
//       });
//     }


//     // ===============================
//     // CALCULATE SUBTOTAL
//     // ===============================

//     const subtotal = processedItems.reduce(
//       (total, item) => {
//         return total + item.price * item.quantity;
//       },
//       0
//     );


//     // ===============================
//     // DELIVERY
//     // ===============================

//     const deliveryFee = 15;


//     // ===============================
//     // TOTAL
//     // ===============================

//     const totalPrice =
//       subtotal + deliveryFee;


//     // ===============================
//     // CREATE ORDER
//     // ===============================

//     const order = await Order.create({

//       userId: req.user._id,

//       name: req.user.name,

//       phone: req.user.phone,

//       restaurantId,

//       items: processedItems,

//       totalPrice,

//       deliveryFee,

//       paymentMethod:
//         paymentMethod === "card"
//           ? "card"
//           : "cash",

//       isPaid:
//         paymentMethod === "card",

//       address,

//       status: "pending",
//     });


//     // ===============================
//     // POPULATE
//     // ===============================

//     const fullOrder =
//       await Order.findById(order._id)
//         .populate(
//           "userId",
//           "name email phone"
//         )
//         .populate(
//           "restaurantId",
//           "name image address phone"
//         );


//     // ===============================
//     // SOCKET
//     // ===============================

//     const io = req.app.get("io");

//     if (io) {

//       // User
//       io
//         .to(req.user._id.toString())
//         .emit(
//           "orderCreated",
//           fullOrder
//         );


//       // Admin
//       io
//         .to("adminRoom")
//         .emit(
//           "orderCreated",
//           fullOrder
//         );


//       // Restaurant Owner
//       io
//         .to(
//           `restaurant_${restaurantId}`
//         )
//         .emit(
//           "orderCreated",
//           fullOrder
//         );
//     }


//     res.status(201).json(fullOrder);

//   } catch (err) {

//     console.log(
//       "CREATE ORDER ERROR:",
//       err
//     );

//     res.status(500).json({
//       message: err.message,
//     });
//   }
// });


// =====================================================
// CREATE ORDER
// USER
// SUPPORTS PRODUCTS + OFFERS
// =====================================================

// =====================================================
// CREATE ORDER
// USER
// PRODUCT + OFFER
// =====================================================

router.post("/create", authMiddleware, async (req, res) => {
  try {
    const {
      items,
      address,
      paymentMethod,
    } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    if (!address?.street || !address?.city) {
      return res.status(400).json({
        message: "Address is required",
      });
    }

    // =====================================================
    // PROCESS ITEMS
    // =====================================================

    let processedItems = [];

    let restaurantId = null;

    for (const item of items) {
      // ===================================================
      // ITEM TYPE
      // ===================================================

      const itemType =
        item.itemType === "offer"
          ? "offer"
          : "product";

      // ===================================================
      // PRODUCT
      // ===================================================

      if (itemType === "product") {
        if (!item.productId) {
          return res.status(400).json({
            message: "Product ID is required",
          });
        }

        const product = await Recipe.findById(
          item.productId
        );

        if (!product) {
          return res.status(404).json({
            message: `Product not found: ${item.productId}`,
          });
        }

        // ===============================================
        // RESTAURANT
        // ===============================================

        if (!product.restaurantId) {
          return res.status(400).json({
            message:
              `Restaurant not found for product ${product.title}`,
          });
        }

        if (!restaurantId) {
          restaurantId = product.restaurantId;
        }

        if (
          product.restaurantId.toString() !==
          restaurantId.toString()
        ) {
          return res.status(400).json({
            message:
              "You can only order from one restaurant at a time",
          });
        }

        // ===============================================
        // VARIANT
        // ===============================================

        let selectedVariant = null;

        if (item.variant?.name) {
          selectedVariant =
            product.variants?.find(
              (variant) =>
                variant.name === item.variant.name
            );

          if (!selectedVariant) {
            return res.status(400).json({
              message:
                `Variant not found for ${product.title}`,
            });
          }
        }

        // ===============================================
        // PRICE
        // ===============================================

        const price = selectedVariant
          ? selectedVariant.price
          : product.price;

        if (
          price === undefined ||
          price === null
        ) {
          return res.status(400).json({
            message:
              `Price not found for ${product.title}`,
          });
        }

        // ===============================================
        // ADD PRODUCT
        // ===============================================

        processedItems.push({
          itemType: "product",

          productId: product._id,

          offerId: null,

          title: product.title,

          price: Number(price),

          variant: selectedVariant
            ? {
                name: selectedVariant.name,
                price: Number(
                  selectedVariant.price
                ),
              }
            : null,

          quantity:
            Number(item.quantity) || 1,

          discount: 0,

          image: product.image || "",
        });
      }

      // ===================================================
      // OFFER
      // ===================================================

      else if (itemType === "offer") {
        if (!item.offerId) {
          return res.status(400).json({
            message: "Offer ID is required",
          });
        }

        const offer = await Offer.findById(
          item.offerId
        );

        if (!offer) {
          return res.status(404).json({
            message:
              `Offer not found: ${item.offerId}`,
          });
        }

        // ===============================================
        // ACTIVE OFFER
        // ===============================================

        if (offer.isActive === false) {
          return res.status(400).json({
            message:
              "This offer is no longer active",
          });
        }

        // ===============================================
        // EXPIRATION
        // ===============================================

        if (
          offer.expiresAt &&
          new Date(offer.expiresAt) < new Date()
        ) {
          return res.status(400).json({
            message:
              "This offer has expired",
          });
        }

        // ===============================================
        // RESTAURANT
        // ===============================================

        if (!offer.restaurantId) {
          return res.status(400).json({
            message:
              `Restaurant not found for offer ${offer.title}`,
          });
        }

        if (!restaurantId) {
          restaurantId =
            offer.restaurantId;
        }

        if (
          offer.restaurantId.toString() !==
          restaurantId.toString()
        ) {
          return res.status(400).json({
            message:
              "You can only order from one restaurant at a time",
          });
        }

        // ===============================================
        // OFFER PRICE
        // ===============================================

        const originalPrice =
          Number(offer.price);

        const discount =
          Number(offer.discount || 0);

        const finalPrice =
          originalPrice -
          (originalPrice * discount) / 100;

        if (
          !Number.isFinite(originalPrice) ||
          originalPrice < 0
        ) {
          return res.status(400).json({
            message:
              `Invalid original price for offer ${offer.title}`,
          });
        }

        if (
          !Number.isFinite(finalPrice) ||
          finalPrice < 0
        ) {
          return res.status(400).json({
            message:
              `Invalid price for offer ${offer.title}`,
          });
        }

        // ===============================================
        // ADD OFFER
        // ===============================================

        processedItems.push({
          itemType: "offer",

          productId: null,

          offerId: offer._id,

          title: offer.title,

          price: Number(finalPrice),

          variant: null,

          quantity:
            Number(item.quantity) || 1,

          discount: discount,

          image: offer.image || "",
        });
      }
    }

    // =====================================================
    // RESTAURANT VALIDATION
    // =====================================================

    if (!restaurantId) {
      return res.status(400).json({
        message:
          "Restaurant could not be determined",
      });
    }

    // =====================================================
    // CALCULATE SUBTOTAL
    // =====================================================

    const subtotal =
      processedItems.reduce(
        (total, item) => {
          return (
            total +
            Number(item.price) *
              Number(item.quantity)
          );
        },
        0
      );

    // =====================================================
    // DELIVERY
    // =====================================================

    const deliveryFee = 15;

    // =====================================================
    // TOTAL
    // =====================================================

    const totalPrice =
      subtotal + deliveryFee;

    // =====================================================
    // CREATE ORDER
    // =====================================================

    const order = await Order.create({
      userId: req.user._id,

      name: req.user.name,

      phone: req.user.phone,

      restaurantId,

      items: processedItems,

      totalPrice,

      deliveryFee,

      paymentMethod:
        paymentMethod === "card"
          ? "card"
          : "cash",

      isPaid:
        paymentMethod === "card",

      address,

      status: "pending",
    });

    // =====================================================
    // POPULATE
    // =====================================================

    const fullOrder =
      await Order.findById(
        order._id
      )
        .populate(
          "userId",
          "name email phone"
        )
        .populate(
          "restaurantId",
          "name image address phone"
        )
        .populate(
          "items.productId",
          "title price image"
        )
        .populate(
          "items.offerId",
          "title price discount image"
        );

    // =====================================================
    // SOCKET
    // =====================================================

    const io = req.app.get("io");

    if (io) {
      // USER
      io
        .to(
          req.user._id.toString()
        )
        .emit(
          "orderCreated",
          fullOrder
        );

      // ADMIN
      io
        .to("adminRoom")
        .emit(
          "orderCreated",
          fullOrder
        );

      // RESTAURANT OWNER
      io
        .to(
          `restaurant_${restaurantId}`
        )
        .emit(
          "orderCreated",
          fullOrder
        );
    }

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(201).json(
      fullOrder
    );

  } catch (err) {
    console.log(
      "CREATE ORDER ERROR:",
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
});

// =====================================================
// MY ORDERS
// USER
// =====================================================

router.get(
  "/myorders",
  authMiddleware,
  async (req, res) => {

    try {

      const orders =
        await Order.find({
          userId: req.user._id,
        })
          .populate(
            "restaurantId",
            "name image address phone"
          )
          .sort({
            createdAt: -1,
          });


      res.json(orders);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// =====================================================
// GET ALL ORDERS
// ADMIN
// =====================================================

router.get(
  "/all",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {

    try {

      const {
        date,
        all,
        restaurantId,
      } = req.query;


      const filter = {
        isArchived: false,
      };


      // ===============================
      // RESTAURANT FILTER
      // ===============================

      if (restaurantId) {
        filter.restaurantId = restaurantId;
      }


      // ===============================
      // ALL ORDERS
      // ===============================

      if (all === "true") {

        const orders =
          await Order.find(filter)
            .populate(
              "userId",
              "name email phone"
            )
            .populate(
              "restaurantId",
              "name image address phone"
            )
            .sort({
              createdAt: -1,
            });


        return res.json(orders);
      }


      // ===============================
      // DATE
      // ===============================

      if (date) {

        const start =
          new Date(date);

        start.setHours(
          0,
          0,
          0,
          0
        );


        const end =
          new Date(date);

        end.setHours(
          23,
          59,
          59,
          999
        );


        filter.createdAt = {
          $gte: start,
          $lte: end,
        };

      } else {

        // Default = Today

        const now =
          new Date();


        const start =
          new Date(now);

        start.setHours(
          0,
          0,
          0,
          0
        );


        const end =
          new Date(now);

        end.setHours(
          23,
          59,
          59,
          999
        );


        filter.createdAt = {
          $gte: start,
          $lte: end,
        };
      }


      const orders =
        await Order.find(filter)
          .populate(
            "userId",
            "name email phone"
          )
          .populate(
            "restaurantId",
            "name image address phone"
          )
          .sort({
            createdAt: -1,
          });


      res.json(orders);

    } catch (err) {

      console.log(
        "GET ALL ORDERS ERROR:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// =====================================================
// GET RESTAURANT OWNER ORDERS
// RESTAURANT OWNER
// =====================================================

router.get(
  "/restaurant-orders",
  authMiddleware,
  roleMiddleware("restaurantOwner"),
  async (req, res) => {

    try {

      if (!req.user.restaurantId) {
        return res.status(400).json({
          message:
            "You are not assigned to a restaurant",
        });
      }


      const orders =
        await Order.find({
          restaurantId:
            req.user.restaurantId,

          isArchived: false,
        })
          .populate(
            "userId",
            "name email phone"
          )
          .populate(
            "restaurantId",
            "name image address phone"
          )
          .sort({
            createdAt: -1,
          });


      res.json(orders);

    } catch (err) {

      console.log(
        "RESTAURANT ORDERS ERROR:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// =====================================================
// GET ONE ORDER
// USER / ADMIN / OWNER
// =====================================================

router.get(
  "/:id",
  authMiddleware,
  async (req, res) => {

    try {

      const order =
        await Order.findById(
          req.params.id
        )
          .populate(
            "userId",
            "name email phone"
          )
          .populate(
            "restaurantId",
            "name image address phone"
          );


      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }


      // User can see only his order
      if (
        req.user.role === "user" &&
        order.userId._id.toString() !==
          req.user._id.toString()
      ) {

        return res.status(403).json({
          message: "Not allowed",
        });
      }


      // Owner can see only his restaurant orders
      if (
        req.user.role ===
          "restaurantOwner" &&
        order.restaurantId._id.toString() !==
          req.user.restaurantId.toString()
      ) {

        return res.status(403).json({
          message: "Not allowed",
        });
      }


      res.json(order);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// =====================================================
// UPDATE ORDER STATUS
// ADMIN / RESTAURANT OWNER
// =====================================================

router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware(
    "admin",
    "restaurantOwner"
  ),
  async (req, res) => {

    try {

      const { status } = req.body;


      const allowedStatuses = [
        "pending",
        "preparing",
        "delivered",
        "cancelled",
      ];


      if (
        !allowedStatuses.includes(status)
      ) {

        return res.status(400).json({
          message: "Invalid status",
        });
      }


      const order =
        await Order.findById(
          req.params.id
        );


      if (!order) {

        return res.status(404).json({
          message: "Order not found",
        });
      }


      // Owner can update only his orders
      if (
        req.user.role ===
          "restaurantOwner" &&
        order.restaurantId.toString() !==
          req.user.restaurantId.toString()
      ) {

        return res.status(403).json({
          message: "Not allowed",
        });
      }


      order.status = status;

      await order.save();


      const fullOrder =
        await Order.findById(
          order._id
        )
          .populate(
            "userId",
            "name email phone"
          )
          .populate(
            "restaurantId",
            "name image address phone"
          );


      // ===============================
      // SOCKET
      // ===============================

      const io = req.app.get("io");

      if (io) {

        io
          .to(
            fullOrder.userId._id.toString()
          )
          .emit(
            "orderUpdated",
            fullOrder
          );


        io
          .to("adminRoom")
          .emit(
            "orderUpdated",
            fullOrder
          );


        io
          .to(
            `restaurant_${fullOrder.restaurantId._id}`
          )
          .emit(
            "orderUpdated",
            fullOrder
          );
      }


      res.json(fullOrder);

    } catch (err) {

      console.log(
        "UPDATE ORDER STATUS ERROR:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// =====================================================
// DELETE ORDER
// ADMIN ONLY
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {

    try {

      const order =
        await Order.findByIdAndDelete(
          req.params.id
        );


      if (!order) {

        return res.status(404).json({
          message: "Order not found",
        });
      }


      const io = req.app.get("io");

      if (io) {

        io
          .to("adminRoom")
          .emit(
            "orderDeleted",
            order
          );
      }


      res.json({
        message:
          "Order deleted successfully",
      });

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// =====================================================
// ARCHIVE ONE
// ADMIN ONLY
// =====================================================

router.put(
  "/archive/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {

    try {

      const order =
        await Order.findByIdAndUpdate(
          req.params.id,
          {
            isArchived: true,
          },
          {
            new: true,
          }
        );


      if (!order) {

        return res.status(404).json({
          message: "Order not found",
        });
      }


      res.json(order);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// =====================================================
// ARCHIVE ALL
// ADMIN ONLY
// =====================================================

router.put(
  "/archive-all",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {

    try {

      await Order.updateMany(
        {},
        {
          isArchived: true,
        }
      );


      res.json({
        message:
          "All orders archived",
      });

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


module.exports = router;