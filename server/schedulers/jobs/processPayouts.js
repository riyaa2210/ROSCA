"use strict";

const Group        = require("../../models/Group");
const Transaction  = require("../../models/Transaction");
const Notification = require("../../models/Notification");
const { creditWallet, DuplicateOperationError } = require("../../services/walletService");
const { sendPayoutAnnouncementEmail } = require("../../services/emailService");

// Minimum payment rate required before auto-payout triggers (e.g. 80%)
const MIN_PAYMENT_RATE = parseFloat(process.env.CRON_MIN_PAYMENT_RATE || "0.8");

/**
 * processMonthlyPayouts
 *
 * For each active group where payout conditions are met:
 *  1. Checks that >= MIN_PAYMENT_RATE of members have paid
 *  2. Identifies the current month's payout recipient
 *  3. Creates a payout transaction
 *  4. Credits the recipient's wallet
 *  5. Advances the group to the next month (or marks completed)
 *
 * Idempotent: checks for existing payout transaction before processing.
 *
 * @param {{ log }} context
 * @returns {{ groupsProcessed, payoutsTriggered, groupsCompleted, errors }}
 */
async function processMonthlyPayouts({ log }) {
  const stats = {
    groupsProcessed: 0,
    payoutsTriggered: 0,
    groupsCompleted: 0,
    groupsSkipped: 0,
    errors: [],
  };

  const groups = await Group.find({ status: "active" })
    .populate("payoutOrder", "name email")
    .populate("members.user", "name email")
    .lean();

  log.info(`Checking payouts for ${groups.length} active groups`);

  for (const group of groups) {
    try {
      const month         = group.currentMonth;
      const activeMembers = group.members.filter((m) => m.status === "active");
      const totalMembers  = activeMembers.length;

      if (totalMembers === 0 || !month) continue;

      // ── Check: payout already processed this month ──────────────────────────
      const existingPayout = await Transaction.findOne({
        group:  group._id,
        month,
        type:   "payout",
        status: "paid",
      });

      if (existingPayout) {
        log.info(`Group "${group.name}" month ${month}: payout already done — skipping`);
        stats.groupsSkipped++;
        continue;
      }

      // ── Check: payment rate threshold ──────────────────────────────────────
      const paidCount = await Transaction.countDocuments({
        group:  group._id,
        month,
        type:   "contribution",
        status: "paid",
      });

      const paymentRate = paidCount / totalMembers;

      if (paymentRate < MIN_PAYMENT_RATE) {
        log.warn(
          `Group "${group.name}" month ${month}: payment rate ${(paymentRate * 100).toFixed(0)}% < ${MIN_PAYMENT_RATE * 100}% threshold — skipping auto-payout`
        );
        stats.groupsSkipped++;
        continue;
      }

      // ── Identify recipient ─────────────────────────────────────────────────
      const payoutIndex = month - 1;
      if (payoutIndex >= group.payoutOrder.length) {
        log.warn(`Group "${group.name}": no recipient at index ${payoutIndex}`);
        continue;
      }

      const recipient   = group.payoutOrder[payoutIndex];
      const payoutAmount = group.monthlyAmount * totalMembers;

      log.info(
        `Group "${group.name}" month ${month}: paying out ₹${payoutAmount} to ${recipient.name}`
      );

      // ── Create payout transaction ──────────────────────────────────────────
      const payoutTx = await Transaction.create({
        user:   recipient._id,
        group:  group._id,
        amount: payoutAmount,
        type:   "payout",
        month,
        status: "paid",
        paidAt: new Date(),
        notes:  `Auto-payout by cron job — Month ${month}`,
      });

      // ── Credit wallet ──────────────────────────────────────────────────────
      try {
        await creditWallet(recipient._id, payoutAmount, {
          source:         "payout",
          description:    `Auto-payout from "${group.name}" — Month ${month}`,
          referenceId:    group._id,
          referenceModel: "Group",
          idempotencyKey: `payout:${group._id}:${month}`,
        });
      } catch (walletErr) {
        if (!(walletErr instanceof DuplicateOperationError)) {
          log.error(`Wallet credit failed for ${recipient._id}: ${walletErr.message}`);
        }
      }

      // ── Advance group state ────────────────────────────────────────────────
      const isLastMonth = month >= group.duration;

      await Group.findByIdAndUpdate(group._id, {
        $set: {
          currentMonth:    isLastMonth ? month : month + 1,
          status:          isLastMonth ? "completed" : "active",
          nextPayoutDate:  isLastMonth ? null : _nextMonthDate(group.nextPayoutDate),
          [`members.$[elem].hasReceivedPayout`]: true,
        },
      }, {
        arrayFilters: [{ "elem.user": recipient._id }],
      });

      // ── Notifications ──────────────────────────────────────────────────────
      await Notification.create({
        user:    recipient._id,
        title:   "Payout Received! 🎉",
        message: `You received ₹${payoutAmount} from "${group.name}" for Month ${month}.`,
        type:    "payout_announcement",
      });

      await sendPayoutAnnouncementEmail(recipient, group, payoutAmount, month);

      stats.payoutsTriggered++;
      stats.groupsProcessed++;
      if (isLastMonth) stats.groupsCompleted++;

      log.info(`Group "${group.name}": payout ₹${payoutAmount} → ${recipient.name} ✓`);

    } catch (err) {
      stats.errors.push({ groupId: group._id, name: group.name, error: err.message });
      log.error(`Group "${group.name}" payout failed: ${err.message}`);
    }
  }

  return stats;
}

function _nextMonthDate(date) {
  if (!date) return null;
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

module.exports = processMonthlyPayouts;
