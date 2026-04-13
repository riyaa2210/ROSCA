const { chat, generateInsights, generateReminder, buildUserContext } = require("../services/aiService");
const Group = require("../models/Group");
const Transaction = require("../models/Transaction");

// POST /api/ai/chat
exports.chatWithBot = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Fetch user's real data to give the AI accurate context
    const [groups, transactions] = await Promise.all([
      Group.find({ "members.user": req.user._id })
        .populate("payoutOrder", "name")
        .lean(),
      Transaction.find({ user: req.user._id })
        .populate("group", "name monthlyAmount")
        .lean(),
    ]);

    const context = buildUserContext(req.user, groups, transactions);
    const reply = await chat(message, history, context);

    res.json({ reply });
  } catch (err) {
    // Graceful fallback if OpenAI is down or key is missing
    if (err?.status === 401 || err?.code === "invalid_api_key") {
      return res.status(503).json({
        reply: "AI service is not configured. Please add your OpenAI API key.",
      });
    }
    next(err);
  }
};

// GET /api/ai/insights
exports.getInsights = async (req, res, next) => {
  try {
    const [groups, transactions] = await Promise.all([
      Group.find({ "members.user": req.user._id })
        .populate("payoutOrder", "name")
        .lean(),
      Transaction.find({ user: req.user._id })
        .populate("group", "name monthlyAmount")
        .lean(),
    ]);

    const insights = await generateInsights(req.user, groups, transactions);

    // Fallback insights if AI fails or returns empty
    if (!insights || insights.length === 0) {
      return res.json([
        { icon: "💡", title: "Stay consistent", tip: "Regular contributions build trust in your group." },
        { icon: "📅", title: "Track your schedule", tip: "Check your payout order to plan your finances." },
        { icon: "🤝", title: "Invite trusted members", tip: "A reliable group ensures smooth payouts for everyone." },
      ]);
    }

    res.json(insights);
  } catch (err) {
    // Return static fallback on any error
    res.json([
      { icon: "💡", title: "Stay consistent", tip: "Regular contributions build trust in your group." },
      { icon: "📅", title: "Track your schedule", tip: "Check your payout order to plan your finances." },
      { icon: "🤝", title: "Invite trusted members", tip: "A reliable group ensures smooth payouts for everyone." },
    ]);
  }
};

// POST /api/ai/reminder  (admin use — generate smart reminder for a member)
exports.smartReminder = async (req, res, next) => {
  try {
    const { userId, groupId, month } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Use the requesting user as target if no userId provided
    const targetUser = req.user;
    const message = await generateReminder(targetUser, group, month);

    res.json({ message });
  } catch (err) {
    next(err);
  }
};
