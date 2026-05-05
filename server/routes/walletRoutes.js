"use strict";

const express = require("express");
const router  = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/walletController");

router.use(protect);

// User routes
router.get("/",           ctrl.getMyWallet);   // GET  /api/wallet
router.get("/ledger",     ctrl.getMyLedger);   // GET  /api/wallet/ledger
router.get("/reconcile",  ctrl.reconcile);     // GET  /api/wallet/reconcile
router.post("/deposit",   ctrl.deposit);       // POST /api/wallet/deposit
router.post("/withdraw",  ctrl.withdraw);      // POST /api/wallet/withdraw

// Admin routes
router.post("/admin/credit", adminOnly, ctrl.adminCredit); // POST /api/wallet/admin/credit
router.post("/admin/debit",  adminOnly, ctrl.adminDebit);  // POST /api/wallet/admin/debit

module.exports = router;
