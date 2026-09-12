const express = require("express");
const router = express.Router();

const LoyaltyWallet = require("../models/LoyaltyWallet");
const LoyaltyTransaction = require("../models/loyaltyTransaction");

const { authMiddleware } = require("../middleWares/authMiddleware");

// =====================================================
// GET MY LOYALTY WALLETS
// USER
// =====================================================

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const wallets = await LoyaltyWallet.find({
        userId: req.user._id,
      })
        .populate(
          "restaurantId",
          "name image address phone"
        )
        .sort({
          points: -1,
          updatedAt: -1,
        });

      const formattedWallets = wallets.map(
        (wallet) => ({
          restaurantId:
            wallet.restaurantId?._id || null,

          restaurantName:
            wallet.restaurantId?.name ||
            "Unknown Restaurant",

          restaurantImage:
            wallet.restaurantId?.image || "",

          points: Number(wallet.points || 0),
        })
      );

      return res.json({
        wallets: formattedWallets,
      });
    } catch (err) {
      console.log(
        "GET LOYALTY WALLETS ERROR:",
        err
      );

      return res.status(500).json({
        message: err.message,
      });
    }
  }
);

// =====================================================
// GET LOYALTY HISTORY
// USER
// =====================================================

router.get(
  "/:restaurantId/history",
  authMiddleware,
  async (req, res) => {
    try {
      const transactions =
        await LoyaltyTransaction.find({
          userId: req.user._id,
          restaurantId:
            req.params.restaurantId,
        })
          .populate(
            "orderId",
            "totalPrice status createdAt"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        transactions,
      });
    } catch (err) {
      console.log(
        "GET LOYALTY HISTORY ERROR:",
        err
      );

      return res.status(500).json({
        message: err.message,
      });
    }
  }
);

// =====================================================
// GET LOYALTY WALLET FOR ONE RESTAURANT
// USER
// =====================================================

router.get(
  "/:restaurantId",
  authMiddleware,
  async (req, res) => {
    try {
      const wallet =
        await LoyaltyWallet.findOne({
          userId: req.user._id,
          restaurantId:
            req.params.restaurantId,
        }).populate(
          "restaurantId",
          "name image address phone"
        );

      // ===============================================
      // NO WALLET YET
      // ===============================================

      if (!wallet) {
        return res.json({
          restaurantId:
            req.params.restaurantId,

          restaurantName:
            "Restaurant",

          restaurantImage: "",

          points: 0,
        });
      }

      // ===============================================
      // WALLET FOUND
      // ===============================================

      return res.json({
        restaurantId:
          wallet.restaurantId?._id,

        restaurantName:
          wallet.restaurantId?.name ||
          "Restaurant",

        restaurantImage:
          wallet.restaurantId?.image || "",

        points: Number(
          wallet.points || 0
        ),
      });
    } catch (err) {
      console.log(
        "GET RESTAURANT LOYALTY ERROR:",
        err
      );

      return res.status(500).json({
        message: err.message,
      });
    }
  }
);

module.exports = router;

