const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    ingredients: {
      type: [String],
      required: true,
      default: [],
    },

    instructions: {
      type: String,
      required: true,
    },

    CoverImage: {
      type: String,
    },

    price: {
      type: Number,
      default: 0,
    },

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    variants: [
      {
        name: {
          type: String, // Small / Large / XL
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],

    category: {
      type: String,
      enum: [
        "beef",
        "chicken",
        "pizza",
        "dessert",
        "seafood",
        "pasta",
        "salad",
        "soup",
        "burger",
        "drinks",
        "crepe",
        "dishes",
      ],
    },
  },
  { timestamps: true }
);

const Recipe = mongoose.model("Recipe", recipeSchema);

module.exports = Recipe;