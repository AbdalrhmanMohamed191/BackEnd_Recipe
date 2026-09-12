const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");

const Order = require("../models/order");
const Recipe = require("../models/recipeSchema");
const Offer = require("../models/offerSchema");

const LoyaltyWallet = require("../models/loyaltyWallet");
const LoyaltyTransaction = require("../models/loyaltyTransaction");

const {
  authMiddleware,
} = require("../middleWares/authMiddleware");

const {
  roleMiddleware,
} = require("../middleWares/roleMiddleware");

// =====================================================
// CREATE ORDER
// USER
// PRODUCT + OFFER + LOYALTY REDEEM
// =====================================================

router.post(
  "/create",
  authMiddleware,
  async (req, res) => {
    const session = await mongoose.startSession();

    try {
      const {
        items,
        address,
        paymentMethod,
        pointsToRedeem = 0,
      } = req.body;

      // =====================================================
      // VALIDATION
      // =====================================================

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          message: "Cart is empty",
        });
      }

      if (
        !address?.street ||
        !address?.city
      ) {
        return res.status(400).json({
          message: "Address is required",
        });
      }

      // =====================================================
      // LOYALTY POINTS VALIDATION
      // =====================================================

      const requestedPoints =
        Number(pointsToRedeem);

      if (
        !Number.isFinite(requestedPoints) ||
        requestedPoints < 0 ||
        !Number.isInteger(requestedPoints)
      ) {
        return res.status(400).json({
          message:
            "Invalid loyalty points amount",
        });
      }

      // =====================================================
      // START TRANSACTION
      // =====================================================

      session.startTransaction();

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
            await session.abortTransaction();

            return res.status(400).json({
              message:
                "Product ID is required",
            });
          }

          const product =
            await Recipe.findById(
              item.productId
            ).session(session);

          if (!product) {
            await session.abortTransaction();

            return res.status(404).json({
              message:
                `Product not found: ${item.productId}`,
            });
          }

          // ===============================================
          // RESTAURANT
          // ===============================================

          if (!product.restaurantId) {
            await session.abortTransaction();

            return res.status(400).json({
              message:
                `Restaurant not found for product ${product.title}`,
            });
          }

          if (!restaurantId) {
            restaurantId =
              product.restaurantId;
          }

          if (
            product.restaurantId.toString() !==
            restaurantId.toString()
          ) {
            await session.abortTransaction();

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
                  variant.name ===
                  item.variant.name
              );

            if (!selectedVariant) {
              await session.abortTransaction();

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
            await session.abortTransaction();

            return res.status(400).json({
              message:
                `Price not found for ${product.title}`,
            });
          }

          // ===============================================
          // QUANTITY
          // ===============================================

          const quantity =
            Number(item.quantity);

          if (
            !Number.isInteger(quantity) ||
            quantity <= 0
          ) {
            await session.abortTransaction();

            return res.status(400).json({
              message:
                `Invalid quantity for ${product.title}`,
            });
          }

          // ===============================================
          // ADD PRODUCT
          // ===============================================

          processedItems.push({
            itemType: "product",

            productId:
              product._id,

            offerId: null,

            title:
              product.title,

            price:
              Number(price),

            variant:
              selectedVariant
                ? {
                    name:
                      selectedVariant.name,

                    price:
                      Number(
                        selectedVariant.price
                      ),
                  }
                : null,

            quantity,

            discount: 0,

            image:
              product.image || "",
          });
        }

        // ===================================================
        // OFFER
        // ===================================================

        else if (itemType === "offer") {
          if (!item.offerId) {
            await session.abortTransaction();

            return res.status(400).json({
              message:
                "Offer ID is required",
            });
          }

          const offer =
            await Offer.findById(
              item.offerId
            ).session(session);

          if (!offer) {
            await session.abortTransaction();

            return res.status(404).json({
              message:
                `Offer not found: ${item.offerId}`,
            });
          }

          // ===============================================
          // ACTIVE OFFER
          // ===============================================

          if (offer.isActive === false) {
            await session.abortTransaction();

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
            new Date(offer.expiresAt) <
              new Date()
          ) {
            await session.abortTransaction();

            return res.status(400).json({
              message:
                "This offer has expired",
            });
          }

          // ===============================================
          // RESTAURANT
          // ===============================================

          if (!offer.restaurantId) {
            await session.abortTransaction();

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
            await session.abortTransaction();

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
            Number(
              offer.discount || 0
            );

          const finalPrice =
            originalPrice -
            (originalPrice *
              discount) /
              100;

          if (
            !Number.isFinite(
              originalPrice
            ) ||
            originalPrice < 0
          ) {
            await session.abortTransaction();

            return res.status(400).json({
              message:
                `Invalid original price for offer ${offer.title}`,
            });
          }

          if (
            !Number.isFinite(
              finalPrice
            ) ||
            finalPrice < 0
          ) {
            await session.abortTransaction();

            return res.status(400).json({
              message:
                `Invalid price for offer ${offer.title}`,
            });
          }

          // ===============================================
          // QUANTITY
          // ===============================================

          const quantity =
            Number(item.quantity);

          if (
            !Number.isInteger(quantity) ||
            quantity <= 0
          ) {
            await session.abortTransaction();

            return res.status(400).json({
              message:
                `Invalid quantity for offer ${offer.title}`,
            });
          }

          // ===============================================
          // ADD OFFER
          // ===============================================

          processedItems.push({
            itemType: "offer",

            productId: null,

            offerId:
              offer._id,

            title:
              offer.title,

            price:
              Number(finalPrice),

            variant: null,

            quantity,

            discount,

            image:
              offer.image || "",
          });
        }
      }

      // =====================================================
      // RESTAURANT VALIDATION
      // =====================================================

      if (!restaurantId) {
        await session.abortTransaction();

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

      const deliveryFee = 0;

      // =====================================================
      // BEFORE LOYALTY TOTAL
      // =====================================================

      const subtotalWithDelivery =
        subtotal + deliveryFee;

      // =====================================================
      // LOYALTY REDEEM
      // =====================================================
      //
      // NEW RULE:
      //
      // 1 POINT = 1 EGP DISCOUNT
      //
      // Examples:
      //
      // 50 POINTS  = 50 EGP DISCOUNT
      // 120 POINTS = 120 EGP DISCOUNT
      // 250 POINTS = 250 EGP DISCOUNT
      //
      // If order = 300 EGP
      // and user has 500 points
      // maximum usable points = 300
      //
      // EARNING RULE REMAINS:
      //
      // 10 EGP SPENT = 1 POINT
      //
      // =====================================================

      let loyaltyPointsUsed = 0;

      let loyaltyDiscount = 0;

      if (requestedPoints > 0) {
        // ===============================================
        // MAX POINTS FOR THIS ORDER
        // ===============================================
        //
        // 1 POINT = 1 EGP
        //
        // So maximum points cannot exceed
        // the actual order price.
        //
        const maxPointsForOrder =
          Math.floor(
            subtotalWithDelivery
          );

        if (
          requestedPoints >
          maxPointsForOrder
        ) {
          await session.abortTransaction();

          return res.status(400).json({
            message:
              `You cannot use more than ${maxPointsForOrder} points for this order`,
          });
        }

        // ===============================================
        // CALCULATE DISCOUNT
        // ===============================================
        //
        // 1 POINT = 1 EGP
        //
        loyaltyPointsUsed =
          requestedPoints;

        loyaltyDiscount =
          requestedPoints;

        // ===============================================
        // ATOMIC WALLET DEDUCTION
        // ===============================================
        //
        // IMPORTANT:
        // points must be >= requested points
        //
        // This prevents negative balances.
        //
        const wallet =
          await LoyaltyWallet.findOneAndUpdate(
            {
              userId:
                req.user._id,

              restaurantId,

              points: {
                $gte:
                  requestedPoints,
              },
            },
            {
              $inc: {
                points:
                  -requestedPoints,
              },
            },
            {
              new: true,

              session,
            }
          );

        if (!wallet) {
          await session.abortTransaction();

          return res.status(400).json({
            message:
              "Insufficient loyalty points for this restaurant",
          });
        }
      }

      // =====================================================
      // FINAL TOTAL
      // =====================================================

      const totalPrice =
        Math.max(
          0,
          subtotalWithDelivery -
            loyaltyDiscount
        );

      // =====================================================
      // CREATE ORDER
      // =====================================================

      const createdOrders =
        await Order.create(
          [
            {
              userId:
                req.user._id,

              name:
                req.user.name,

              phone:
                req.user.phone,

              restaurantId,

              items:
                processedItems,

              totalPrice,

              deliveryFee,

              loyaltyPointsUsed,

              loyaltyDiscount,

              loyaltyPointsEarned: 0,

              loyaltyPointsCredited:
                false,

              loyaltyPointsRefunded:
                false,

              paymentMethod:
                paymentMethod ===
                "card"
                  ? "card"
                  : "cash",

              isPaid:
                paymentMethod ===
                "card",

              address,

              status:
                "pending",
            },
          ],
          {
            session,
          }
        );

      const order =
        createdOrders[0];

      // =====================================================
      // CREATE REDEEM TRANSACTION
      // =====================================================

      if (
        loyaltyPointsUsed > 0
      ) {
        await LoyaltyTransaction.create(
          [
            {
              userId:
                req.user._id,

              restaurantId,

              orderId:
                order._id,

              type:
                "redeem",

              points:
                -loyaltyPointsUsed,

              description:
                `Redeemed ${loyaltyPointsUsed} points for ${loyaltyDiscount} EGP discount`,
            },
          ],
          {
            session,
          }
        );
      }

      // =====================================================
      // COMMIT TRANSACTION
      // =====================================================

      await session.commitTransaction();

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

      const io =
        req.app.get("io");

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
      // =====================================================
      // ROLLBACK
      // =====================================================

      try {
        await session.abortTransaction();
      } catch (rollbackError) {
        console.log(
          "CREATE ORDER ROLLBACK ERROR:",
          rollbackError.message
        );
      }

      console.log(
        "CREATE ORDER ERROR:",
        err
      );

      return res.status(500).json({
        message: err.message,
      });

    } finally {
      await session.endSession();
    }
  }
);

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

      return res.json(orders);

    } catch (err) {
      console.log(
        "GET MY ORDERS ERROR:",
        err
      );

      return res.status(500).json({
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
        filter.restaurantId =
          restaurantId;
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
        // ===============================
        // DEFAULT = TODAY
        // ===============================

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

      return res.json(orders);

    } catch (err) {
      console.log(
        "GET ALL ORDERS ERROR:",
        err
      );

      return res.status(500).json({
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
  roleMiddleware(
    "restaurantOwner"
  ),
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

      return res.json(orders);

    } catch (err) {
      console.log(
        "RESTAURANT ORDERS ERROR:",
        err
      );

      return res.status(500).json({
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
          message:
            "Order not found",
        });
      }

      // ===============================
      // USER PERMISSION
      // ===============================

      if (
        req.user.role === "user" &&
        order.userId._id.toString() !==
          req.user._id.toString()
      ) {
        return res.status(403).json({
          message:
            "Not allowed",
        });
      }

      // ===============================
      // OWNER PERMISSION
      // ===============================

      if (
        req.user.role ===
          "restaurantOwner" &&
        order.restaurantId._id.toString() !==
          req.user.restaurantId.toString()
      ) {
        return res.status(403).json({
          message:
            "Not allowed",
        });
      }

      return res.json(order);

    } catch (err) {
      console.log(
        "GET ONE ORDER ERROR:",
        err
      );

      return res.status(500).json({
        message: err.message,
      });
    }
  }
);

// =====================================================
// UPDATE ORDER STATUS
// ADMIN / RESTAURANT OWNER
//
// FEATURES:
// - Earn points on delivered
// - Refund redeemed points on cancelled
// - Prevent duplicate earn
// - Prevent duplicate refund
// - MongoDB Transaction
// =====================================================

router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware(
    "admin",
    "restaurantOwner"
  ),
  async (req, res) => {
    const session =
      await mongoose.startSession();

    try {
      const { status } =
        req.body;

      const allowedStatuses = [
        "pending",
        "preparing",
        "delivered",
        "cancelled",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid status",
        });
      }

      // =====================================================
      // START TRANSACTION
      // =====================================================

      session.startTransaction();

      // =====================================================
      // GET ORDER
      // =====================================================

      const order =
        await Order.findById(
          req.params.id
        ).session(session);

      if (!order) {
        await session.abortTransaction();

        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      // =====================================================
      // OWNER PERMISSION
      // =====================================================

      if (
        req.user.role ===
          "restaurantOwner" &&
        order.restaurantId.toString() !==
          req.user.restaurantId.toString()
      ) {
        await session.abortTransaction();

        return res.status(403).json({
          message:
            "Not allowed",
        });
      }

      // =====================================================
      // PREVIOUS STATUS
      // =====================================================

      const previousStatus =
        order.status;

      // =====================================================
      // UPDATE STATUS
      // =====================================================

      order.status =
        status;

      let pointsEarned = 0;

      let pointsRefunded = 0;

      // =====================================================
      // LOYALTY EARN
      // =====================================================
      //
      // 10 EGP = 1 POINT
      //
      // This rule DOES NOT change.
      //
      // Points are earned only when
      // order becomes delivered.
      //
      // =====================================================

      const shouldCreditPoints =
        status === "delivered" &&
        previousStatus !==
          "delivered" &&
        order.loyaltyPointsCredited ===
          false;

      if (
        shouldCreditPoints
      ) {
        pointsEarned =
          Math.floor(
            Number(
              order.totalPrice
            ) / 10
          );

        // ===============================================
        // MARK AS CREDITED
        // ===============================================

        order.loyaltyPointsEarned =
          pointsEarned;

        order.loyaltyPointsCredited =
          true;

        // ===============================================
        // ADD POINTS
        // ===============================================

        if (
          pointsEarned > 0
        ) {
          await LoyaltyWallet.findOneAndUpdate(
            {
              userId:
                order.userId,

              restaurantId:
                order.restaurantId,
            },
            {
              $inc: {
                points:
                  pointsEarned,
              },
            },
            {
              new: true,

              upsert: true,

              setDefaultsOnInsert:
                true,

              session,
            }
          );

          // =============================================
          // CREATE EARN TRANSACTION
          // =============================================

          await LoyaltyTransaction.create(
            [
              {
                userId:
                  order.userId,

                restaurantId:
                  order.restaurantId,

                orderId:
                  order._id,

                type:
                  "earn",

                points:
                  pointsEarned,

                description:
                  `Earned ${pointsEarned} points from delivered order`,
              },
            ],
            {
              session,
            }
          );
        }
      }

      // =====================================================
      // LOYALTY REFUND
      // =====================================================
      //
      // If customer used points and order becomes cancelled:
      //
      // Wallet + used points
      //
      // Example:
      //
      // Used 120 points
      // Order cancelled
      // Wallet +120 points
      //
      // =====================================================

     const shouldRefundPoints =
      status === "cancelled" &&
      previousStatus !== "cancelled" &&
      Number(order.loyaltyPointsUsed || 0) > 0 &&
      order.loyaltyPointsRefunded !== true;
      if (
        shouldRefundPoints
      ) {
        pointsRefunded =
          Number(
            order.loyaltyPointsUsed
          );

        // ===============================================
        // RETURN POINTS TO WALLET
        // ===============================================

        await LoyaltyWallet.findOneAndUpdate(
          {
            userId:
              order.userId,

            restaurantId:
              order.restaurantId,
          },
          {
            $inc: {
              points:
                pointsRefunded,
            },
          },
          {
            new: true,

            upsert: true,

            setDefaultsOnInsert:
              true,

            session,
          }
        );

        // ===============================================
        // MARK REFUNDED
        // ===============================================

        order.loyaltyPointsRefunded =
          true;

        // ===============================================
        // CREATE REFUND TRANSACTION
        // ===============================================

        await LoyaltyTransaction.create(
          [
            {
              userId:
                order.userId,

              restaurantId:
                order.restaurantId,

              orderId:
                order._id,

              type:
                "refund",

              points:
                pointsRefunded,

              description:
                `Refunded ${pointsRefunded} redeemed points because order was cancelled`,
            },
          ],
          {
            session,
          }
        );
      }

      // =====================================================
      // SAVE ORDER
      // =====================================================

      await order.save({
        session,
      });

      // =====================================================
      // COMMIT
      // =====================================================

      await session.commitTransaction();

      // =====================================================
      // GET FULL ORDER
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
          );

      // =====================================================
      // SOCKET.IO
      // =====================================================

      const io =
        req.app.get("io");

      if (io) {
        // USER
        io
          .to(
            fullOrder.userId._id.toString()
          )
          .emit(
            "orderUpdated",
            fullOrder
          );

        // ADMIN
        io
          .to("adminRoom")
          .emit(
            "orderUpdated",
            fullOrder
          );

        // RESTAURANT OWNER
        io
          .to(
            `restaurant_${fullOrder.restaurantId._id}`
          )
          .emit(
            "orderUpdated",
            fullOrder
          );
      }

      // =====================================================
      // RESPONSE
      // =====================================================

      return res.json({
        ...fullOrder.toObject(),

        pointsEarned,

        pointsRefunded,
      });

    } catch (err) {
      // =====================================================
      // ROLLBACK
      // =====================================================

      try {
        await session.abortTransaction();
      } catch (rollbackError) {
        console.log(
          "LOYALTY ROLLBACK ERROR:",
          rollbackError.message
        );
      }

      console.log(
        "UPDATE ORDER STATUS ERROR:",
        err
      );

      // =====================================================
      // DUPLICATE LOYALTY TRANSACTION
      // =====================================================

      if (
        err.code === 11000
      ) {
        return res.status(409).json({
          message:
            "This loyalty transaction already exists",
        });
      }

      return res.status(500).json({
        message:
          err.message,
      });

    } finally {
      await session.endSession();
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
          message:
            "Order not found",
        });
      }

      const io =
        req.app.get("io");

      if (io) {
        io
          .to("adminRoom")
          .emit(
            "orderDeleted",
            order
          );
      }

      return res.json({
        message:
          "Order deleted successfully",
      });

    } catch (err) {
      console.log(
        "DELETE ORDER ERROR:",
        err
      );

      return res.status(500).json({
        message:
          err.message,
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
          message:
            "Order not found",
        });
      }

      return res.json(order);

    } catch (err) {
      console.log(
        "ARCHIVE ORDER ERROR:",
        err
      );

      return res.status(500).json({
        message:
          err.message,
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

      return res.json({
        message:
          "All orders archived",
      });

    } catch (err) {
      console.log(
        "ARCHIVE ALL ORDERS ERROR:",
        err
      );

      return res.status(500).json({
        message:
          err.message,
      });
    }
  }
);

module.exports = router;


