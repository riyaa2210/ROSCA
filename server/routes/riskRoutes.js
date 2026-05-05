"use strict";

const express = require("express");
const router  = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getMyRiskScore,
  getUserRiskScore,
  recomputeScore,
  getGroupRiskSummary,
} = require("../controllers/riskController");

router.use(protect);

// User routes
router.get("/me",                    getMyRiskScore);       // GET /api/risk/me
router.get("/me?refresh=true",       getMyRiskScore);       // force recompute

// Admin routes
router.get("/user/:userId",          adminOnly, getUserRiskScore);
router.post("/recompute/:userId",    adminOnly, recomputeScore);
router.get("/group/:groupId",        adminOnly, getGroupRiskSummary);

module.exports = router;
