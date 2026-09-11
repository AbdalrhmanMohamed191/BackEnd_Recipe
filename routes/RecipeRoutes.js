const express = require("express");
const router = express.Router();

const Recipe = require("../models/recipeSchema");
const Restaurant = require("../models/Restaurant");

const upload = require("../uplods/multer");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const { authMiddleware } = require("../middleWares/authMiddleware");
const { roleMiddleware } = require("../middleWares/roleMiddleware");

const getIo = (req) => req.app.get("io");


// =================================================
// CREATE RECIPE
// ADMIN + RESTAURANT OWNER
// =================================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "restaurantOwner"),
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        title,
        instructions,
        category,
        restaurantId: bodyRestaurantId,
      } = req.body;

      // ================= RESTAURANT ID =================

      const restaurantId =
        req.user.role === "restaurantOwner"
          ? req.user.restaurantId
          : bodyRestaurantId;

      if (!title || !instructions || !restaurantId) {
        return res.status(400).json({
          message: "Title, instructions and restaurant are required",
        });
      }

      // ================= CHECK RESTAURANT =================

      const restaurant = await Restaurant.findById(restaurantId);

      if (!restaurant) {
        return res.status(404).json({
          message: "Restaurant not found",
        });
      }

      // ================= IMAGE =================

      if (!req.file) {
        return res.status(400).json({
          message: "Image is required",
        });
      }

      // ================= INGREDIENTS =================

      let ingredients = [];

      if (req.body.ingredients) {
        try {
          ingredients =
            typeof req.body.ingredients === "string"
              ? JSON.parse(req.body.ingredients)
              : req.body.ingredients;

          // لو بعت String عادي بدل JSON Array
          if (!Array.isArray(ingredients)) {
            ingredients = [String(ingredients)];
          }

          ingredients = ingredients
            .map((item) => String(item).trim())
            .filter(Boolean);

        } catch {
          // fallback لو كانت بالشكل:
          // Zinger Chicken, Cheese, Sauce

          ingredients = req.body.ingredients
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }
      }

      // ================= PRICE =================

      const price =
        req.body.price !== undefined &&
        req.body.price !== ""
          ? Number(req.body.price)
          : 0;

      if (Number.isNaN(price) || price < 0) {
        return res.status(400).json({
          message: "Invalid price",
        });
      }

      // ================= VARIANTS =================

      let variants = [];

      if (req.body.variants) {
        try {
          variants =
            typeof req.body.variants === "string"
              ? JSON.parse(req.body.variants)
              : req.body.variants;

          if (!Array.isArray(variants)) {
            variants = [];
          }

          variants = variants
            .map((variant) => ({
              name: variant.name?.trim(),
              price: Number(variant.price),
            }))
            .filter(
              (variant) =>
                variant.name &&
                !Number.isNaN(variant.price) &&
                variant.price >= 0
            );

        } catch {
          return res.status(400).json({
            message: "Invalid variants format",
          });
        }
      }

      // ================= CLOUDINARY IMAGE =================

      const uploadedImage = await uploadToCloudinary(
        req.file.buffer,
        "famy/recipes"
      );

      // ================= CREATE =================

      const recipe = await Recipe.create({
        title,
        instructions,
        category,
        ingredients,
        price,
        variants,
        restaurantId,
        ownerId: req.user._id,
        CoverImage: uploadedImage.secure_url,
      });

      // ================= SOCKET =================

      const io = getIo(req);

      if (io) {
        io.emit("recipeCreated", recipe);
      }

      // ================= RESPONSE =================

      res.status(201).json({
        message: "Recipe created successfully",
        recipe,
      });

    } catch (err) {
      console.error("CREATE RECIPE ERROR:", err);

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// =================================================
// BULK CREATE RECIPES
// ADMIN ONLY
// NO IMAGES REQUIRED
// =================================================

router.post(
  "/bulk",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const { recipes } = req.body;

      if (!Array.isArray(recipes) || recipes.length === 0) {
        return res.status(400).json({
          message: "Recipes array is required",
        });
      }

      // ================= VALIDATE RESTAURANTS =================

      const restaurantIds = [
        ...new Set(
          recipes
            .map((recipe) => recipe.restaurantId)
            .filter(Boolean)
        ),
      ];

      const restaurants = await Restaurant.find({
        _id: { $in: restaurantIds },
      }).select("_id");

      const validRestaurantIds = new Set(
        restaurants.map((restaurant) =>
          restaurant._id.toString()
        )
      );

      // ================= PREPARE RECIPES =================

      const recipesToInsert = [];

      for (const item of recipes) {
        const {
          title,
          ingredients,
          instructions,
          category,
          price,
          variants,
          restaurantId,
        } = item;

        // Required fields
        if (
          !title ||
          !instructions ||
          !restaurantId
        ) {
          return res.status(400).json({
            message:
              "Each recipe must have title, instructions and restaurantId",
            recipe: item,
          });
        }

        // Check restaurant
        if (!validRestaurantIds.has(String(restaurantId))) {
          return res.status(400).json({
            message: `Restaurant not found: ${restaurantId}`,
          });
        }

        // ================= INGREDIENTS =================

        let parsedIngredients = [];

        if (Array.isArray(ingredients)) {
          parsedIngredients = ingredients;
        } else if (typeof ingredients === "string") {
          parsedIngredients = ingredients
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }

        parsedIngredients = parsedIngredients
          .map((item) => String(item).trim())
          .filter(Boolean);

        // ================= PRICE =================

        const parsedPrice =
          price !== undefined &&
          price !== ""
            ? Number(price)
            : 0;

        if (
          Number.isNaN(parsedPrice) ||
          parsedPrice < 0
        ) {
          return res.status(400).json({
            message: `Invalid price for recipe: ${title}`,
          });
        }

        // ================= VARIANTS =================

        let parsedVariants = [];

        if (Array.isArray(variants)) {
          parsedVariants = variants
            .map((variant) => ({
              name: variant.name?.trim(),
              price: Number(variant.price),
            }))
            .filter(
              (variant) =>
                variant.name &&
                !Number.isNaN(variant.price) &&
                variant.price >= 0
            );
        }

        // ================= PUSH =================

        recipesToInsert.push({
          title: String(title).trim(),
          instructions: String(instructions).trim(),
          category: category || undefined,
          ingredients: parsedIngredients,
          price: parsedPrice,
          variants: parsedVariants,
          restaurantId,
          ownerId: req.user._id,

          // NO IMAGE
          CoverImage: "",
        });
      }

      // ================= INSERT MANY =================

      const createdRecipes =
        await Recipe.insertMany(
          recipesToInsert
        );

      // ================= SOCKET =================

      const io = getIo(req);

      if (io) {
        createdRecipes.forEach((recipe) => {
          io.emit(
            "recipeCreated",
            recipe
          );
        });
      }

      // ================= RESPONSE =================

      res.status(201).json({
        message: `${createdRecipes.length} recipes imported successfully`,
        count: createdRecipes.length,
        recipes: createdRecipes,
      });

    } catch (err) {
      console.error(
        "BULK CREATE RECIPES ERROR:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// =================================================
// GET ALL RECIPES
// PUBLIC
// =================================================

router.get("/", async (req, res) => {
  try {
    const {
      restaurantId,
      category,
    } = req.query;

    const filter = {};

    if (restaurantId) {
      filter.restaurantId = restaurantId;
    }

    if (category) {
      filter.category = category;
    }

    const recipes = await Recipe.find(filter)
      .populate("restaurantId", "name")
      .sort({ createdAt: -1 });

    res.json(recipes);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});


// =================================================
// GET MY MENU
// RESTAURANT OWNER ONLY
// =================================================

router.get(
  "/my-menu",
  authMiddleware,
  roleMiddleware("restaurantOwner"),
  async (req, res) => {
    try {

      if (!req.user.restaurantId) {
        return res.status(400).json({
          message: "Restaurant not assigned",
        });
      }

      const recipes = await Recipe.find({
        restaurantId: req.user.restaurantId,
      })
        .sort({ createdAt: -1 });

      res.json(recipes);

    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// =================================================
// GET RECIPES BY RESTAURANT
// PUBLIC
// =================================================

router.get("/restaurant/:id", async (req, res) => {
  try {

    const recipes = await Recipe.find({
      restaurantId: req.params.id,
    })
      .sort({ createdAt: -1 })
      .populate("restaurantId", "name");

    res.json(recipes);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});


// =================================================
// GET ONE RECIPE
// PUBLIC
// =================================================

router.get("/:id", async (req, res) => {
  try {

    const recipe = await Recipe.findById(req.params.id)
      .populate("restaurantId", "name");

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    res.json(recipe);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});


// =================================================
// UPDATE RECIPE
// ADMIN + RESTAURANT OWNER
// =================================================

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "restaurantOwner"),
  upload.single("image"),
  async (req, res) => {
    try {

      const recipe = await Recipe.findById(req.params.id);

      if (!recipe) {
        return res.status(404).json({
          message: "Recipe not found",
        });
      }

      // ================= OWNER ACCESS =================

      if (req.user.role === "restaurantOwner") {

        if (!req.user.restaurantId) {
          return res.status(403).json({
            message: "Restaurant not assigned",
          });
        }

        if (
          recipe.restaurantId.toString() !==
          req.user.restaurantId.toString()
        ) {
          return res.status(403).json({
            message: "Not allowed",
          });
        }
      }

      // ================= UPDATE ONLY ALLOWED FIELDS =================

      if (req.body.title !== undefined) {
        recipe.title = req.body.title;
      }

      if (req.body.instructions !== undefined) {
        recipe.instructions = req.body.instructions;
      }

      if (req.body.category !== undefined) {
        recipe.category = req.body.category;
      }

      if (req.body.price !== undefined) {
        recipe.price = Number(req.body.price);
      }

      // ================= INGREDIENTS =================

      if (req.body.ingredients !== undefined) {

        recipe.ingredients =
          typeof req.body.ingredients === "string"
            ? req.body.ingredients
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : req.body.ingredients;
      }

      // ================= VARIANTS =================

      if (req.body.variants !== undefined) {

        try {

          let variants =
            typeof req.body.variants === "string"
              ? JSON.parse(req.body.variants)
              : req.body.variants;

          if (!Array.isArray(variants)) {
            variants = [];
          }

          recipe.variants = variants.map((variant) => ({
            name: variant.name?.trim(),
            price: Number(variant.price),
          }));

        } catch {

          return res.status(400).json({
            message: "Invalid variants format",
          });
        }
      }

      // ================= IMAGE =================

      if (req.file) {
        const uploadedImage = await uploadToCloudinary(
          req.file.buffer,
          "famy/recipes"
        );

        recipe.CoverImage = uploadedImage.secure_url;
      }

      await recipe.save();

      // ================= SOCKET =================

      const io = getIo(req);

      if (io) {
        io.emit("recipeUpdated", recipe);
      }

      res.json({
        message: "Recipe updated successfully",
        recipe,
      });

    } catch (err) {

      console.error("UPDATE RECIPE ERROR:", err);

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// =================================================
// DELETE RECIPE
// ADMIN + RESTAURANT OWNER
// =================================================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "restaurantOwner"),
  async (req, res) => {
    try {

      const recipe = await Recipe.findById(req.params.id);

      if (!recipe) {
        return res.status(404).json({
          message: "Recipe not found",
        });
      }

      // ================= OWNER ACCESS =================

      if (req.user.role === "restaurantOwner") {

        if (!req.user.restaurantId) {
          return res.status(403).json({
            message: "Restaurant not assigned",
          });
        }

        if (
          recipe.restaurantId.toString() !==
          req.user.restaurantId.toString()
        ) {
          return res.status(403).json({
            message: "Not allowed",
          });
        }
      }

      await Recipe.findByIdAndDelete(req.params.id);

      // ================= SOCKET =================

      const io = getIo(req);

      if (io) {
        io.emit("recipeDeleted", req.params.id);
      }

      res.json({
        message: "Recipe deleted successfully",
      });

    } catch (err) {

      console.error("DELETE RECIPE ERROR:", err);

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


module.exports = router;