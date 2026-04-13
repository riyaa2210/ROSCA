const User = require("../models/user");
const Group = require("../models/Group");
const Transaction = require("../models/Transaction");

/**
 * GET /api/search?q=term&type=all|users|groups|transactions
 * Global search across the app
 */
exports.globalSearch = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const type = req.query.type || "all";

    if (!q || q.length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    const regex = { $regex: q, $options: "i" };
    const results = {};

    // Search users (admin only sees all; regular users only see themselves)
    if (type === "all" || type === "users") {
      const userFilter = req.user.role === "admin"
        ? { $or: [{ name: regex }, { email: regex }, { phone: regex }] }
        : { _id: req.user._id, $or: [{ name: regex }, { email: regex }] };

      results.users = await User.find(userFilter)
        .select("name email phone profilePic createdAt")
        .limit(10);
    }

    // Search groups the user belongs to
    if (type === "all" || type === "groups") {
      const groupFilter = {
        "members.user": req.user._id,
        $or: [{ name: regex }, { description: regex }],
      };
      results.groups = await Group.find(groupFilter)
        .select("name description status monthlyAmount maxMembers currentMonth duration")
        .populate("admin", "name")
        .limit(10);
    }

    // Search user's transactions
    if (type === "all" || type === "transactions") {
      results.transactions = await Transaction.find({
        user: req.user._id,
        $or: [{ status: regex }, { type: regex }, { notes: regex }],
      })
        .populate("group", "name monthlyAmount")
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
};
