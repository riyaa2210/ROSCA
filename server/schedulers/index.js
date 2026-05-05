"use strict";

const cron = require("node-cron");
const CronJobRunner        = require("./cronJobRunner");
const createContributions  = require("./jobs/createContributions");
const sendReminders        = require("./jobs/sendReminders");
const processPayouts       = require("./jobs/processPayouts");
const reconcileGroups      = require("./jobs/reconcileGroups");
const recomputeRiskScores  = require("./jobs/recomputeRiskScores");

/**
 * Cron Schedule Reference:
 *  ┌─────────── second (optional)
 *  │ ┌───────── minute
 *  │ │ ┌─────── hour
 *  │ │ │ ┌───── day of month
 *  │ │ │ │ ┌─── month
 *  │ │ │ │ │ ┌─ day of week (0=Sun)
 *  │ │ │ │ │ │
 *  * * * * * *
 */

const SCHEDULES = {
  // 1st of every month at 00:05 — create contribution records
  MONTHLY_CONTRIBUTIONS: "5 0 1 * *",

  // 5th of every month at 09:00 — send payment reminders
  PAYMENT_REMINDERS: "0 9 5 * *",

  // 10th of every month at 10:00 — process payouts (after most members have paid)
  MONTHLY_PAYOUTS: "0 10 10 * *",

  // Every Sunday at 02:00 — reconcile/housekeeping
  WEEKLY_RECONCILE: "0 2 * * 0",
};

// Override schedules via env for testing (e.g. CRON_CONTRIBUTIONS="*/5 * * * *")
const getSchedule = (key, envKey) =>
  process.env[envKey] || SCHEDULES[key];

/**
 * initSchedulers()
 * Call this once from server.js after DB connects.
 */
function initSchedulers() {
  if (process.env.DISABLE_CRON === "true") {
    console.log("[CRON] Schedulers disabled via DISABLE_CRON=true");
    return;
  }

  const timezone = process.env.CRON_TIMEZONE || "Asia/Kolkata";
  console.log(`[CRON] Initialising schedulers (timezone: ${timezone})`);

  // ── Job 1: Create monthly contribution records ────────────────────────────
  cron.schedule(
    getSchedule("MONTHLY_CONTRIBUTIONS", "CRON_CONTRIBUTIONS"),
    async () => {
      await CronJobRunner.run(
        "monthly-contributions",
        createContributions,
        { maxRetries: 2, retryDelayMs: 10_000 }
      );
    },
    { timezone }
  );

  // ── Job 2: Send payment reminders ─────────────────────────────────────────
  cron.schedule(
    getSchedule("PAYMENT_REMINDERS", "CRON_REMINDERS"),
    async () => {
      await CronJobRunner.run(
        "payment-reminders",
        sendReminders,
        { maxRetries: 3, retryDelayMs: 5_000 }
      );
    },
    { timezone }
  );

  // ── Job 3: Process monthly payouts ────────────────────────────────────────
  cron.schedule(
    getSchedule("MONTHLY_PAYOUTS", "CRON_PAYOUTS"),
    async () => {
      await CronJobRunner.run(
        "monthly-payouts",
        processPayouts,
        { maxRetries: 1, retryDelayMs: 30_000 }
      );
    },
    { timezone }
  );

  // ── Job 4: Weekly reconciliation ──────────────────────────────────────────
  cron.schedule(
    getSchedule("WEEKLY_RECONCILE", "CRON_RECONCILE"),
    async () => {
      await CronJobRunner.run(
        "weekly-reconcile",
        reconcileGroups,
        { maxRetries: 1, retryDelayMs: 5_000 }
      );
    },
    { timezone }
  );

  // ── Job 5: Weekly risk score recompute ────────────────────────────────────
  cron.schedule(
    process.env.CRON_RISK_SCORES || "0 3 * * 1", // Monday 03:00
    async () => {
      await CronJobRunner.run(
        "recompute-risk-scores",
        recomputeRiskScores,
        { maxRetries: 1, retryDelayMs: 10_000 }
      );
    },
    { timezone }
  );

  console.log("[CRON] All schedulers registered:");
  console.log(`  monthly-contributions → ${getSchedule("MONTHLY_CONTRIBUTIONS", "CRON_CONTRIBUTIONS")}`);
  console.log(`  payment-reminders     → ${getSchedule("PAYMENT_REMINDERS", "CRON_REMINDERS")}`);
  console.log(`  monthly-payouts       → ${getSchedule("MONTHLY_PAYOUTS", "CRON_PAYOUTS")}`);
  console.log(`  weekly-reconcile      → ${getSchedule("WEEKLY_RECONCILE", "CRON_RECONCILE")}`);
}

module.exports = { initSchedulers };
