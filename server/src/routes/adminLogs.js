const express = require("express");
const router = express.Router();

const { authenticateToken, authorize } = require("../middleware/auth");
const adminLogsController = require("../controllers/adminLogs");

/**
 * POST /api/admin/logs
 * Create admin activity log
 */
router.post(
  "/logs",
  authenticateToken,
  authorize(["ADMIN"]),
  adminLogsController.createAdminLog,
);

/**
 * GET /api/admin/logs
 * List admin activity logs
 */
router.get(
  "/logs",
  authenticateToken,
  authorize(["ADMIN"]),
  adminLogsController.getAdminLogs,
);

/**
 * GET /api/admin/operator-workload
 * List active operator workload for auto-assignment visibility
 */
router.get(
  "/operator-workload",
  authenticateToken,
  authorize(["ADMIN"]),
  adminLogsController.getOperatorWorkload,
);

module.exports = router;
