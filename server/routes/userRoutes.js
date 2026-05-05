const express = require("express");
const router  = express.Router();
const { protect, adminOnly }    = require("../middleware/authMiddleware");
const { uploadSingle }          = require("../middleware/upload");
const {
  updateProfile,
  uploadProfilePic,
  getTransactionHistory,
  getDashboardStats,
  getAllUsers,
} = require("../controllers/userController");

router.use(protect);

router.put("/profile",         updateProfile);
router.post("/profile/picture",
  uploadSingle("profilePic"),  // handles multer errors gracefully
  uploadProfilePic
);
router.get("/transactions",    getTransactionHistory);
router.get("/dashboard",       getDashboardStats);

// Admin
router.get("/all", adminOnly,  getAllUsers);

module.exports = router;
