/**
 * Operator Routes
 * Endpoints for operator dashboard and complaints
 */

const express = require("express");
const router = express.Router();

const { authenticateToken, authorize } = require("../middleware/auth");
const requestController = require("../controllers/request");

/**
 * GET /api/operator/complaints
 * Get all complaints assigned to the logged-in operator
 */
router.get(
  "/complaints",
  authenticateToken,
  authorize(["OPERATOR"]),
  requestController.getOperatorComplaints,
);

module.exports = router;
