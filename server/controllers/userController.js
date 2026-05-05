"use strict";

const User        = require("../models/user");
const Transaction = require("../models/Transaction");
const { uploadToS3, deleteFile, getPresignedUrl, isS3Url } = require("../services/s3Service");

// ── PUT /api/users/profile ────────────────────────────────────────────────────
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

// ── POST /api/users/profile/picture ──────────────────────────────────────────
exports.uploadProfilePic = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ── Step 1: Upload new image ──────────────────────────────────────────────
    const newUrl = await uploadToS3(req.file, "profiles");

    // ── Step 2: Delete old image (after new one is safely uploaded) ───────────
    // Do this AFTER the new upload succeeds — never delete before confirming upload
    if (user.profilePic) {
      await deleteFile(user.profilePic);
    }

    // ── Step 3: Store URL in MongoDB ──────────────────────────────────────────
    // We store the S3 URL (or local path) — NOT the presigned URL
    // Presigned URLs expire; the stored URL is permanent
    user.profilePic = newUrl;
    await user.save();

    // ── Step 4: Return response ───────────────────────────────────────────────
    // If using private S3 bucket, return a presigned URL for immediate display
    // If using public bucket or local storage, return the URL directly
    const displayUrl = isS3Url(newUrl)
      ? await getPresignedUrl(newUrl, 3600) // 1-hour presigned URL
      : newUrl;

    res.json({
      message:    "Profile picture updated",
      profilePic: newUrl,      // permanent URL stored in DB
      displayUrl,              // URL to use in <img src="...">
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/transactions ───────────────────────────────────────────────
exports.getTransactionHistory = async (req, res, next) => {
  try {
    const { parseQuery, buildSort, buildDateFilter, paginate } = require("../utils/queryBuilder");
    const { status, type, dateFrom, dateTo, sortBy, order, page, limit } = parseQuery(req.query);

    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (type)   filter.type   = type;

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

// ── GET /api/users/dashboard ──────────────────────────────────────────────────
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
      totalReceived:    totalReceived[0]?.total    || 0,
      pendingPayments,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/all (admin) ────────────────────────────────────────────────
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
