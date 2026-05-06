"use strict";

const mongoose  = require("mongoose");
const Transaction = require("../models/Transaction");
const Group       = require("../models/Group");
const RiskScore   = require("../models/RiskScore");

// ── Scoring constants ─────────────────────────────────────────────────────────

const GRACE_PERIOD_DAYS = 5; // payments within 5 days of due date = "on time"

/**
 * Scoring formula (0–100):
 *
 *  Component         Weight   Max pts   Description
 *  ─────────────────────────────────────────────────────────────────────────
 *  On-time rate       40%      40       % of payments made on time
 *  Late penalty       30%      30       deducted based on late payment rate
 *  Streak bonus       20%      20       current consecutive on-time payments
 *  Volume bonus       10%      10       total payments made (activity level)
 *
 *  Final = onTimeScore + (30 - lateScore) + streakScore + volumeScore
 *
 * Why this formula?
 *  - On-time rate is the strongest signal (40%) — most predictive of future behaviour
 *  - Late penalty is separate from on-time (a user can be 80% on-time but 20% very late)
 *  - Streak rewards recent consistent behaviour (recency bias — common in credit scoring)
 *  - Volume rewards active users (more data = more confidence in the score)
 */

const WEIGHTS = {
  ON_TIME_MAX:  40,
  LATE_MAX:     30, // this is a PENALTY — higher late rate = lower score
  STREAK_MAX:   20,
  VOLUME_MAX:   10,
};

const STREAK_THRESHOLDS = [
  { min: 12, pts: 20 },
  { min: 6,  pts: 15 },
  { min: 3,  pts: 10 },
  { min: 1,  pts: 5  },
  { min: 0,  pts: 0  },
];

const VOLUME_THRESHOLDS = [
  { min: 24, pts: 10 },
  { min: 12, pts: 8  },
  { min: 6,  pts: 6  },
  { min: 3,  pts: 4  },
  { min: 1,  pts: 2  },
  { min: 0,  pts: 0  },
];

// ── Core aggregation pipeline ─────────────────────────────────────────────────

/**
 * aggregatePaymentBehaviour(userId)
 *
 * Single MongoDB aggregation that computes all raw factors needed for scoring.
 * Runs in O(n) where n = user's contribution transactions.
 *
 * Returns:
 *  {
 *    totalContributions, onTimePayments, latePayments,
 *    missedPayments, avgDaysLate, totalAmountPaid,
 *    recentPayments: [{ status, daysLate }]  ← for streak calculation
 *  }
 */
async function aggregatePaymentBehaviour(userId) {
  const uid = new mongoose.Types.ObjectId(userId);

  const result = await Transaction.aggregate([
    // ── Stage 1: Filter to this user's contributions only ─────────────────────
    {
      $match: {
        user: uid,
        type: "contribution",
        // Only consider transactions that have a definitive outcome
        status: { $in: ["paid", "failed", "pending"] },
      },
    },

    // ── Stage 2: Join with Group to get startDate (for due date calculation) ──
    {
      $lookup: {
        from:         "groups",
        localField:   "group",
        foreignField: "_id",
        as:           "groupData",
        pipeline: [
          { $project: { startDate: 1, monthlyAmount: 1, duration: 1 } },
        ],
      },
    },
    { $unwind: { path: "$groupData", preserveNullAndEmpty: false } },

    // ── Stage 3: Compute due date and days late for each transaction ───────────
    {
      $addFields: {
        // Due date = group start date + (month - 1) months in milliseconds
        // Using $add with ms calculation (compatible with all MongoDB versions)
        dueDate: {
          $add: [
            "$groupData.startDate",
            {
              $multiply: [
                { $subtract: ["$month", 1] },
                30 * 24 * 60 * 60 * 1000, // approximate: 30 days per month in ms
              ],
            },
          ],
        },
      },
    },
    {
      $addFields: {
        // Days between due date and actual payment date
        daysLate: {
          $cond: {
            if:   { $and: [{ $eq: ["$status", "paid"] }, { $ne: ["$paidAt", null] }] },
            then: {
              $max: [
                0,
                {
                  $divide: [
                    { $subtract: ["$paidAt", "$dueDate"] },
                    1000 * 60 * 60 * 24, // ms → days
                  ],
                },
              ],
            },
            else: null,
          },
        },
        // Classify payment timing
        paymentTiming: {
          $switch: {
            branches: [
              // Paid on time (within grace period)
              {
                case: {
                  $and: [
                    { $eq: ["$status", "paid"] },
                    { $ne: ["$paidAt", null] },
                    {
                      $lte: [
                        { $subtract: ["$paidAt", "$dueDate"] },
                        GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
                      ],
                    },
                  ],
                },
                then: "on_time",
              },
              // Paid late (after grace period)
              {
                case: { $eq: ["$status", "paid"] },
                then: "late",
              },
              // Failed
              {
                case: { $eq: ["$status", "failed"] },
                then: "missed",
              },
              // Still pending (overdue)
              {
                case: {
                  $and: [
                    { $eq: ["$status", "pending"] },
                    { $lt: ["$dueDate", new Date()] },
                  ],
                },
                then: "missed",
              },
            ],
            default: "pending", // not yet due
          },
        },
      },
    },

    // ── Stage 4: Aggregate counts and amounts ─────────────────────────────────
    {
      $group: {
        _id: null,
        totalContributions: { $sum: 1 },
        onTimePayments: {
          $sum: { $cond: [{ $eq: ["$paymentTiming", "on_time"] }, 1, 0] },
        },
        latePayments: {
          $sum: { $cond: [{ $eq: ["$paymentTiming", "late"] }, 1, 0] },
        },
        missedPayments: {
          $sum: { $cond: [{ $eq: ["$paymentTiming", "missed"] }, 1, 0] },
        },
        avgDaysLate: {
          $avg: {
            $cond: [
              { $eq: ["$paymentTiming", "late"] },
              "$daysLate",
              null,
            ],
          },
        },
        totalAmountPaid: {
          $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] },
        },
        // Keep recent 24 payments for streak calculation (sorted by createdAt desc)
        recentPayments: {
          $push: {
            timing:    "$paymentTiming",
            createdAt: "$createdAt",
            month:     "$month",
          },
        },
      },
    },

    // ── Stage 5: Sort recent payments by date desc (for streak) ───────────────
    {
      $addFields: {
        recentPayments: {
          $slice: [
            // Sort by createdAt descending using $reduce (compatible with MongoDB 4.4+)
            {
              $reduce: {
                input: {
                  $map: {
                    input: { $range: [0, { $size: "$recentPayments" }] },
                    as: "i",
                    in: { $arrayElemAt: ["$recentPayments", "$$i"] },
                  },
                },
                initialValue: [],
                in: {
                  $let: {
                    vars: { item: "$$this", acc: "$$value" },
                    in: {
                      $concatArrays: [
                        {
                          $filter: {
                            input: "$$acc",
                            as: "a",
                            cond: { $gte: ["$$a.createdAt", "$$item.createdAt"] },
                          },
                        },
                        ["$$item"],
                        {
                          $filter: {
                            input: "$$acc",
                            as: "a",
                            cond: { $lt: ["$$a.createdAt", "$$item.createdAt"] },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
            24,
          ],
        },
      },
    },
  ]);

  return result[0] || {
    totalContributions: 0,
    onTimePayments:     0,
    latePayments:       0,
    missedPayments:     0,
    avgDaysLate:        0,
    totalAmountPaid:    0,
    recentPayments:     [],
  };
}

// ── Streak calculation ────────────────────────────────────────────────────────

/**
 * calculateStreak(recentPayments)
 *
 * Counts consecutive on-time payments from most recent backwards.
 * Stops at the first non-on-time payment.
 *
 * @param {Array} recentPayments - sorted desc by date
 * @returns {{ current, longest }}
 */
function calculateStreak(recentPayments) {
  let current = 0;
  let longest = 0;
  let runningStreak = 0;

  for (const p of recentPayments) {
    if (p.timing === "on_time") {
      runningStreak++;
      longest = Math.max(longest, runningStreak);
      if (current === runningStreak - 1 || current === 0) {
        current = runningStreak;
      }
    } else if (p.timing === "late" || p.timing === "missed") {
      // Streak broken — stop counting current streak
      if (current === runningStreak) current = 0;
      runningStreak = 0;
    }
    // "pending" = not yet due, skip
  }

  return { current, longest };
}

// ── Scoring formula ───────────────────────────────────────────────────────────

/**
 * computeScore(factors)
 *
 * Pure function — takes raw factors, returns score + breakdown.
 * No DB calls — easy to unit test.
 *
 * @param {object} factors
 * @returns {{ score, category, breakdown }}
 */
function computeScore(factors) {
  const {
    totalContributions,
    onTimePayments,
    latePayments,
    missedPayments,
    currentStreak,
    avgDaysLate = 0,
  } = factors;

  // New user with no history → neutral score
  if (totalContributions === 0) {
    return {
      score:    50,
      category: "MEDIUM",
      breakdown: { onTimeScore: 20, lateScore: 15, streakScore: 10, volumeScore: 5 },
    };
  }

  const decisivePayments = onTimePayments + latePayments + missedPayments;

  // ── Component 1: On-time rate (0–40 pts) ─────────────────────────────────
  const onTimeRate  = decisivePayments > 0 ? onTimePayments / decisivePayments : 0;
  const onTimeScore = Math.round(onTimeRate * WEIGHTS.ON_TIME_MAX);

  // ── Component 2: Late penalty (0–30 pts deducted) ────────────────────────
  // Two sub-factors: frequency of late payments + how late they were
  const lateRate    = decisivePayments > 0 ? latePayments / decisivePayments : 0;
  const missedRate  = decisivePayments > 0 ? missedPayments / decisivePayments : 0;

  // Missed payments are penalised more heavily than late ones
  const rawLatePenalty = (lateRate * 0.4 + missedRate * 0.6) * WEIGHTS.LATE_MAX;

  // Extra penalty for being very late (avg > 10 days)
  const lateDaysPenalty = avgDaysLate > 10 ? Math.min(5, (avgDaysLate - 10) / 5) : 0;

  const lateScore = Math.min(WEIGHTS.LATE_MAX, Math.round(rawLatePenalty + lateDaysPenalty));

  // ── Component 3: Streak bonus (0–20 pts) ─────────────────────────────────
  const streakScore = STREAK_THRESHOLDS.find((t) => currentStreak >= t.min)?.pts ?? 0;

  // ── Component 4: Volume bonus (0–10 pts) ─────────────────────────────────
  const volumeScore = VOLUME_THRESHOLDS.find((t) => totalContributions >= t.min)?.pts ?? 0;

  // ── Final score ───────────────────────────────────────────────────────────
  // onTimeScore adds points, lateScore subtracts, streak + volume add
  const raw   = onTimeScore + (WEIGHTS.LATE_MAX - lateScore) + streakScore + volumeScore;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    score,
    category:  RiskScore.getCategory(score),
    breakdown: { onTimeScore, lateScore, streakScore, volumeScore },
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * computeAndSaveRiskScore(userId)
 *
 * Full pipeline: aggregate → compute → upsert into RiskScore collection.
 * Called after every payment event and by the weekly cron job.
 *
 * @param {ObjectId|string} userId
 * @returns {RiskScore} the saved document
 */
async function computeAndSaveRiskScore(userId) {
  // Step 1: Run aggregation
  const raw = await aggregatePaymentBehaviour(userId);

  // Step 2: Calculate streak from recent payments
  const { current: currentStreak, longest: longestStreak } =
    calculateStreak(raw.recentPayments || []);

  // Step 3: Build factors object
  const factors = {
    totalContributions: raw.totalContributions,
    onTimePayments:     raw.onTimePayments,
    latePayments:       raw.latePayments,
    missedPayments:     raw.missedPayments,
    currentStreak,
    longestStreak,
    avgDaysLate:        Math.round((raw.avgDaysLate || 0) * 10) / 10,
    totalAmountPaid:    raw.totalAmountPaid,
  };

  // Step 4: Compute score
  const { score, category, breakdown } = computeScore(factors);

  // Step 5: Upsert into RiskScore collection
  const riskScore = await RiskScore.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        score,
        category,
        factors,
        breakdown,
        computedAt: new Date(),
        isStale:    false,
      },
      $inc: { version: 1 },
    },
    { upsert: true, new: true }
  );

  return riskScore;
}

/**
 * getRiskScore(userId)
 *
 * Returns the cached risk score. If stale or missing, recomputes first.
 *
 * @param {ObjectId|string} userId
 * @param {boolean} forceRecompute - skip cache and recompute
 */
async function getRiskScore(userId, forceRecompute = false) {
  if (!forceRecompute) {
    const cached = await RiskScore.findOne({ user: userId });
    if (cached && !cached.isStale) return cached;
  }
  return computeAndSaveRiskScore(userId);
}

/**
 * markScoreStale(userId)
 *
 * Called after a payment event to flag the score for recomputation.
 * The actual recompute happens lazily on next read, or eagerly via cron.
 */
async function markScoreStale(userId) {
  await RiskScore.findOneAndUpdate(
    { user: userId },
    { $set: { isStale: true } },
    { upsert: false }
  );
}

/**
 * getBulkRiskScores(userIds)
 *
 * Efficient bulk fetch for admin panel / group views.
 * Returns a Map<userId, RiskScore>.
 */
async function getBulkRiskScores(userIds) {
  const scores = await RiskScore.find({
    user: { $in: userIds },
  }).lean();

  return new Map(scores.map((s) => [s.user.toString(), s]));
}

/**
 * getGroupRiskSummary(groupId)
 *
 * Returns risk distribution for all members of a group.
 * Useful for admin to assess group health.
 */
async function getGroupRiskSummary(groupId) {
  const Group = require("../models/Group");
  const group = await Group.findById(groupId).select("members").lean();
  if (!group) return null;

  const memberIds = group.members
    .filter((m) => m.status === "active")
    .map((m) => m.user);

  const scores = await RiskScore.aggregate([
    { $match: { user: { $in: memberIds } } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        avgScore: { $avg: "$score" },
      },
    },
  ]);

  const summary = { LOW: 0, MEDIUM: 0, HIGH: 0, avgScore: 0, totalMembers: memberIds.length };
  let totalScore = 0;
  let scoredCount = 0;

  for (const s of scores) {
    summary[s._id] = s.count;
    totalScore += s.avgScore * s.count;
    scoredCount += s.count;
  }

  summary.avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 50;
  return summary;
}

module.exports = {
  computeAndSaveRiskScore,
  getRiskScore,
  markScoreStale,
  getBulkRiskScores,
  getGroupRiskSummary,
  computeScore,           // exported for unit testing
  aggregatePaymentBehaviour, // exported for debugging
};
