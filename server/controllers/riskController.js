"use strict";

const {
  getRiskScore,
  computeAndSaveRiskScore,
  getGroupRiskSummary,
  getBulkRiskScores,
} = require("../services/riskScoringService");

// ── GET /api/risk/me ──────────────────────────────────────────────────────────
exports.getMyRiskScore = async (req, res, next) => {
  try {
    const forceRecompute = req.query.refresh === "true";
    const score = await getRiskScore(req.user._id, forceRecompute);
    res.json(formatResponse(score));
  } catch (err) {
    next(err);
  }
};

// ── GET /api/risk/user/:userId  (admin only) ──────────────────────────────────
exports.getUserRiskScore = async (req, res, next) => {
  try {
    const score = await getRiskScore(req.params.userId);
    if (!score) return res.status(404).json({ message: "No risk score found" });
    res.json(formatResponse(score));
  } catch (err) {
    next(err);
  }
};

// ── POST /api/risk/recompute/:userId  (admin only) ────────────────────────────
exports.recomputeScore = async (req, res, next) => {
  try {
    const score = await computeAndSaveRiskScore(req.params.userId);
    res.json({ message: "Score recomputed", ...formatResponse(score) });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/risk/group/:groupId  (admin only) ────────────────────────────────
exports.getGroupRiskSummary = async (req, res, next) => {
  try {
    const summary = await getGroupRiskSummary(req.params.groupId);
    if (!summary) return res.status(404).json({ message: "Group not found" });
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatResponse(score) {
  const categoryMeta = {
    LOW:    { label: "Low Risk",    color: "#10b981", emoji: "🟢" },
    MEDIUM: { label: "Medium Risk", color: "#f59e0b", emoji: "🟡" },
    HIGH:   { label: "High Risk",   color: "#ef4444", emoji: "🔴" },
  };

  return {
    score:      score.score,
    category:   score.category,
    ...categoryMeta[score.category],
    factors:    score.factors,
    breakdown:  score.breakdown,
    computedAt: score.computedAt,
    isStale:    score.isStale,
    // Human-readable interpretation
    interpretation: getInterpretation(score.score, score.factors),
  };
}

function getInterpretation(score, factors) {
  const lines = [];

  if (factors.currentStreak >= 6) {
    lines.push(`🔥 ${factors.currentStreak}-month payment streak`);
  }
  if (factors.onTimePayments > 0) {
    const rate = Math.round((factors.onTimePayments / factors.totalContributions) * 100);
    lines.push(`✅ ${rate}% on-time payment rate`);
  }
  if (factors.missedPayments > 0) {
    lines.push(`⚠️ ${factors.missedPayments} missed payment${factors.missedPayments > 1 ? "s" : ""}`);
  }
  if (factors.latePayments > 0 && factors.avgDaysLate > 5) {
    lines.push(`⏰ Average ${factors.avgDaysLate} days late on late payments`);
  }
  if (factors.totalContributions < 3) {
    lines.push("📊 Limited history — score will improve with more payments");
  }

  return lines;
}
