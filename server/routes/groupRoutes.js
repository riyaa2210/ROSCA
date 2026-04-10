const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  createGroup,
  getMyGroups,
  getGroup,
  inviteMember,
  joinGroup,
  leaveGroup,
  startGroup,
  processPayout,
  sendReminders,
  getGroupPaymentStatus,
  getAllGroups,
} = require("../controllers/groupController");

router.use(protect);

router.post("/", createGroup);
router.get("/", getMyGroups);
router.get("/all", adminOnly, getAllGroups);
router.get("/:id", getGroup);
router.post("/:id/invite", inviteMember);
router.post("/join/:code", joinGroup);
router.post("/:id/leave", leaveGroup);
router.post("/:id/start", startGroup);
router.post("/:id/payout", processPayout);
router.post("/:id/reminders", sendReminders);
router.get("/:id/payment-status", getGroupPaymentStatus);

module.exports = router;
