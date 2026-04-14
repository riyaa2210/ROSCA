const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getOverview, getTrends, getPaymentBehaviour, getGroupBreakdown } = require("../controllers/analyticsController");

router.use(protect);
router.get("/overview",          getOverview);
router.get("/trends",            getTrends);
router.get("/payment-behaviour", getPaymentBehaviour);
router.get("/group-breakdown",   getGroupBreakdown);

module.exports = router;
