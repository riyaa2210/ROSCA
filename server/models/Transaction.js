const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["contribution", "payout"], required: true },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    month: { type: Number, required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paidAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
