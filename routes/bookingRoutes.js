const express = require("express");
const router = express.Router();

const Booking = require("../models/bookSchema");
const { authMiddleware } = require("../middleWares/authMiddleware");
const { roleMiddleware } = require("../middleWares/roleMiddleware");


// =====================================================
// CREATE BOOKING - USER
// =====================================================

router.post("/create", authMiddleware, async (req, res) => {
  try {
    const {
      restaurantId,
      guests,
      date,
      time,
      note,
    } = req.body;

    // ================= VALIDATION =================

    if (!restaurantId) {
      return res.status(400).json({
        message: "Restaurant is required",
      });
    }

    if (!guests || guests < 1) {
      return res.status(400).json({
        message: "Guests is required",
      });
    }

    if (!date) {
      return res.status(400).json({
        message: "Date is required",
      });
    }

    if (!time) {
      return res.status(400).json({
        message: "Time is required",
      });
    }


    // ================= CREATE =================

    const booking = await Booking.create({
      userId: req.user._id,

      restaurantId,

      name: req.user.name,

      phone: req.user.phone,

      guests,

      date,

      time,

      note: note || "",

      status: "pending",
    });


    // ================= POPULATE =================

    const fullBooking = await Booking.findById(booking._id)
      .populate("userId", "name email phone")
      .populate("restaurantId", "name phone address");


    // ================= SOCKET =================

    const io = req.app.get("io");

    if (io) {

      // Admin
      io.to("adminRoom").emit(
        "newBooking",
        fullBooking
      );

      // Restaurant Owner
      const restaurant = fullBooking.restaurantId;

      if (restaurant?._id) {
        io.to(
          `restaurant_${restaurant._id}`
        ).emit(
          "newBooking",
          fullBooking
        );
      }

      // User
      io.to(
        req.user._id.toString()
      ).emit(
        "bookingCreated",
        fullBooking
      );
    }


    res.status(201).json({
      message: "Booking created successfully",
      booking: fullBooking,
    });

  } catch (err) {

    console.log("CREATE BOOKING ERROR:", err);

    res.status(500).json({
      message: err.message,
    });
  }
});


// =====================================================
// GET MY BOOKINGS - USER
// =====================================================

router.get(
  "/my-bookings",
  authMiddleware,
  async (req, res) => {

    try {

      const bookings = await Booking.find({
        userId: req.user._id,
      })
        .populate(
          "restaurantId",
          "name image address phone"
        )
        .sort({
          createdAt: -1,
        });

      res.json(bookings);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });

    }
  }
);


// =====================================================
// GET ALL BOOKINGS - ADMIN
// =====================================================

router.get(
  "/all",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {

    try {

      const bookings = await Booking.find()
        .populate(
          "userId",
          "name email phone"
        )
        .populate(
          "restaurantId",
          "name image address phone"
        )
        .sort({
          createdAt: -1,
        });

      res.json(bookings);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });

    }
  }
);


// =====================================================
// GET RESTAURANT BOOKINGS
// RESTAURANT OWNER
// =====================================================

router.get(
  "/restaurant",
  authMiddleware,
  roleMiddleware("restaurantOwner"),
  async (req, res) => {

    try {

      const bookings = await Booking.find({
        restaurantId: req.user.restaurantId,
      })
        .populate(
          "userId",
          "name email phone"
        )
        .populate(
          "restaurantId",
          "name image address phone"
        )
        .sort({
          createdAt: -1,
        });

      res.json(bookings);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });

    }
  }
);


// =====================================================
// UPDATE BOOKING STATUS
// ADMIN / RESTAURANT OWNER
// =====================================================

router.put(
  "/update/:id",
  authMiddleware,
  roleMiddleware("admin", "restaurantOwner"),
  async (req, res) => {

    try {

      const { status } = req.body;

      const allowedStatuses = [
        "pending",
        "approved",
        "rejected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid booking status",
        });
      }


      const booking = await Booking.findById(
        req.params.id
      );

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }


      // ================= OWNER CHECK =================

      if (
        req.user.role === "restaurantOwner" &&
        booking.restaurantId.toString() !==
          req.user.restaurantId.toString()
      ) {

        return res.status(403).json({
          message: "Not allowed",
        });

      }


      booking.status = status;

      await booking.save();


      const fullBooking = await Booking.findById(
        booking._id
      )
        .populate(
          "userId",
          "name email phone"
        )
        .populate(
          "restaurantId",
          "name image address phone"
        );


      // ================= SOCKET =================

      const io = req.app.get("io");

      if (io) {

        io.to(
          fullBooking.userId._id.toString()
        ).emit(
          "bookingUpdated",
          fullBooking
        );

        io.to("adminRoom").emit(
          "bookingUpdated",
          fullBooking
        );

        io.to(
          `restaurant_${fullBooking.restaurantId._id}`
        ).emit(
          "bookingUpdated",
          fullBooking
        );

      }


      res.json({
        message: "Booking status updated",
        booking: fullBooking,
      });

    } catch (err) {

      console.log("UPDATE BOOKING ERROR:", err);

      res.status(500).json({
        message: err.message,
      });

    }
  }
);


// =====================================================
// DELETE BOOKING
// ADMIN ONLY
// =====================================================

router.delete(
  "/delete/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {

    try {

      const booking =
        await Booking.findByIdAndDelete(
          req.params.id
        );

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }


      const io = req.app.get("io");

      if (io) {

        io.emit(
          "bookingDeleted",
          booking._id
        );

      }


      res.json({
        message: "Booking deleted successfully",
      });

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });

    }
  }
);


module.exports = router;