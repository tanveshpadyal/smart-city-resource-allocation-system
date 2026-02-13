/**
 * Allocation Routes
 * Endpoints for operators/admins to manage allocations
 */

const express = require("express");
const router = express.Router();

const { authenticateToken, authorize } = require("../middleware/auth");
const allocationController = require("../controllers/allocation");

/**
 * POST /api/allocations/manual
 * Operator manually allocates a resource to a request
 */
router.post(
  "/manual",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  allocationController.manualAllocate,
);

/**
 * POST /api/allocations/auto/:requestId
 * Operator triggers auto-allocation for a request
 */
router.post(
  "/auto/:requestId",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  allocationController.autoAllocate,
);

/**
 * GET /api/allocations/suggest/:requestId
 * Get suggested resources for a request
 */
router.get(
  "/suggest/:requestId",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  allocationController.suggestResources,
);

/**
 * GET /api/allocations/list
 * View all allocations
 */
router.get(
  "/list",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  allocationController.getAllocations,
);

/**
 * GET /api/allocations/:allocationId
 * View allocation details
 */
router.get(
  "/:allocationId",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  allocationController.getAllocation,
);

/**
 * PUT /api/allocations/:allocationId/in-transit
 * Mark allocation as in-transit
 */
router.put(
  "/:allocationId/in-transit",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  allocationController.markInTransit,
);

/**
 * PUT /api/allocations/:allocationId/delivered
 * Mark allocation as delivered
 */
router.put(
  "/:allocationId/delivered",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  allocationController.markDelivered,
);

/**
 * DELETE /api/allocations/:allocationId
 * Cancel allocation and free resources
 */
router.delete(
  "/:allocationId",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  allocationController.cancelAllocation,
);

module.exports = router;
