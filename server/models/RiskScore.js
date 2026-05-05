"use strict";

const mongoose = require("mongoose");

/**
 * RiskScore — persisted risk profile per user.
 *
 * Strategy: hybrid (computed + cached)
 *  - Score is computed via MongoDB aggregation after each payment event
 *  - Result is stored here for fast reads (O(1) lookup vs O(n) aggregation)
 *  - computedAt tracks freshness — stale scores can be recomputed on demand
 *
 * Score range: 0–100
 *  0–39  → HIGH risk   (frequent late/missed payments)
 *  40–69 → MEDIUM risk (occasional issues)
 *  70–100→ LOW risk    (reliable payer)
 */
const riskScoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // ── Computed score ────────────────────────────────────────────────────────
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50, // neutral starting score for new users
    },

    category: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },

    // ── Raw factors (stored for transparency + debugging) ─────────────────────
    factors: {
      totalContributions: { type: Number, default: 0 }, // total expected payments
      onTimePayments:     { type: Number, default: 0 }, // paid within grace period
      latePayments:       { type: Number, default: 0 }, // paid after grace period
      missedPayments:     { type: Number, default: 0 }, // still pending/failed
      currentStreak:      { type: Number, default: 0 }, // consecutive on-time payments
      longestStreak:      { type: Number, default: 0 }, // best streak ever
      avgDaysLate:        { type: Number, default: 0 }, // average days late (for late payments)
      totalAmountPaid:    { type: Number, default: 0 }, // total ₹ contributed
    },

    // ── Score breakdown (for UI display) ─────────────────────────────────────
    breakdown: {
      onTimeScore:  { type: Number, default: 0 }, // 0–40 pts
      lateScore:    { type: Number, default: 0 }, // 0–30 pts (penalty)
      streakScore:  { type: Number, default: 0 }, // 0–20 pts
      volumeScore:  { type: Number, default: 0 }, // 0–10 pts
    },

    // ── Meta ──────────────────────────────────────────────────────────────────
    computedAt:   { type: Date, default: Date.now },
    version:      { type: Number, default: 1 }, // increments on each recompute
    isStale:      { type: Boolean, default: false }, // true = needs recompute
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
riskScoreSchema.index({ score: 1 });
riskScoreSchema.index({ category: 1 });
riskScoreSchema.index({ computedAt: 1 });

// ── Static: category from score ───────────────────────────────────────────────
riskScoreSchema.statics.getCategory = function (score) {
  if (score >= 70) return "LOW";
  if (score >= 40) return "MEDIUM";
  return "HIGH";
};

module.exports = mongoose.model("RiskScore", riskScoreSchema);
