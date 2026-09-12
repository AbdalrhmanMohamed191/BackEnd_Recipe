const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // =====================================================
    // USER
    // =====================================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
    },

    phone: {
      type: String,
    },

    // =====================================================
    // RESTAURANT
    // =====================================================

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    // =====================================================
    // ITEMS
    // =====================================================

    items: [
      {
        // ===============================================
        // ITEM TYPE
        // product = Recipe
        // offer   = Offer
        // ===============================================

        itemType: {
          type: String,
          enum: ["product", "offer"],
          default: "product",
        },

        // ===============================================
        // RECIPE ID
        // ===============================================

        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Recipe",
          default: null,
        },

        // ===============================================
        // OFFER ID
        // ===============================================

        offerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Offer",
          default: null,
        },

        // ===============================================
        // TITLE
        // ===============================================

        title: {
          type: String,
          required: true,
        },

        // ===============================================
        // PRICE
        // ===============================================

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        // ===============================================
        // VARIANT
        // ===============================================

        variant: {
          name: {
            type: String,
          },

          price: {
            type: Number,
          },
        },

        // ===============================================
        // QUANTITY
        // ===============================================

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        // ===============================================
        // OPTIONAL OFFER DATA
        // ===============================================

        discount: {
          type: Number,
          default: 0,
        },

        image: {
          type: String,
          default: "",
        },
      },
    ],

    // =====================================================
    // ORDER STATUS
    // =====================================================

    status: {
      type: String,

      enum: [
        "pending",
        "preparing",
        "delivered",
        "cancelled",
      ],

      default: "pending",
    },

      // =====================================================
      // LOYALTY POINTS
      // =====================================================

      loyaltyPointsEarned: {
        type: Number,
        default: 0,
        min: 0,
      },

      loyaltyPointsCredited: {
        type: Boolean,
        default: false,
      },

    // =====================================================
    // PAYMENT
    // =====================================================

    paymentMethod: {
      type: String,

      enum: ["cash", "card"],

      default: "cash",
    },

    isPaid: {
      type: Boolean,

      default: false,
    },

    // =====================================================
    // PRICE
    // =====================================================

    totalPrice: {
      type: Number,

      required: true,

      min: 0,
    },

    deliveryFee: {
      type: Number,

      default: 0,
    },

    // =====================================================
    // LOYALTY POINTS
    // =====================================================

    loyaltyPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    loyaltyPointsCredited: {
      type: Boolean,
      default: false,
    },

    loyaltyPointsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },

    loyaltyDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    loyaltyPointsRefunded: {
      type: Boolean,
      default: false,
    },

    // =====================================================
    // ARCHIVE
    // =====================================================

    isArchived: {
      type: Boolean,

      default: false,
    },

    // =====================================================
    // ADDRESS
    // =====================================================

    address: {
      street: {
        type: String,

        required: true,
      },

      city: {
        type: String,

        required: true,
      },

      notes: {
        type: String,
      },
    },
  },

  {
    timestamps: true,
  }
);

const Order = mongoose.model(
  "Order",
  orderSchema
);

module.exports = Order;