const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/authMiddleware");
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

router.get("/me", protect, getMe);
router.post("/forgot-password", body("email").isEmail(), validate, forgotPassword);
router.post("/reset-password/:token", body("password").isLength({ min: 6 }), validate, resetPassword);

module.exports = router;
