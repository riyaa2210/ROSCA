const User = require("../models/user");
const Transaction = require("../models/Transaction");
const { deleteLocalFile } = require("../services/s3Service");

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, preferredLanguage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, preferredLanguage },
      { new: true, runValidators: true }
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.uploadProfilePic = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user._id);

    // Delete old profile pic if it exists
    if (user.profilePic) deleteLocalFile(user.profilePic);

    const url = `/uploads/${req.file.filename}`;
    user.profilePic = url;
    await user.save();

    res.json({ profilePic: url });
  } catch (err) {
    next(err);
  }
};

exports.getTransactionHistory = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .populate("group", "name monthlyAmount")
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [totalContributed, totalReceived, pendingPayments] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, type: "contribution", status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: "payout", status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.countDocuments({ user: userId, type: "contribution", status: "pending" }),
    ]);

    res.json({
      totalContributed: totalContributed[0]?.total || 0,
      totalReceived: totalReceived[0]?.total || 0,
      pendingPayments,
    });
  } catch (err) {
    next(err);
  }
};

// Admin only
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};
