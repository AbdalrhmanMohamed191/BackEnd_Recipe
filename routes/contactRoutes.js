const express = require("express");
const Contact = require("../models/contact.js");

const { authMiddleware } = require("../middleWares/authMiddleware.js");
const { roleMiddleware } = require("../middleWares/roleMiddleware.js");

const router = express.Router();


// =================================================
// SEND MESSAGE - USER
// =================================================
router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const { message } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({
          message: "Message is required",
        });
      }

      const contact = await Contact.create({
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email,
        message: message.trim(),
      });

      // ================= SOCKET =================

      const io = req.app.get("io");

      if (io) {
        io.to("adminRoom").emit(
          "newContactMessage",
          contact
        );
      }

      res.status(201).json({
        message: "Message sent successfully",
        contact,
      });

    } catch (err) {
      console.log("CONTACT ERROR:", err);

      res.status(500).json({
        message: "Something went wrong",
        error: err.message,
      });
    }
  }
);


// =================================================
// GET ALL CONTACT MESSAGES - ADMIN
// =================================================
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {

      const contacts = await Contact.find()
        .sort({ createdAt: -1 });

      res.json(contacts);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// =================================================
// GET ONE CONTACT - ADMIN
// =================================================
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {

      const contact = await Contact.findById(
        req.params.id
      );

      if (!contact) {
        return res.status(404).json({
          message: "Contact message not found",
        });
      }

      res.json(contact);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// =================================================
// UPDATE CONTACT STATUS - ADMIN
// =================================================
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {

      const { status } = req.body;

      const allowedStatuses = [
        "pending",
        "read",
        "replied",
        "closed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status",
        });
      }

      const updated = await Contact.findByIdAndUpdate(
        req.params.id,
        { status },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updated) {
        return res.status(404).json({
          message: "Contact message not found",
        });
      }

      // ================= SOCKET =================

      const io = req.app.get("io");

      if (io) {
        io.to("adminRoom").emit(
          "updateContactMessage",
          updated
        );
      }

      res.json({
        message: "Contact status updated",
        contact: updated,
      });

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// =================================================
// DELETE CONTACT - ADMIN
// =================================================
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {

      const deleted = await Contact.findByIdAndDelete(
        req.params.id
      );

      if (!deleted) {
        return res.status(404).json({
          message: "Contact message not found",
        });
      }

      const io = req.app.get("io");

      if (io) {
        io.to("adminRoom").emit(
          "contactDeleted",
          deleted._id
        );
      }

      res.json({
        message: "Contact deleted successfully",
      });

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


module.exports = router;