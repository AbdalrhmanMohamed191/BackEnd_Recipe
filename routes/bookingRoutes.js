const express = require("express");
const router = express.Router();
const Booking = require("../models/bookSchema");

// Create booking (USER) + SOCKET
router.post("/create", async (req, res) => {
  try {
    const booking = await Booking.create(req.body);

    // 🔥 send real-time event to admin
    const io = req.app.get("io");
    io.emit("new-booking", booking);

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get all bookings
router.get("/all", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Update status + SOCKET
router.put("/update/:id", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    // 🔥 send real-time update
    const io = req.app.get("io");
    io.emit("bookingUpdated", booking);

    res.json(booking);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Delete + SOCKET
router.delete("/delete/:id", async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);

    const io = req.app.get("io");
    io.emit("booking-deleted", req.params.id);

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;