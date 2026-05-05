const mongoose = require("mongoose");

/**
 * LedgerEntry — immutable, append-only audit log.
 * Every balance change on a Wallet MUST have a corresponding LedgerEntry.
 * Entries are NEVER updated or deleted.
 */
const ledgerEntrySchema = new mongoose.Schema(
  {
    // ── Who ───────────────────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },

    // ── What ──────────────────────────────────────────────────────────────────
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Amount must be positive"],
    },
    balanceBefore: { type: Number, required: true }, // snapshot before
    balanceAfter:  { type: Number, required: true }, // snapshot after

    // ── Why ───────────────────────────────────────────────────────────────────
    source: {
      type: String,
      enum: [
        "contribution", // member paid monthly contribution
        "payout",       // member received group payout
        "refund",       // refund for failed/cancelled contribution
        "admin_credit", // manual credit by admin
        "admin_debit",  // manual debit by admin
        "withdrawal",   // user withdrew funds
        "deposit",      // user deposited funds
      ],
      required: true,
    },
    description: { type: String, trim: true, maxlength: 255 },

    // ── Reference (polymorphic) ───────────────────────────────────────────────
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referenceModel: {
      type: String,
      enum: ["Group", "Transaction", "User", null],
      default: null,
    },

    // ── Idempotency key ───────────────────────────────────────────────────────
    // Prevents double-processing the same event.
    // Format: "<source>:<referenceId>" e.g. "contribution:64abc123"
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true, // allow null, enforce uniqueness when set
      index: true,
    },

    // ── Audit ─────────────────────────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
ledgerEntrySchema.index({ user: 1, createdAt: -1 });
ledgerEntrySchema.index({ wallet: 1, createdAt: -1 });
ledgerEntrySchema.index({ referenceId: 1 });

// ── Guard: ledger is append-only — block all updates ─────────────────────────
ledgerEntrySchema.pre(
  ["updateOne", "findOneAndUpdate", "updateMany"],
  function () {
    throw new Error("LedgerEntry is immutable — updates are not allowed");
  }
);

module.exports = mongoose.model("LedgerEntry", ledgerEntrySchema);
