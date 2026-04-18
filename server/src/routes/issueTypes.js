const express = require("express");
const router = express.Router();

const { authenticateToken, authorize } = require("../middleware/auth");
const issueTypeController = require("../controllers/issueType");

router.get(
  "/",
  authenticateToken,
  authorize(["CITIZEN", "OPERATOR", "ADMIN"]),
  issueTypeController.getActiveIssueTypes,
);

router.get(
  "/admin",
  authenticateToken,
  authorize(["ADMIN"]),
  issueTypeController.getAdminIssueTypes,
);

router.post(
  "/",
  authenticateToken,
  authorize(["ADMIN"]),
  issueTypeController.createIssueType,
);

router.delete(
  "/:issueTypeId",
  authenticateToken,
  authorize(["ADMIN"]),
  issueTypeController.deleteIssueType,
);

module.exports = router;
