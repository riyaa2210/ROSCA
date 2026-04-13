const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { chatWithBot, getInsights, smartReminder } = require("../controllers/aiController");

router.use(protect);

// POST /api/ai/chat      — chatbot conversation
router.post("/chat", chatWithBot);

// GET  /api/ai/insights  — AI-generated financial insights
router.get("/insights", getInsights);

// POST /api/ai/reminder  — generate a smart payment reminder
router.post("/reminder", smartReminder);

module.exports = router;
