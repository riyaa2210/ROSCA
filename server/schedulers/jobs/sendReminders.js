"use strict";

const Group       = require("../../models/Group");
const Transaction = require("../../models/Transaction");
const Notification = require("../../models/Notification");
const { sendPaymentReminderEmail } = require("../../services/emailService");

// Batch size for email sending — avoid overwhelming SMTP server
const EMAIL_BATCH_SIZE = 20;
const EMAIL_BATCH_DELAY_MS = 1_000; // 1s between batches

/**
 * sendPaymentReminders
 *
 * For every active group, finds members with pending contributions
 * for the current month and sends email + in-app reminders.
 *
 * @param {{ log }} context
 * @returns {{ groupsProcessed, remindersSent, errors }}
 */
async function sendPaymentReminders({ log }) {
  const stats = { groupsProcessed: 0, remindersSent: 0, errors: [] };

  const groups = await Group.find({ status: "active" })
    .populate("admin", "name email")
    .lean();

  log.info(`Sending reminders for ${groups.length} active groups`);

  for (const group of groups) {
    try {
      const month = group.currentMonth;

      // Find all pending contributions for this group this month
      const pendingTxs = await Transaction.find({
        group:  group._id,
        month,
        type:   "contribution",
        status: "pending",
      }).populate("user", "name email _id");

      if (pendingTxs.length === 0) {
        log.info(`Group "${group.name}": no pending payments — skipping`);
        continue;
      }

      log.info(`Group "${group.name}": ${pendingTxs.length} pending payments`);

      // Process in batches to avoid SMTP rate limits
      for (let i = 0; i < pendingTxs.length; i += EMAIL_BATCH_SIZE) {
        const batch = pendingTxs.slice(i, i + EMAIL_BATCH_SIZE);

        await Promise.allSettled(
          batch.map(async (tx) => {
            try {
              // Email reminder
              await sendPaymentReminderEmail(tx.user, group, month);

              // In-app notification (upsert — avoid duplicate notifications)
              await Notification.findOneAndUpdate(
                {
                  user:    tx.user._id,
                  type:    "payment_reminder",
                  // Only create one reminder per user per group per month
                  message: { $regex: `Month ${month}` },
                  createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                },
                {
                  $setOnInsert: {
                    user:    tx.user._id,
                    title:   "Payment Reminder",
                    message: `Your ₹${group.monthlyAmount} contribution for "${group.name}" (Month ${month}) is pending.`,
                    type:    "payment_reminder",
                    isRead:  false,
                  },
                },
                { upsert: true }
              );

              stats.remindersSent++;
            } catch (err) {
              log.error(`Reminder failed for user ${tx.user._id}: ${err.message}`);
              stats.errors.push({ userId: tx.user._id, error: err.message });
            }
          })
        );

        // Delay between batches
        if (i + EMAIL_BATCH_SIZE < pendingTxs.length) {
          await new Promise((r) => setTimeout(r, EMAIL_BATCH_DELAY_MS));
        }
      }

      stats.groupsProcessed++;

    } catch (err) {
      stats.errors.push({ groupId: group._id, name: group.name, error: err.message });
      log.error(`Group "${group.name}" reminder job failed: ${err.message}`);
    }
  }

  return stats;
}

module.exports = sendPaymentReminders;
