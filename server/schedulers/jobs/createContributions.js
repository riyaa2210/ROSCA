"use strict";

const Group       = require("../../models/Group");
const Transaction = require("../../models/Transaction");

/**
 * createMonthlyContributions
 *
 * For every active group, creates pending contribution transactions
 * for the CURRENT month if they don't already exist.
 *
 * Idempotent: uses the idempotencyKey unique index — safe to run multiple times.
 *
 * @param {{ log }} context - provided by CronJobRunner
 * @returns {{ groupsProcessed, txCreated, txSkipped, errors }}
 */
async function createMonthlyContributions({ log }) {
  const stats = { groupsProcessed: 0, txCreated: 0, txSkipped: 0, errors: [] };

  // Fetch all active groups with their members
  const groups = await Group.find({ status: "active" })
    .populate("members.user", "name email")
    .lean();

  log.info(`Found ${groups.length} active groups`);

  for (const group of groups) {
    try {
      const activeMembers = group.members.filter((m) => m.status === "active");
      const month         = group.currentMonth;

      if (!month || month < 1) {
        log.warn(`Group ${group._id} has invalid currentMonth: ${month} — skipping`);
        continue;
      }

      // Build bulk insert docs — one per active member
      const docs = activeMembers.map((m) => ({
        user:           m.user._id,
        group:          group._id,
        amount:         group.monthlyAmount,
        type:           "contribution",
        month,
        status:         "pending",
        idempotencyKey: Transaction.buildIdempotencyKey(m.user._id, group._id, month),
      }));

      // insertMany with ordered:false — continues on duplicate key errors
      // Each duplicate = transaction already exists → skip silently
      const result = await Transaction.insertMany(docs, {
        ordered:                false,
        rawResult:              true,
        // Don't throw on duplicate key (E11000) — just skip those docs
      }).catch((err) => {
        if (err.code === 11000 || err.name === "BulkWriteError") {
          return err.result; // partial success — some inserted, some skipped
        }
        throw err;
      });

      const inserted = result?.nInserted ?? result?.insertedCount ?? 0;
      const skipped  = docs.length - inserted;

      stats.txCreated  += inserted;
      stats.txSkipped  += skipped;
      stats.groupsProcessed++;

      log.info(`Group "${group.name}" (${group._id}): ${inserted} created, ${skipped} skipped`);

    } catch (err) {
      stats.errors.push({ groupId: group._id, name: group.name, error: err.message });
      log.error(`Group "${group.name}" failed: ${err.message}`);
      // Continue with next group — don't abort the whole job
    }
  }

  return stats;
}

module.exports = createMonthlyContributions;
