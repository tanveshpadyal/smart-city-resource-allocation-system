const express = require("express");
const { authenticateToken, authorize } = require("../middleware/auth");
const chatController = require("../controllers/chatController");

const router = express.Router();

// Test endpoint to verify route is accessible
router.get("/test", (req, res) => {
  res.json({ message: "Chat route is accessible" });
});

router.post(
  "/",
  authenticateToken,
  authorize(["CITIZEN", "OPERATOR", "ADMIN"]),
  chatController.chat,
);

module.exports = router;
