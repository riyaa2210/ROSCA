const crypto = require("crypto");
const Group = require("../models/Group");
const Transaction = require("../models/Transaction");
const User = require("../models/user");
const { sendGroupInviteEmail, sendPayoutAnnouncementEmail, sendPaymentReminderEmail } = require("../services/emailService");
const { createNotification } = require("../services/notificationService");

const generateInviteCode = () => crypto.randomBytes(6).toString("hex");

// Create group
exports.createGroup = async (req, res, next) => {
  try {
    const { name, description, monthlyAmount, maxMembers, duration, startDate, payoutType } = req.body;

    const group = await Group.create({
      name,
      description,
      admin: req.user._id,
      members: [{ user: req.user._id }],
      monthlyAmount,
      maxMembers,
      duration,
      startDate,
      payoutType: payoutType || "random",
      inviteCode: generateInviteCode(),
    });

    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
};

// Get all groups for current user
exports.getMyGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ "members.user": req.user._id })
      .populate("admin", "name email profilePic")
      .populate("members.user", "name email profilePic");
    res.json(groups);
  } catch (err) {
    next(err);
  }
};

// Get single group
exports.getGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("admin", "name email profilePic")
      .populate("members.user", "name email profilePic phone")
      .populate("payoutOrder", "name email profilePic");

    if (!group) return res.status(404).json({ message: "Group not found" });

    const isMember = group.members.some((m) => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member of this group" });

    res.json(group);
  } catch (err) {
    next(err);
  }
};

// Invite member by email
exports.inviteMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only admin can invite" });

    const inviteLink = `${process.env.CLIENT_URL}/join/${group.inviteCode}`;
    sendGroupInviteEmail(email, req.user.name, group.name, inviteLink);

    res.json({ message: "Invitation sent", inviteLink });
  } catch (err) {
    next(err);
  }
};

// Join group via invite code
exports.joinGroup = async (req, res, next) => {
  try {
    const group = await Group.findOne({ inviteCode: req.params.code });
    if (!group) return res.status(404).json({ message: "Invalid invite code" });

    if (group.status !== "pending")
      return res.status(400).json({ message: "Group is no longer accepting members" });

    const alreadyMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) return res.status(400).json({ message: "Already a member" });

    if (group.members.length >= group.maxMembers)
      return res.status(400).json({ message: "Group is full" });

    group.members.push({ user: req.user._id });
    await group.save();

    await createNotification({
      userId: group.admin,
      title: "New Member Joined",
      message: `${req.user.name} joined your group "${group.name}"`,
      type: "general",
    });

    res.json({ message: "Joined group successfully", group });
  } catch (err) {
    next(err);
  }
};

// Leave group
exports.leaveGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.admin.toString() === req.user._id.toString())
      return res.status(400).json({ message: "Admin cannot leave. Transfer admin or delete group." });

    group.members = group.members.map((m) => {
      if (m.user.toString() === req.user._id.toString()) m.status = "left";
      return m;
    });
    await group.save();

    res.json({ message: "Left group successfully" });
  } catch (err) {
    next(err);
  }
};

// Start group (admin only) — assigns payout order
exports.startGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only admin can start the group" });
    if (group.status !== "pending")
      return res.status(400).json({ message: "Group already started" });

    const activeMembers = group.members.filter((m) => m.status === "active").map((m) => m.user);

    // Randomly shuffle payout order
    const shuffled = activeMembers.sort(() => Math.random() - 0.5);
    group.payoutOrder = shuffled;
    group.status = "active";
    group.currentMonth = 1;
    group.startDate = group.startDate || new Date();
    group.nextPayoutDate = new Date(group.startDate);
    group.nextPayoutDate.setMonth(group.nextPayoutDate.getMonth() + 1);

    // Create pending contribution transactions for month 1
    const txDocs = activeMembers.map((userId) => ({
      user: userId,
      group: group._id,
      amount: group.monthlyAmount,
      type: "contribution",
      status: "pending",
      month: 1,
    }));
    await Transaction.insertMany(txDocs);

    await group.save();

    // Notify all members
    for (const userId of activeMembers) {
      await createNotification({
        userId,
        title: `Group "${group.name}" has started!`,
        message: `Your Bhishi group has started. Month 1 contribution of ₹${group.monthlyAmount} is due.`,
        type: "payment_reminder",
      });
    }

    res.json(group);
  } catch (err) {
    next(err);
  }
};

// Process monthly payout (admin only)
exports.processPayout = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id).populate("payoutOrder");
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only admin can process payout" });
    if (group.status !== "active")
      return res.status(400).json({ message: "Group is not active" });

    const payoutIndex = group.currentMonth - 1;
    if (payoutIndex >= group.payoutOrder.length)
      return res.status(400).json({ message: "All payouts completed" });

    const recipient = group.payoutOrder[payoutIndex];
    const activeMembers = group.members.filter((m) => m.status === "active");
    const payoutAmount = group.monthlyAmount * activeMembers.length;

    // Create payout transaction
    await Transaction.create({
      user: recipient._id,
      group: group._id,
      amount: payoutAmount,
      type: "payout",
      status: "paid",
      month: group.currentMonth,
      paidAt: new Date(),
    });

    // Mark member as received payout
    group.members = group.members.map((m) => {
      if (m.user.toString() === recipient._id.toString()) m.hasReceivedPayout = true;
      return m;
    });

    // Advance to next month or complete
    if (group.currentMonth >= group.duration) {
      group.status = "completed";
    } else {
      group.currentMonth += 1;
      group.nextPayoutDate = new Date(group.nextPayoutDate);
      group.nextPayoutDate.setMonth(group.nextPayoutDate.getMonth() + 1);

      // Create pending contributions for next month
      const txDocs = activeMembers.map((m) => ({
        user: m.user,
        group: group._id,
        amount: group.monthlyAmount,
        type: "contribution",
        status: "pending",
        month: group.currentMonth,
      }));
      await Transaction.insertMany(txDocs);
    }

    await group.save();

    // Notify recipient
    await createNotification({
      userId: recipient._id,
      title: "Payout Received!",
      message: `You received ₹${payoutAmount} from group "${group.name}"`,
      type: "payout_announcement",
    });

    sendPayoutAnnouncementEmail(recipient, group, payoutAmount, group.currentMonth - 1);

    res.json({ message: "Payout processed", recipient, payoutAmount });
  } catch (err) {
    next(err);
  }
};

// Send payment reminders (admin only)
exports.sendReminders = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only admin can send reminders" });

    const pendingTxs = await Transaction.find({
      group: group._id,
      month: group.currentMonth,
      type: "contribution",
      status: "pending",
    }).populate("user", "name email");

    for (const tx of pendingTxs) {
      sendPaymentReminderEmail(tx.user, group, group.currentMonth);
      await createNotification({
        userId: tx.user._id,
        title: "Payment Reminder",
        message: `Your ₹${group.monthlyAmount} contribution for "${group.name}" is pending.`,
        type: "payment_reminder",
      });
    }

    res.json({ message: `Reminders sent to ${pendingTxs.length} members` });
  } catch (err) {
    next(err);
  }
};

// Get group payment status for current month
exports.getGroupPaymentStatus = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const transactions = await Transaction.find({
      group: group._id,
      month: group.currentMonth,
      type: "contribution",
    }).populate("user", "name email profilePic");

    res.json(transactions);
  } catch (err) {
    next(err);
  }
};

// Admin: get all groups
exports.getAllGroups = async (req, res, next) => {
  try {
    const groups = await Group.find()
      .populate("admin", "name email")
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    next(err);
  }
};
