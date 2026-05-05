"use strict";

const express = require("express");
const router  = express.Router();
const { protect }        = require("../middleware/authMiddleware");
const idempotencyCheck   = require("../middleware/idempotency");
const rawBodyMiddleware  = require("../middleware/rawBody");
const {
  createOrder,
  verifyPayment,
  handleWebhook,
  getGroupTransactions,
} = require("../controllers/paymentController");

// ── Webhook — NO auth, raw body capture, public ───────────────────────────────
// Must be defined BEFORE the protect middleware is applied globally.
// Uses rawBodyMiddleware instead of express.json() for signature verification.
router.post(
  "/webhook",
  rawBodyMiddleware,   // captures raw body + parses JSON into req.body
  handleWebhook
);

// ── Authenticated routes ──────────────────────────────────────────────────────
router.use(protect);

router.post("/order",  createOrder);

router.post(
  "/verify",
  idempotencyCheck,   // returns cached result if already processed
  verifyPayment
);

router.get("/group/:groupId", getGroupTransactions);

module.exports = router;
