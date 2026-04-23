const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    guests: Number,
    date: String,
    time: String,
    note: String,

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending" , // pending | approved | rejected
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);