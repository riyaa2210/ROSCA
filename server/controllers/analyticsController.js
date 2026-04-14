const Transaction = require("../models/Transaction");
const Group = require("../models/Group");

// ── Helper: start of N months ago ────────────────────────────────────────────
const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ── Helper: short month label e.g. "Jan 25" ──────────────────────────────────
const monthLabel = (year, month) =>
  new Date(year, month - 1).toLocaleString("en-IN", { month: "short", year: "2-digit" });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/overview
// ─────────────────────────────────────────────────────────────────────────────
exports.getOverview = async (req, res, next) => {
  try {
    const uid = req.user._id;

    const [contributed, received, pending, failed, groups] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: uid, type: "contribution", status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { user: uid, type: "payout", status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Transaction.countDocuments({ user: uid, type: "contribution", status: "pending" }),
      Transaction.countDocuments({ user: uid, status: "failed" }),
      Group.find({ "members.user": uid }).select("status monthlyAmount"),
    ]);

    const totalContributed  = contributed[0]?.total || 0;
    const totalReceived     = received[0]?.total    || 0;
    const monthlyCommitment = groups
      .filter((g) => g.status === "active")
      .reduce((s, g) => s + g.monthlyAmount, 0);

    res.json({
      totalContributed,
      totalReceived,
      netSavings:         totalReceived - totalContributed,
      pendingPayments:    pending,
      failedPayments:     failed,
      activeGroups:       groups.filter((g) => g.status === "active").length,
      completedGroups:    groups.filter((g) => g.status === "completed").length,
      totalGroups:        groups.length,
      monthlyCommitment,
      contributionCount:  contributed[0]?.count || 0,
      payoutCount:        received[0]?.count    || 0,
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/trends?months=6
// Monthly contribution & payout amounts — fills missing months with 0
// ─────────────────────────────────────────────────────────────────────────────
exports.getTrends = async (req, res, next) => {
  try {
    const uid    = req.user._id;
    const months = Math.min(24, Math.max(3, parseInt(req.query.months) || 6));
    const since  = monthsAgo(months);

    const raw = await Transaction.aggregate([
      { $match: { user: uid, status: "paid", createdAt: { $gte: since } } },
      {
        $group: {
          _id:   { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Build lookup map
    const map = {};
    raw.forEach(({ _id, total, count }) => {
      const key = `${_id.year}-${String(_id.month).padStart(2, "0")}`;
      if (!map[key]) map[key] = { label: monthLabel(_id.year, _id.month), contribution: 0, payout: 0, contributionCount: 0, payoutCount: 0 };
      if (_id.type === "contribution") { map[key].contribution = total; map[key].contributionCount = count; }
      else                             { map[key].payout = total;       map[key].payoutCount = count; }
    });

    // Fill every month in range (continuous x-axis)
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d   = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      result.push(map[key] || {
        label: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
        contribution: 0, payout: 0, contributionCount: 0, payoutCount: 0,
      });
    }

    res.json(result);
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/payment-behaviour
// On-time rate, late probability, streak, pie breakdown
// ─────────────────────────────────────────────────────────────────────────────
exports.getPaymentBehaviour = async (req, res, next) => {
  try {
    const uid = req.user._id;
    const txs = await Transaction.find({ user: uid, type: "contribution" })
      .populate("group", "startDate monthlyAmount");

    let onTime = 0, late = 0, pending = 0, failed = 0;

    txs.forEach((tx) => {
      if (tx.status === "pending") { pending++; return; }
      if (tx.status === "failed")  { failed++;  return; }
      if (tx.paidAt && tx.group?.startDate) {
        const due = new Date(tx.group.startDate);
        due.setMonth(due.getMonth() + tx.month - 1);
        due.setDate(due.getDate() + 5); // 5-day grace period
        tx.paidAt <= due ? onTime++ : late++;
      } else {
        onTime++;
      }
    });

    const total           = onTime + late;
    const lateProbability = total > 0 ? Math.round((late  / total) * 100) : 0;
    const onTimeRate      = total > 0 ? Math.round((onTime / total) * 100) : 100;

    // Consecutive on-time streak (most recent first)
    const sorted = txs.filter((t) => t.status === "paid").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    let streak = 0;
    for (const tx of sorted) { if (tx.status === "paid") streak++; else break; }

    res.json({
      onTime, late, pending, failed,
      total: txs.length,
      lateProbability, onTimeRate, streak,
      pieData: [
        { name: "On Time", value: onTime,  fill: "#10b981" },
        { name: "Late",    value: late,    fill: "#f59e0b" },
        { name: "Pending", value: pending, fill: "#6366f1" },
        { name: "Failed",  value: failed,  fill: "#ef4444" },
      ].filter((d) => d.value > 0),
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/group-breakdown
// Per-group contribution vs payout summary
// ─────────────────────────────────────────────────────────────────────────────
exports.getGroupBreakdown = async (req, res, next) => {
  try {
    const uid = req.user._id;

    const raw = await Transaction.aggregate([
      { $match: { user: uid, status: "paid" } },
      { $group: { _id: { group: "$group", type: "$type" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $lookup: { from: "groups", localField: "_id.group", foreignField: "_id", as: "g" } },
      { $unwind: "$g" },
      { $project: { groupId: "$_id.group", groupName: "$g.name", status: "$g.status", type: "$_id.type", total: 1, count: 1 } },
    ]);

    const map = {};
    raw.forEach(({ groupId, groupName, status, type, total, count }) => {
      const k = groupId.toString();
      if (!map[k]) map[k] = { groupId: k, groupName, status, contributed: 0, received: 0, txCount: 0 };
      if (type === "contribution") { map[k].contributed = total; map[k].txCount += count; }
      else                         { map[k].received    = total; }
    });

    res.json(Object.values(map).sort((a, b) => b.contributed - a.contributed));
  } catch (err) { next(err); }
};
