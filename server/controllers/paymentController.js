"use strict";

const Razorpay = require("razorpay");
const Transaction = require("../models/Transaction");
const Group       = require("../models/Group");
const {
  processVerifiedPayment,
  processWebhookEvent,
} = require("../services/paymentService");

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── POST /api/payments/order ──────────────────────────────────────────────────
exports.createOrder = async (req, res, next) => {
  try {
    const { groupId, month } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.status === "active"
    );
    if (!isMember) return res.status(403).json({ message: "Not an active member" });

    // Idempotency: check if already paid for this month
    const idempotencyKey = Transaction.buildIdempotencyKey(req.user._id, groupId, month);
    const existing = await Transaction.findOne({ idempotencyKey, status: "paid" });
    if (existing) {
      return res.status(400).json({
        message:     "Already paid for this month",
        idempotent:  true,
        transaction: existing,
      });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount:   group.monthlyAmount * 100, // paise
      currency: "INR",
      receipt:  `ss_${groupId}_${req.user._id}_${month}`.slice(0, 40),
      notes: {
        userId:  req.user._id.toString(),
        groupId: groupId.toString(),
        month:   String(month),
      },
    });

    res.json({ order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/payments/verify ─────────────────────────────────────────────────
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      groupId,
      month,
    } = req.body;

    const io = req.app.get("io");

    const transaction = await processVerifiedPayment({
      orderId:   razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      groupId,
      month:     Number(month),
      userId:    req.user._id,
      io,
    });

    // Return 200 whether it was freshly processed or idempotent
    res.json({
      message:     "Payment verified",
      idempotent:  transaction.processingStatus === "done" && transaction.razorpayPaymentId === razorpay_payment_id,
      transaction,
    });
  } catch (err) {
    if (err.code === "INVALID_SIGNATURE") {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

// ── POST /api/payments/webhook ────────────────────────────────────────────────
// IMPORTANT: This route must receive the RAW body (not JSON-parsed).
// Register it BEFORE express.json() middleware, or use express.raw() on this route.
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const eventId   = req.headers["x-razorpay-event-id"];
    const rawBody   = req.rawBody; // set by rawBodyMiddleware (see routes)
    const payload   = req.body;   // parsed by express.json after raw capture
    const io        = req.app.get("io");

    const result = await processWebhookEvent({
      rawBody,
      signature,
      eventId,
      payload,
      io,
    });

    // Always return 200 to Razorpay — even for skipped/duplicate events.
    // Returning non-200 causes Razorpay to retry indefinitely.
    res.status(200).json({ received: true, ...result });

  } catch (err) {
    if (err.code === "INVALID_WEBHOOK_SIGNATURE") {
      // Return 400 for invalid signatures — tells Razorpay something is wrong
      return res.status(400).json({ message: "Invalid webhook signature" });
    }
    console.error("[Webhook] Unhandled error:", err);
    // Return 200 anyway — we'll handle via reconciliation
    res.status(200).json({ received: true, error: err.message });
  }
};

// ── GET /api/payments/group/:groupId ─────────────────────────────────────────
exports.getGroupTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ group: req.params.groupId })
      .populate("user", "name email profilePic")
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
};
