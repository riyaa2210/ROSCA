const Razorpay = require("razorpay");
const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const Group = require("../models/Group");
const { createNotification } = require("../services/notificationService");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
exports.createOrder = async (req, res, next) => {
  try {
    const { groupId, month } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.status === "active"
    );
    if (!isMember) return res.status(403).json({ message: "Not an active member" });

    // Check if already paid
    const existing = await Transaction.findOne({
      user: req.user._id,
      group: groupId,
      month,
      type: "contribution",
      status: "paid",
    });
    if (existing) return res.status(400).json({ message: "Already paid for this month" });

    const order = await razorpay.orders.create({
      amount: group.monthlyAmount * 100, // paise
      currency: "INR",
      receipt: `bhishi_${groupId}_${req.user._id}_${month}`,
    });

    res.json({ order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    next(err);
  }
};

// Verify payment and update transaction
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, groupId, month } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Update or create transaction as paid
    const tx = await Transaction.findOneAndUpdate(
      { user: req.user._id, group: groupId, month, type: "contribution" },
      {
        status: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
      },
      { new: true, upsert: true }
    );

    await createNotification({
      userId: req.user._id,
      title: "Payment Successful",
      message: `Your contribution for month ${month} has been recorded.`,
      type: "general",
    });

    // Real-time update
    const io = req.app.get("io");
    if (io) io.to(`group_${groupId}`).emit("payment_update", { userId: req.user._id, month, status: "paid" });

    res.json({ message: "Payment verified", transaction: tx });
  } catch (err) {
    next(err);
  }
};

// Get payment history for a group
exports.getGroupTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ group: req.params.groupId })
      .populate("user", "name email profilePic")
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
};
