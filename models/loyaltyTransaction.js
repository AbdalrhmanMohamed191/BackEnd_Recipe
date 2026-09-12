const mongoose = require("mongoose");

const loyaltyTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "earn",
        "redeem",
        "refund",
        "reversal",
      ],
      required: true,
    },

    points: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// PREVENT DUPLICATE EARN TRANSACTIONS
// FOR THE SAME ORDER
// =====================================================

loyaltyTransactionSchema.index(
  {
    orderId: 1,
    type: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      orderId: {
        $type: "objectId",
      },

      type: "earn",
    },
  }
);

// =====================================================
// MODEL
// =====================================================

const LoyaltyTransaction =
  mongoose.models.LoyaltyTransaction ||
  mongoose.model(
    "LoyaltyTransaction",
    loyaltyTransactionSchema
  );

module.exports = LoyaltyTransaction;