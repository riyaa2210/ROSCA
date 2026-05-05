"use strict";

const Transaction = require("../models/Transaction");

/**
 * idempotencyCheck middleware
 *
 * Checks if a payment has already been processed before allowing the handler
 * to run. If a completed transaction exists for the same idempotency key,
 * it returns the cached result immediately (HTTP 200) without re-processing.
 *
 * Usage:
 *   router.post("/verify", protect, idempotencyCheck, verifyPayment);
 *
 * The middleware expects req.body to contain:
 *   - razorpay_payment_id  (strongest check — Razorpay guarantees uniqueness)
 *   - OR groupId + month   (fallback composite key)
 */
const idempotencyCheck = async (req, res, next) => {
  try {
    const { razorpay_payment_id, groupId, month } = req.body;

    // ── Check 1: razorpayPaymentId (strongest — globally unique) ─────────────
    if (razorpay_payment_id) {
      const existing = await Transaction.findOne({
        razorpayPaymentId: razorpay_payment_id,
        status: "paid",
      }).populate("group", "name monthlyAmount");

      if (existing) {
        return res.status(200).json({
          message:     "Payment already processed (idempotent response)",
          idempotent:  true,
          transaction: existing,
        });
      }
    }

    // ── Check 2: composite idempotency key ────────────────────────────────────
    if (req.user && groupId && month) {
      const key = Transaction.buildIdempotencyKey(req.user._id, groupId, month);
      const existing = await Transaction.findOne({
        idempotencyKey: key,
        status: "paid",
      });

      if (existing) {
        return res.status(200).json({
          message:     "Payment already processed (idempotent response)",
          idempotent:  true,
          transaction: existing,
        });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = idempotencyCheck;
