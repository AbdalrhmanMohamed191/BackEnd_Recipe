// const express = require("express");
// const router = express.Router();
// const Recipe = require("../models/recipeSchema");
// const upload = require("../uplods/multer");

// const { authMiddleware } = require("../middleWares/authMiddleware");
// const { roleMiddleware } = require("../middleWares/roleMiddleware");

// // ================= CREATE =================
// router.post(
//   "/",
//   authMiddleware,
//   roleMiddleware("admin"),
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       const { title, instructions, price, category } = req.body;

//       if (!title || !instructions || !price) {
//         return res.status(400).json({ message: "Missing fields" });
//       }

//       if (!req.file) {
//         return res.status(400).json({ message: "Image required" });
//       }

//       let ingredients = [];

//       if (typeof req.body.ingredients === "string") {
//         ingredients = req.body.ingredients.split(",").map(i => i.trim());
//       } else {
//         ingredients = req.body.ingredients || [];
//       }

//       const recipe = new Recipe({
//         title,
//         instructions,
//         price,
//         category,
//         ingredients,
//         CoverImage: `/images/${req.file.filename}`,
//       });

//       await recipe.save();

//       return res.status(201).json({
//         message: "Created",
//         recipe,
//       });

//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ message: err.message });
//     }
//   }
// );

// // ================= GET ALL =================
// router.get("/", async (req, res) => {
//   const recipes = await Recipe.find().sort({ createdAt: -1 });
//   res.json(recipes);
// });

// // ================= UPDATE =================
// router.put(
//   "/:id",
//   authMiddleware,
//   roleMiddleware("admin"),
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       const updateData = { ...req.body };

//       if (req.body.ingredients) {
//         updateData.ingredients = req.body.ingredients.split(",").map(i => i.trim());
//       }

//       if (req.file) {
//         updateData.CoverImage = `/images/${req.file.filename}`;
//       }

//       const updated = await Recipe.findByIdAndUpdate(
//         req.params.id,
//         updateData,
//         { new: true }
//       );

//       res.json({
//         message: "Updated",
//         recipe: updated,
//       });

//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   }
// );

// // ================ GET ONE =================
// router.get("/:id", async (req, res) => {
//   const recipe = await Recipe.findById(req.params.id);
//   res.json(recipe);
// });

// // ================= DELETE =================
// router.delete(
//   "/:id",
//   authMiddleware,
//   roleMiddleware("admin"),
//   async (req, res) => {
//     await Recipe.findByIdAndDelete(req.params.id);
//     res.json({ message: "Deleted" });
//   }
// );

// module.exports = router;

const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipeSchema");
const upload = require("../uplods/multer");
const { authMiddleware } = require("../middleWares/authMiddleware");
const { roleMiddleware } = require("../middleWares/roleMiddleware");

// ✅ التعديل هنا: نستخدم "io" ليتطابق مع app.set("io", io) في server.js
const getIo = (req) => req.app.get("io");

// ================= CREATE =================
router.post("/", authMiddleware, roleMiddleware("admin"), upload.single("image"), async (req, res) => {
    try {
      const { title, instructions, price, category } = req.body;
      if (!title || !instructions || !price) return res.status(400).json({ message: "Missing fields" });
      if (!req.file) return res.status(400).json({ message: "Image required" });

      let ingredients = [];
      if (typeof req.body.ingredients === "string") {
        ingredients = req.body.ingredients.split(",").map(i => i.trim());
      } else {
        ingredients = req.body.ingredients || [];
      }

      const recipe = new Recipe({
        title,
        instructions,
        price,
        category,
        ingredients,
        CoverImage: `/images/${req.file.filename}`,
      });

      await recipe.save();

      // 🔥 إرسال الإشارة بالاسم الصحيح
      const io = getIo(req);
      if (io) io.emit("recipeCreated", recipe);

      return res.status(201).json({ message: "Created", recipe });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
});

// ================= UPDATE =================
router.put("/:id", authMiddleware, roleMiddleware("admin"), upload.single("image"), async (req, res) => {
    try {
      const updateData = { ...req.body };
      if (req.body.ingredients && typeof req.body.ingredients === "string") {
        updateData.ingredients = req.body.ingredients.split(",").map(i => i.trim());
      }
      if (req.file) {
        updateData.CoverImage = `/images/${req.file.filename}`;
      }

      const updated = await Recipe.findByIdAndUpdate(req.params.id, updateData, { new: true });

      // 🔥 إرسال التحديث
      const io = getIo(req);
      if (io) io.emit("recipeUpdated", updated);

      res.json({ message: "Updated", recipe: updated });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
});

// ================= DELETE =================
router.delete("/:id", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    try {
      await Recipe.findByIdAndDelete(req.params.id);

      // 🔥 إرسال الحذف
      const io = getIo(req);
      if (io) io.emit("recipeDeleted", req.params.id);

      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
});

// GET ALL & GET ONE تبقى كما هي...
router.get("/", async (req, res) => {
  const recipes = await Recipe.find().sort({ createdAt: -1 });
  res.json(recipes);
});

router.get("/:id", async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  res.json(recipe);
});

module.exports = router;