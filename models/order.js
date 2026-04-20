const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
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
  required: false
},
  items: [
    {
      _id: String,
      title: String,
      price: Number,
      quantity: Number,
    },
  ],
  status: {
    type: String,
    enum: ["pending", "preparing", "delivered", "cancelled"],
    default: "pending",
  },
  paymentMethod: {
  type: String,
  enum: ["cash", "card"],
  default: "cash",
},

isPaid: {
  type: Boolean,
  default: false,
},
  totalPrice: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isArchived: {
  type: Boolean,
  default: false,
},
deliveryFee: {
  type: Number,
  default: 15
},
address: {
  street: String,
  city: String,
  notes: String,
}
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;