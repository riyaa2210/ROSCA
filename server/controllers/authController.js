const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { sendWelcomeEmail, sendPasswordResetEmail } = require("../services/emailService");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const user = await User.create({ name, email, password, phone });
    sendWelcomeEmail(user);

    res.status(201).json({ token: generateToken(user._id), user });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ token: generateToken(user._id), user });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No user with that email" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    sendPasswordResetEmail(user, resetUrl);

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Token invalid or expired" });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ token: generateToken(user._id), user });
  } catch (err) {
    next(err);
  }
};
