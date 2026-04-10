const Notification = require("../models/Notification");

exports.createNotification = async ({ userId, title, message, type = "general", link }) => {
  return Notification.create({ user: userId, title, message, type, link });
};

exports.getUserNotifications = async (userId) => {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
};

exports.markAllRead = async (userId) => {
  return Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
};
