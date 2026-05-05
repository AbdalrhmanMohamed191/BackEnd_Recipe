// const express = require("express");
// const router = express.Router();
// const Offer = require("../models/offerSchema");

// const { authMiddleware } = require("../middleWares/authMiddleware");
// const { roleMiddleware } = require("../middleWares/roleMiddleware");

// // =======================
// // GET ALL (مع فلترة)
// // =======================
// router.get("/", async (req, res) => {
//   try {
//     const { active } = req.query;

//     const query = {};

//     // فلترة active
//     if (active !== undefined) {
//       query.isActive = active === "true";
//     }

//     // إخفاء المنتهي
//     const now = new Date();
//     query.$or = [
//       { expiresAt: null },
//       { expiresAt: { $gt: now } },
//     ];

//     const offers = await Offer.find(query).sort({ createdAt: -1 });

//     res.json(offers);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // =======================
// // GET ONE
// // =======================
// router.get("/:id", async (req, res) => {
//   try {
//     const offer = await Offer.findById(req.params.id);

//     if (!offer) {
//       return res.status(404).json({ message: "Offer not found" });
//     }

//     res.json(offer);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // =======================
// // CREATE
// // =======================
// router.post(
//   "/",
//   authMiddleware,
//   roleMiddleware("admin"),
//   async (req, res) => {
//     try {
//       const io = req.app.get("io");

//       const offer = await Offer.create(req.body);

//       // 🔥 socket
//       io.emit("offerCreated", offer);

//       res.status(201).json(offer);
//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   }
// );

// // =======================
// // UPDATE
// // =======================
// router.put(
//   "/:id",
//   authMiddleware,
//   roleMiddleware("admin"),
//   async (req, res) => {
//     try {
//       const io = req.app.get("io");

//       const offer = await Offer.findByIdAndUpdate(
//         req.params.id,
//         req.body,
//         { new: true }
//       );

//       if (!offer) {
//         return res.status(404).json({ message: "Offer not found" });
//       }

//       io.emit("offerUpdated", offer);

//       res.json(offer);
//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   }
// );

// // =======================
// // DELETE
// // =======================
// router.delete(
//   "/:id",
//   authMiddleware,
//   roleMiddleware("admin"),
//   async (req, res) => {
//     try {
//       const io = req.app.get("io");

//       const deleted = await Offer.findByIdAndDelete(req.params.id);

//       if (!deleted) {
//         return res.status(404).json({ message: "Offer not found" });
//       }

//       io.emit("offerDeleted", req.params.id);

//       res.json({ message: "Deleted successfully" });
//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   }
// );

// // =======================
// // TOGGLE ACTIVE
// // =======================
// router.patch(
//   "/:id/toggle",
//   authMiddleware,
//   roleMiddleware("admin"),
//   async (req, res) => {
//     try {
//       const io = req.app.get("io");

//       const offer = await Offer.findById(req.params.id);

//       if (!offer) {
//         return res.status(404).json({ message: "Offer not found" });
//       }

//       offer.isActive = !offer.isActive;
//       await offer.save();

//       io.emit("offerUpdated", offer);

//       res.json(offer);
//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   }
// );

// module.exports = router;


const express = require("express");
const router = express.Router();

const upload = require("../uplods/multer");
const Offer = require("../models/offerSchema");

// =======================
// GET ALL OFFERS
router.get("/", async (req, res) => {
  try {
    const { active } = req.query;

    let filter = {};

    // 🔥 fix active filter
    if (active === "true") {
      filter.isActive = true;
    }

    if (active === "false") {
      filter.isActive = false;
    }

    const offers = await Offer.find(filter).sort({ createdAt: -1 });

    res.json(offers);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// =======================
// CREATE OFFER
// =======================
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, price, discount, expiresAt } = req.body;

    if (!title || !description || !price) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const offer = await Offer.create({
      title,
      description,
      price,
      discount: discount || 0,
      expiresAt,
      isActive: true,
      image: req.file ? `/images/${req.file.filename}` : null,
    });

    const io = req.app.get("io");
    io?.emit("offerCreated", offer);

    res.status(201).json(offer);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// =======================
// DELETE OFFER
// =======================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Offer.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // SOCKET
    const io = req.app.get("io");
    if (io) {
      io.emit("offerDeleted", id);
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});


router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;

    const { title, description, price, discount, expiresAt } = req.body;

    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    offer.title = title;
    offer.description = description;
    offer.price = price;
    offer.discount = discount || 0;
    offer.expiresAt = expiresAt;

    if (req.file) {
      offer.image = `/images/${req.file.filename}`;
    }

    await offer.save();

    const io = req.app.get("io");
    io?.emit("offerUpdated", offer);

    res.json(offer);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// =======================
// TOGGLE OFFER (ACTIVE / INACTIVE)
// =======================
router.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("offerUpdated", offer);
    }

    res.json(offer);
  } catch (err) {
    console.log("TOGGLE ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;