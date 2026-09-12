const mongoose = require("mongoose");

const loyaltyWalletSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER
    // ==========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================
    // RESTAURANT
    // ==========================================

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    // ==========================================
    // POINTS
    // ==========================================

    points: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// ONE WALLET PER USER PER RESTAURANT
// ==========================================

loyaltyWalletSchema.index(
  {
    userId: 1,
    restaurantId: 1,
  },
  {
    unique: true,
  }
);

const LoyaltyWallet =
  mongoose.model(
    "LoyaltyWallet",
    loyaltyWalletSchema
  );

module.exports = LoyaltyWallet;