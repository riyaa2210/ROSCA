const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createOrder,
  verifyPayment,
  getGroupTransactions,
} = require("../controllers/paymentController");

router.use(protect);

router.post("/order", createOrder);
router.post("/verify", verifyPayment);
router.get("/group/:groupId", getGroupTransactions);

module.exports = router;
