"use strict";

const express = require("express");
const router  = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const CronJobRunner       = require("../schedulers/cronJobRunner");
const createContributions = require("../schedulers/jobs/createContributions");
const sendReminders       = require("../schedulers/jobs/sendReminders");
const processPayouts      = require("../schedulers/jobs/processPayouts");
const reconcileGroups     = require("../schedulers/jobs/reconcileGroups");
const CronLock            = require("../models/CronLock");

router.use(protect, adminOnly);

/**
 * POST /api/cron/run/:jobName
 * Manually trigger a cron job (admin only).
 * Useful for testing and one-off runs.
 */
const JOB_MAP = {
  "monthly-contributions": createContributions,
  "payment-reminders":     sendReminders,
  "monthly-payouts":       processPayouts,
  "weekly-reconcile":      reconcileGroups,
};

router.post("/run/:jobName", async (req, res, next) => {
  try {
    const { jobName } = req.params;
    const fn = JOB_MAP[jobName];

    if (!fn) {
      return res.status(404).json({
        message: `Unknown job: ${jobName}`,
        available: Object.keys(JOB_MAP),
      });
    }

    // Run async — don't wait for completion (jobs can take minutes)
    const runPromise = CronJobRunner.run(jobName, fn, { maxRetries: 0 });

    // Return immediately with 202 Accepted
    res.status(202).json({
      message:  `Job "${jobName}" triggered`,
      note:     "Check server logs for progress",
    });

    // Log result when done
    runPromise.then((result) => {
      console.log(`[CRON:manual] ${jobName} result:`, JSON.stringify(result));
    }).catch((err) => {
      console.error(`[CRON:manual] ${jobName} error:`, err.message);
    });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cron/status
 * Returns the current lock status of all jobs.
 */
router.get("/status", async (req, res, next) => {
  try {
    const locks = await CronLock.find().sort({ startedAt: -1 }).lean();
    res.json(locks);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
