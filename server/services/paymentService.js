"use strict";

const crypto      = require("crypto");
const mongoose    = require("mongoose");
const Transaction = require("../models/Transaction");
const Group       = require("../models/Group");
const { creditWallet, debitWallet, DuplicateOperationError } = require("./walletService");
const { createNotification } = require("./notificationService");

// ── Constants ─────────────────────────────────────────────────────────────────
const PROCESSING_LOCK_TTL_MS = 30_000; // 30s — stale lock timeout

// ── Signature verification ────────────────────────────────────────────────────

/**
 * verifyRazorpaySignature
 * Verifies the HMAC-SHA256 signature from Razorpay checkout callback.
 * Throws if invalid — never returns false silently.
 */
function verifyRazorpaySignature(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf   = Buffer.from(signature, "hex");

  if (
    expectedBuf.length !== actualBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, actualBuf)
  ) {
    const err = new Error("Invalid payment signature");
    err.code  = "INVALID_SIGNATURE";
    err.status = 400;
    throw err;
  }
}

/**
 * verifyRazorpayWebhookSignature
 * Verifies the HMAC-SHA256 signature from Razorpay webhook.
 * Uses the raw request body (must be captured before JSON parsing).
 */
function verifyRazorpayWebhookSignature(rawBody, signature) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf   = Buffer.from(signature || "", "hex");

  if (
    expectedBuf.length !== actualBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, actualBuf)
  ) {
    const err = new Error("Invalid webhook signature");
    err.code  = "INVALID_WEBHOOK_SIGNATURE";
    err.status = 400;
    throw err;
  }
}

// ── Processing lock ───────────────────────────────────────────────────────────

/**
 * acquireProcessingLock
 *
 * Atomically sets processingStatus = "processing" on a transaction
 * ONLY if it is currently "idle" (or has a stale lock older than TTL).
 *
 * Returns the locked transaction, or null if another process holds the lock.
 *
 * This is the "check-then-act" pattern done atomically with findOneAndUpdate.
 */
async function acquireProcessingLock(transactionId) {
  const staleThreshold = new Date(Date.now() - PROCESSING_LOCK_TTL_MS);

  const locked = await Transaction.findOneAndUpdate(
    {
      _id: transactionId,
      $or: [
        { processingStatus: "idle" },
        // Stale lock — previous process crashed without releasing
        { processingStatus: "processing", processingLockedAt: { $lt: staleThreshold } },
      ],
    },
    {
      $set: {
        processingStatus:   "processing",
        processingLockedAt: new Date(),
      },
    },
    { new: true }
  );

  return locked; // null = lock not acquired (another process has it)
}

/**
 * releaseProcessingLock
 * Marks the transaction as done and releases the lock.
 */
async function releaseProcessingLock(transactionId, updateFields = {}) {
  return Transaction.findByIdAndUpdate(
    transactionId,
    {
      $set: {
        processingStatus:   "done",
        processingLockedAt: null,
        ...updateFields,
      },
    },
    { new: true }
  );
}

// ── Core payment processing ───────────────────────────────────────────────────

/**
 * processVerifiedPayment
 *
 * Called after signature verification succeeds.
 * Handles idempotency, race conditions, wallet debit, and notifications.
 *
 * @param {object} params
 * @param {string} params.orderId
 * @param {string} params.paymentId
 * @param {string} params.signature
 * @param {string} params.groupId
 * @param {number} params.month
 * @param {ObjectId} params.userId
 * @param {object} params.io  - Socket.io instance (optional)
 *
 * @returns {Transaction} the final transaction document
 */
async function processVerifiedPayment({ orderId, paymentId, signature, groupId, month, userId, io }) {
  // ── Step 1: Verify signature ──────────────────────────────────────────────
  verifyRazorpaySignature(orderId, paymentId, signature);

  // ── Step 2: Idempotency check — already paid? ─────────────────────────────
  const alreadyPaid = await Transaction.findOne({
    razorpayPaymentId: paymentId,
    status: "paid",
  });
  if (alreadyPaid) return alreadyPaid; // idempotent — return cached result

  // ── Step 3: Find or create the pending transaction ────────────────────────
  const idempotencyKey = Transaction.buildIdempotencyKey(userId, groupId, month);

  let tx = await Transaction.findOne({
    idempotencyKey,
    status: { $in: ["pending", "processing"] },
  });

  if (!tx) {
    // No pending transaction found — create one (upsert-safe)
    const group = await Group.findById(groupId).select("monthlyAmount");
    if (!group) throw Object.assign(new Error("Group not found"), { status: 404 });

    try {
      tx = await Transaction.create({
        user:           userId,
        group:          groupId,
        amount:         group.monthlyAmount,
        type:           "contribution",
        month,
        status:         "pending",
        idempotencyKey,
        razorpayOrderId: orderId,
      });
    } catch (err) {
      // Duplicate key on idempotencyKey — another request created it concurrently
      if (err.code === 11000) {
        tx = await Transaction.findOne({ idempotencyKey });
        if (tx?.status === "paid") return tx;
      } else {
        throw err;
      }
    }
  }

  // ── Step 4: Acquire processing lock (race condition protection) ───────────
  const locked = await acquireProcessingLock(tx._id);
  if (!locked) {
    // Another process is handling this — wait briefly and return current state
    await new Promise((r) => setTimeout(r, 200));
    return Transaction.findById(tx._id);
  }

  try {
    // ── Step 5: Fetch group for wallet debit ─────────────────────────────────
    const group = await Group.findById(groupId).select("monthlyAmount name");

    // ── Step 6: Debit wallet (idempotent via walletService) ───────────────────
    if (group) {
      try {
        await debitWallet(userId, group.monthlyAmount, {
          source:         "contribution",
          description:    `Contribution for "${group.name}" — Month ${month}`,
          referenceId:    tx._id,
          referenceModel: "Transaction",
          idempotencyKey: `contribution:${tx._id}`,
        });
      } catch (walletErr) {
        if (!(walletErr instanceof DuplicateOperationError)) {
          // Log but don't fail — wallet and payment can be reconciled later
          console.error("[PaymentService] wallet debit error:", walletErr.message);
        }
      }
    }

    // ── Step 7: Mark transaction as paid + release lock ───────────────────────
    const finalTx = await releaseProcessingLock(tx._id, {
      status:            "paid",
      razorpayOrderId:   orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      paidAt:            new Date(),
    });

    // ── Step 8: Notifications + real-time ────────────────────────────────────
    await createNotification({
      userId,
      title:   "Payment Successful",
      message: `Your contribution for month ${month} has been recorded.`,
      type:    "general",
    });

    if (io) {
      io.to(`group_${groupId}`).emit("payment_update", {
        userId, month, status: "paid",
      });
    }

    // ── Step 9: Trigger async risk score recompute ────────────────────────────
    // Fire-and-forget — don't await, don't block the payment response
    const { computeAndSaveRiskScore } = require("./riskScoringService");
    computeAndSaveRiskScore(userId).catch((err) =>
      console.error("[RiskScore] recompute failed after payment:", err.message)
    );

    return finalTx;

  } catch (err) {
    // Release lock on failure — set back to idle so it can be retried
    await Transaction.findByIdAndUpdate(tx._id, {
      $set: { processingStatus: "idle", processingLockedAt: null },
    });
    throw err;
  }
}

// ── Webhook event processor ───────────────────────────────────────────────────

/**
 * processWebhookEvent
 *
 * Handles Razorpay webhook events idempotently.
 * Razorpay may deliver the same event multiple times — we deduplicate
 * using the X-Razorpay-Event-Id header.
 *
 * @param {object} params
 * @param {string} params.rawBody     - raw request body string (for sig verify)
 * @param {string} params.signature   - X-Razorpay-Signature header
 * @param {string} params.eventId     - X-Razorpay-Event-Id header
 * @param {object} params.payload     - parsed JSON body
 * @param {object} params.io          - Socket.io instance
 */
async function processWebhookEvent({ rawBody, signature, eventId, payload, io }) {
  // ── Step 1: Verify webhook signature ─────────────────────────────────────
  verifyRazorpayWebhookSignature(rawBody, signature);

  const event   = payload.event;
  const payment = payload.payload?.payment?.entity;

  if (!payment) {
    return { skipped: true, reason: "No payment entity in payload" };
  }

  const orderId   = payment.order_id;
  const paymentId = payment.id;

  // ── Step 2: Deduplicate by eventId ────────────────────────────────────────
  if (eventId) {
    const alreadyProcessed = await Transaction.findOne({
      razorpayOrderId: orderId,
      "webhookEvents.eventId": eventId,
    });
    if (alreadyProcessed) {
      return { skipped: true, reason: "Duplicate webhook event", eventId };
    }
  }

  // ── Step 3: Find the transaction for this order ───────────────────────────
  const tx = await Transaction.findOne({ razorpayOrderId: orderId });
  if (!tx) {
    // Order not found — could be from a different system, log and ignore
    console.warn("[Webhook] Unknown order:", orderId);
    return { skipped: true, reason: "Order not found" };
  }

  // ── Step 4: Record this webhook event (for audit) ─────────────────────────
  await Transaction.findByIdAndUpdate(tx._id, {
    $push: { webhookEvents: { eventId, event, receivedAt: new Date() } },
  });

  // ── Step 5: Handle event type ─────────────────────────────────────────────
  switch (event) {
    case "payment.captured": {
      // Already paid — idempotent
      if (tx.status === "paid") {
        return { skipped: true, reason: "Already paid" };
      }

      // Acquire lock and mark paid
      const locked = await acquireProcessingLock(tx._id);
      if (!locked) {
        return { skipped: true, reason: "Processing lock held by another process" };
      }

      try {
        const group = await Group.findById(tx.group).select("monthlyAmount name");

        if (group) {
          try {
            await debitWallet(tx.user, group.monthlyAmount, {
              source:         "contribution",
              description:    `Webhook: contribution for "${group.name}" — Month ${tx.month}`,
              referenceId:    tx._id,
              referenceModel: "Transaction",
              idempotencyKey: `contribution:${tx._id}`,
            });
          } catch (walletErr) {
            if (!(walletErr instanceof DuplicateOperationError)) {
              console.error("[Webhook] wallet debit error:", walletErr.message);
            }
          }
        }

        await releaseProcessingLock(tx._id, {
          status:            "paid",
          razorpayPaymentId: paymentId,
          paidAt:            new Date(),
        });

        await createNotification({
          userId:  tx.user,
          title:   "Payment Confirmed",
          message: `Your contribution for month ${tx.month} has been confirmed.`,
          type:    "general",
        });

        if (io) {
          io.to(`group_${tx.group}`).emit("payment_update", {
            userId: tx.user, month: tx.month, status: "paid",
          });
        }

        return { processed: true, event, transactionId: tx._id };

      } catch (err) {
        await Transaction.findByIdAndUpdate(tx._id, {
          $set: { processingStatus: "idle", processingLockedAt: null },
        });
        throw err;
      }
    }

    case "payment.failed": {
      if (tx.status === "failed") return { skipped: true, reason: "Already failed" };

      await Transaction.findByIdAndUpdate(tx._id, {
        $set: {
          status:        "failed",
          failedAt:      new Date(),
          failureReason: payment.error_description || "Payment failed",
          failureCode:   payment.error_code        || "UNKNOWN",
          processingStatus: "done",
        },
      });

      await createNotification({
        userId:  tx.user,
        title:   "Payment Failed",
        message: `Your payment for month ${tx.month} failed. Please try again.`,
        type:    "payment_reminder",
      });

      return { processed: true, event, transactionId: tx._id };
    }

    case "refund.processed": {
      const refund = payload.payload?.refund?.entity;
      await Transaction.findByIdAndUpdate(tx._id, {
        $set: {
          status:       "refunded",
          refundId:     refund?.id,
          refundAmount: refund?.amount ? refund.amount / 100 : tx.amount,
          refundedAt:   new Date(),
        },
      });
      return { processed: true, event, transactionId: tx._id };
    }

    default:
      return { skipped: true, reason: `Unhandled event: ${event}` };
  }
}

module.exports = {
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
  processVerifiedPayment,
  processWebhookEvent,
};
