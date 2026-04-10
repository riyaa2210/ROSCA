const { getUserNotifications, markAllRead } = require("../services/notificationService");

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await getUserNotifications(req.user._id);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    await markAllRead(req.user._id);
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};
