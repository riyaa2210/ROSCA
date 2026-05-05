"use strict";

const { v4: uuidv4 } = require("uuid");
const CronLock = require("../models/CronLock");

/**
 * CronJobRunner
 *
 * Base utility that wraps any job function with:
 *  - Distributed lock (prevents duplicate execution)
 *  - Structured logging
 *  - Retry with exponential back-off
 *  - Error capture + lock release on failure
 *
 * Usage:
 *   await CronJobRunner.run("monthly-contributions", myJobFn, { maxRetries: 2 });
 */
class CronJobRunner {
  /**
   * run(jobName, fn, options)
   *
   * @param {string}   jobName    - unique identifier for this job
   * @param {Function} fn         - async job function, receives { runId, log }
   * @param {object}   options
   * @param {number}   options.maxRetries   - retry attempts on failure (default 2)
   * @param {number}   options.retryDelayMs - base delay between retries (default 5000)
   */
  static async run(jobName, fn, { maxRetries = 2, retryDelayMs = 5_000 } = {}) {
    const runId = uuidv4();
    const log   = CronJobRunner._makeLogger(jobName, runId);

    log.info("Job triggered");

    // ── Acquire distributed lock ──────────────────────────────────────────────
    const acquired = await CronJobRunner._acquireLock(jobName, runId);
    if (!acquired) {
      log.warn("Skipped — another instance is already running this job");
      return { skipped: true, reason: "lock_held" };
    }

    log.info("Lock acquired");

    let attempt = 0;
    let lastError;

    while (attempt <= maxRetries) {
      try {
        if (attempt > 0) {
          const delay = retryDelayMs * Math.pow(2, attempt - 1); // exponential back-off
          log.info(`Retry ${attempt}/${maxRetries} — waiting ${delay}ms`);
          await new Promise((r) => setTimeout(r, delay));
        }

        const result = await fn({ runId, log });

        await CronJobRunner._releaseLock(jobName, "completed");
        log.info("Job completed successfully", result);
        return { success: true, runId, result };

      } catch (err) {
        lastError = err;
        log.error(`Attempt ${attempt + 1} failed: ${err.message}`, err.stack);
        attempt++;
      }
    }

    // All retries exhausted
    await CronJobRunner._releaseLock(jobName, "failed", lastError.message);
    log.error(`Job failed after ${maxRetries + 1} attempts`);
    return { success: false, runId, error: lastError.message };
  }

  // ── Lock helpers ────────────────────────────────────────────────────────────

  static async _acquireLock(jobName, runId) {
    try {
      // Atomic upsert: only succeeds if no "running" lock exists
      const result = await CronLock.findOneAndUpdate(
        {
          jobName,
          $or: [
            { status: { $ne: "running" } },
            // Stale lock: started more than 2 hours ago
            { status: "running", startedAt: { $lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
          ],
        },
        {
          $set: {
            jobName,
            status:    "running",
            startedAt: new Date(),
            runId,
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
            lastError: null,
          },
        },
        { upsert: true, new: true }
      );
      return !!result;
    } catch (err) {
      // Duplicate key = another process just acquired the lock
      if (err.code === 11000) return false;
      throw err;
    }
  }

  static async _releaseLock(jobName, status, errorMessage = null) {
    await CronLock.findOneAndUpdate(
      { jobName },
      {
        $set: {
          status,
          completedAt: new Date(),
          lastError:   errorMessage,
        },
      }
    );
  }

  // ── Structured logger ───────────────────────────────────────────────────────

  static _makeLogger(jobName, runId) {
    const prefix = `[CRON:${jobName}][${runId.slice(0, 8)}]`;
    return {
      info:  (msg, data) => console.log(`${prefix} INFO  ${msg}`, data !== undefined ? JSON.stringify(data) : ""),
      warn:  (msg)       => console.warn(`${prefix} WARN  ${msg}`),
      error: (msg, stack)=> console.error(`${prefix} ERROR ${msg}`, stack || ""),
    };
  }
}

module.exports = CronJobRunner;
