"use strict";

const mongoose = require("mongoose");

/**
 * Transaction schema — production-grade with idempotency support.
 *
 * Idempotency strategy:
 *  - razorpayPaymentId has a unique sparse index → DB-level duplicate prevention
 *  - idempotencyKey (user+group+month) has a unique sparse index → prevents
 *    duplicate orders for the same billing period
 *  - processingStatus tracks in-flight state to handle race conditions
 */
const transactionSchema = new mongoose.Schema(
  {
    // ── Core ──────────────────────────────────────────────────────────────────
    user:   { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true, index: true },
    group:  { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    type:   { type: String, enum: ["contribution", "payout"], required: true },
    month:  { type: Number, required: true },

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    /**
     * processingStatus — prevents race conditions on concurrent webhook retries.
     *
     *  idle        → not yet being processed
     *  processing  → a handler is currently working on this transaction
     *                (set atomically with findOneAndUpdate + $set)
     *  done        → fully processed, idempotent responses served from DB
     */
    processingStatus: {
      type: String,
      enum: ["idle", "processing", "done"],
      default: "idle",
    },

    // Timestamp when processing lock was acquired (for stale-lock detection)
    processingLockedAt: { type: Date, default: null },

    // ── Razorpay fields ───────────────────────────────────────────────────────
    razorpayOrderId:   { type: String, index: true },
    razorpayPaymentId: { type: String, sparse: true }, // unique index below
    razorpaySignature: { type: String },
    razorpayWebhookId: { type: String }, // X-Razorpay-Event-Id header

    // ── Idempotency ───────────────────────────────────────────────────────────
    /**
     * Composite idempotency key: "<userId>:<groupId>:<month>:<type>"
     * Ensures one paid transaction per user per group per month per type.
     * Unique + sparse → null values are allowed (pending txs before payment).
     */
    idempotencyKey: { type: String, sparse: true }, // unique index below

    // ── Timestamps ────────────────────────────────────────────────────────────
    paidAt:    { type: Date },
    failedAt:  { type: Date },
    refundedAt:{ type: Date },

    // ── Failure info ──────────────────────────────────────────────────────────
    failureReason:  { type: String },
    failureCode:    { type: String },

    // ── Webhook audit ─────────────────────────────────────────────────────────
    // Array of all webhook event IDs received for this transaction.
    // Used to detect and skip duplicate webhook deliveries.
    webhookEvents: [
      {
        eventId:   { type: String },
        event:     { type: String },
        receivedAt:{ type: Date, default: Date.now },
      },
    ],

    // ── Refund ────────────────────────────────────────────────────────────────
    refundId:     { type: String },
    refundAmount: { type: Number },

    notes: { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
    optimisticConcurrency: true, // __v increments on save, detects stale writes
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

// Unique: one razorpayPaymentId per transaction (core idempotency)
transactionSchema.index(
  { razorpayPaymentId: 1 },
  { unique: true, sparse: true, name: "unique_razorpay_payment_id" }
);

// Unique: one paid/processing transaction per user+group+month+type
transactionSchema.index(
  { idempotencyKey: 1 },
  { unique: true, sparse: true, name: "unique_idempotency_key" }
);

// Compound: fast lookup for payment status checks
transactionSchema.index({ user: 1, group: 1, month: 1, type: 1 });

// Compound: webhook dedup lookup
transactionSchema.index({ razorpayOrderId: 1, status: 1 });

// ── Static helpers ────────────────────────────────────────────────────────────

/**
 * Build the idempotency key for a contribution.
 * Format: "contribution:<userId>:<groupId>:<month>"
 */
transactionSchema.statics.buildIdempotencyKey = function (userId, groupId, month, type = "contribution") {
  return `${type}:${userId}:${groupId}:${month}`;
};

module.exports = mongoose.model("Transaction", transactionSchema);
