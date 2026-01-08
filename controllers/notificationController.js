const Notification = require("../models/Notification");

/**
 * Get all notifications for donor
 */
exports.getMyNotifications = async (req, res) => {
  try {
    if (req.user.role !== "donor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const notifications = await Notification.find({
      userId: req.user.id,
    })
      .populate("sosId", "bloodGroup urgency createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    res.status(200).json({ unread: count });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification" });
  }
};
