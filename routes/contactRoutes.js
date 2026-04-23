const express = require("express");
const Contact = require("../models/contact.js");
const { authMiddleware } = require("../middleWares/authMiddleware.js");


const router = express.Router();

// ==========================
// SEND MESSAGE (USER)
// ==========================
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    // حماية إضافية داخل الـ route نفسه
    const name = req.user?.name;
    const phone = req.user?.phone;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const contact = await Contact.create({
      name: req.user?.name || "Unknown User",
      phone: req.user?.phone || "Unknown Phone",
      email: req.user?.email || "Unknown Email",
      message,
    });

    // Socket emit
    const io = req.app.get("io");
    io.emit("newContactMessage", contact);

    res.status(201).json(contact);

  } catch (err) {
    console.log("CONTACT ERROR:", err);

    // مهم جدًا: نطبع السبب الحقيقي في الكونسول
    res.status(500).json({
      message: "Something went wrong in contact route",
      error: err.message,
    });
  }
});


// ==========================
// GET ALL (ADMIN)
// ==========================
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ==========================
// UPDATE STATUS (ADMIN)
// ==========================
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    // realtime update للادمن
    const io = req.app.get("io");
    io.emit("updateContactMessage", updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;