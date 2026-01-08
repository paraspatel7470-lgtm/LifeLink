const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
} = require("../controllers/notificationController");

router.get("/", protect, getMyNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/:id/read", protect, markAsRead);

module.exports = router;
