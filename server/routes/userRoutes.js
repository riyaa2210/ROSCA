const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {
  updateProfile,
  uploadProfilePic,
  getTransactionHistory,
  getDashboardStats,
  getAllUsers,
} = require("../controllers/userController");

router.use(protect);

router.put("/profile", updateProfile);
router.post("/profile/picture", upload.single("profilePic"), uploadProfilePic);
router.get("/transactions", getTransactionHistory);
router.get("/dashboard", getDashboardStats);

// Admin
router.get("/all", adminOnly, getAllUsers);

module.exports = router;
