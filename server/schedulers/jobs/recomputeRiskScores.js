"use strict";

const RiskScore = require("../../models/RiskScore");
const User      = require("../../models/user");
const { computeAndSaveRiskScore } = require("../../services/riskScoringService");

const BATCH_SIZE = 50; // process 50 users at a time

/**
 * recomputeRiskScores
 *
 * Weekly job — recomputes risk scores for:
 *  1. All users with isStale = true
 *  2. Users whose score is older than 7 days
 *  3. New users with no score yet
 *
 * Processes in batches to avoid memory pressure on large datasets.
 */
async function recomputeRiskScores({ log }) {
  const stats = { processed: 0, created: 0, updated: 0, errors: [] };

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Find users needing recompute
  const staleScores = await RiskScore.find({
    $or: [
      { isStale: true },
      { computedAt: { $lt: sevenDaysAgo } },
    ],
  }).select("user").lean();

  // Find users with no score at all
  const scoredUserIds = await RiskScore.distinct("user");
  const allUsers      = await User.find({
    _id: { $nin: scoredUserIds },
  }).select("_id").lean();

  const userIds = [
    ...staleScores.map((s) => s.user),
    ...allUsers.map((u) => u._id),
  ];

  log.info(`Recomputing risk scores for ${userIds.length} users`);

  // Process in batches
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (userId) => {
        try {
          const isNew = allUsers.some((u) => u._id.toString() === userId.toString());
          await computeAndSaveRiskScore(userId);
          isNew ? stats.created++ : stats.updated++;
          stats.processed++;
        } catch (err) {
          stats.errors.push({ userId, error: err.message });
          log.error(`Failed for user ${userId}: ${err.message}`);
        }
      })
    );

    log.info(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: processed ${Math.min(i + BATCH_SIZE, userIds.length)}/${userIds.length}`);
  }

  return stats;
}

module.exports = recomputeRiskScores;
