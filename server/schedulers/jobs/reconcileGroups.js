"use strict";

const Group       = require("../../models/Group");
const Transaction = require("../../models/Transaction");

/**
 * reconcileGroups
 *
 * Housekeeping job — runs weekly.
 * Checks for data inconsistencies and fixes them:
 *  1. Groups that should be "completed" but are still "active"
 *  2. Stale "processing" transactions older than 1 hour
 *  3. Groups with currentMonth > duration
 *
 * @param {{ log }} context
 * @returns {{ groupsFixed, txFixed, errors }}
 */
async function reconcileGroups({ log }) {
  const stats = { groupsFixed: 0, txFixed: 0, errors: [] };

  // ── Fix 1: Groups past their duration ──────────────────────────────────────
  const overdueGroups = await Group.find({
    status: "active",
    $expr: { $gte: ["$currentMonth", "$duration"] },
  });

  for (const group of overdueGroups) {
    try {
      await Group.findByIdAndUpdate(group._id, { $set: { status: "completed" } });
      stats.groupsFixed++;
      log.info(`Fixed overdue group: "${group.name}" → completed`);
    } catch (err) {
      stats.errors.push({ groupId: group._id, error: err.message });
    }
  }

  // ── Fix 2: Stale "processing" transactions (stuck > 1 hour) ───────────────
  const staleThreshold = new Date(Date.now() - 60 * 60 * 1000);
  const staleResult = await Transaction.updateMany(
    {
      processingStatus: "processing",
      processingLockedAt: { $lt: staleThreshold },
    },
    {
      $set: {
        processingStatus:   "idle",
        processingLockedAt: null,
      },
    }
  );

  stats.txFixed = staleResult.modifiedCount || 0;
  if (stats.txFixed > 0) {
    log.info(`Released ${stats.txFixed} stale processing locks`);
  }

  return stats;
}

module.exports = reconcileGroups;
