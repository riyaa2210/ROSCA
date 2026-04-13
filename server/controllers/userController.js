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
    const { parseQuery, buildSort, buildDateFilter, paginate } = require("../utils/queryBuilder");
    const { status, type, dateFrom, dateTo, sortBy, order, page, limit } = parseQuery(req.query);

    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (type)   filter.type = type;

    const dateFilter = buildDateFilter("createdAt", dateFrom, dateTo);
    Object.assign(filter, dateFilter);

    const sort = buildSort(sortBy, order);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("group", "name monthlyAmount")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({ transactions, ...paginate(total, page, limit) });
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

// Admin only — search + filter users
exports.getAllUsers = async (req, res, next) => {
  try {
    const { parseQuery, buildSort, paginate } = require("../utils/queryBuilder");
    const { search, sortBy, order, page, limit } = parseQuery(req.query);

    const filter = {};
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const sort = buildSort(sortBy, order);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ users, ...paginate(total, page, limit) });
  } catch (err) {
    next(err);
  }
};
