const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are BhishiBot, a friendly financial assistant for the Bhishi App — 
a money pooling / ROSCA savings platform used in India.

Your job:
- Answer questions about the user's groups, payments, and payouts
- Give short, clear, friendly responses (2-4 sentences max)
- Use ₹ for currency, keep it conversational
- If you don't have enough data, ask a clarifying question
- Never make up financial data — only use what is provided in the context

You understand concepts like:
- Bhishi / Chit Fund / ROSCA: a group savings system where members contribute monthly and one member receives the full pool each month
- Contributions: monthly payments each member makes
- Payouts: the full pool amount one member receives per month
- Payout order: the sequence in which members receive the pool`;

/**
 * Build a context string from the user's real data
 * so the AI can answer questions accurately
 */
const buildUserContext = (user, groups, transactions) => {
  if (!groups || groups.length === 0) {
    return `User ${user.name} has no active groups yet.`;
  }

  const groupSummaries = groups.map((g) => {
    const activeMembers = g.members?.filter((m) => m.status === "active").length || 0;
    const myTx = transactions?.filter(
      (tx) => tx.group?._id?.toString() === g._id?.toString() || tx.group?.toString() === g._id?.toString()
    ) || [];
    const pendingCount = myTx.filter((tx) => tx.type === "contribution" && tx.status === "pending").length;
    const paidCount = myTx.filter((tx) => tx.type === "contribution" && tx.status === "paid").length;

    // Find next payout recipient
    let nextPayout = "Not determined yet";
    if (g.status === "active" && g.payoutOrder && g.payoutOrder.length > 0) {
      const idx = (g.currentMonth || 1) - 1;
      const recipient = g.payoutOrder[idx];
      nextPayout = recipient?.name || recipient?.toString() || "Unknown";
    }

    return `
Group: "${g.name}"
  Status: ${g.status}
  Monthly amount: ₹${g.monthlyAmount}
  Members: ${activeMembers}/${g.maxMembers}
  Duration: ${g.duration} months
  Current month: ${g.currentMonth || 0}
  Pool per month: ₹${g.monthlyAmount * activeMembers}
  Next payout recipient: ${nextPayout}
  My contributions this group: ${paidCount} paid, ${pendingCount} pending`;
  });

  const totalContributed = transactions
    ?.filter((tx) => tx.type === "contribution" && tx.status === "paid")
    .reduce((sum, tx) => sum + tx.amount, 0) || 0;

  const totalReceived = transactions
    ?.filter((tx) => tx.type === "payout" && tx.status === "paid")
    .reduce((sum, tx) => sum + tx.amount, 0) || 0;

  return `
User: ${user.name} (${user.email})
Total contributed (all time): ₹${totalContributed}
Total received as payout (all time): ₹${totalReceived}
Number of groups: ${groups.length}
${groupSummaries.join("\n")}`.trim();
};

/**
 * Send a chat message and get a response
 * @param {string} userMessage - the user's question
 * @param {Array}  history     - [{role, content}] previous messages (max 10)
 * @param {string} context     - user's financial data as text
 */
exports.chat = async (userMessage, history = [], context = "") => {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `Here is the current user's financial data:\n\n${context}`,
    },
    ...history.slice(-10), // keep last 10 messages for context
    { role: "user", content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    max_tokens: 200,
    temperature: 0.7,
  });

  return response.choices[0].message.content.trim();
};

/**
 * Generate financial insights for the dashboard
 */
exports.generateInsights = async (user, groups, transactions) => {
  const context = buildUserContext(user, groups, transactions);

  const prompt = `Based on this user's Bhishi group data, generate 3 short, actionable financial insights.
Format as a JSON array of objects with "icon" (emoji), "title" (5 words max), and "tip" (1 sentence).
Only return valid JSON, nothing else.

User data:
${context}`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    max_tokens: 300,
    temperature: 0.6,
  });

  try {
    const text = response.choices[0].message.content.trim();
    // Extract JSON even if wrapped in markdown code blocks
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    return [];
  }
};

/**
 * Generate a smart payment reminder message for a user
 */
exports.generateReminder = async (user, group, month) => {
  const prompt = `Write a friendly, short (2 sentences) payment reminder for:
- User: ${user.name}
- Group: "${group.name}"
- Amount due: ₹${group.monthlyAmount}
- Month: ${month}
Make it warm and motivating, not threatening.`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 100,
    temperature: 0.8,
  });

  return response.choices[0].message.content.trim();
};

exports.buildUserContext = buildUserContext;
