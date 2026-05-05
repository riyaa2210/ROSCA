const mongoose = require("mongoose");

/**
 * Wallet — one per user.
 * RULE: balance must NEVER be updated directly.
 * All mutations go through WalletService inside a MongoDB session.
 */
const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },
    totalCredited: { type: Number, default: 0 },
    totalDebited:  { type: Number, default: 0 },
    currency:      { type: String, default: "INR" },
    isActive:      { type: Boolean, default: true },
  },
  {
    timestamps: true,
    optimisticConcurrency: true, // auto-increments __v, detects stale reads
  }
);

walletSchema.methods.hasSufficientBalance = function (amount) {
  return this.balance >= amount;
};

module.exports = mongoose.model("Wallet", walletSchema);
