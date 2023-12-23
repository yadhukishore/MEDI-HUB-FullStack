const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    payment_id: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    payment_method: {
      type: String,
    },
    status: {
      type: String,
      required: true,
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Payment", paymentSchema);
