"use strict";

const mongoose = require("mongoose");

/**
 * CronLock — distributed lock for cron jobs.
 *
 * Prevents the same job from running twice if:
 *  - Server restarts mid-job
 *  - Multiple instances run (horizontal scaling)
 *  - Job takes longer than its schedule interval
 *
 * Strategy: findOneAndUpdate with upsert — atomic "check-and-set".
 * TTL index auto-expires stale locks after LOCK_TTL_SECONDS.
 */
const cronLockSchema = new mongoose.Schema({
  jobName: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["running", "completed", "failed"],
    default: "running",
  },
  startedAt:   { type: Date, default: Date.now },
  completedAt: { type: Date },
  runId:       { type: String }, // unique ID per run (for log correlation)
  lastError:   { type: String },
  // TTL: MongoDB auto-deletes this doc after 2 hours if not cleaned up
  // This prevents stale locks from blocking future runs forever
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    index: { expireAfterSeconds: 0 },
  },
});

module.exports = mongoose.model("CronLock", cronLockSchema);
