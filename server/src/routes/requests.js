/**
 * Request & Allocation Routes
 * Endpoints for citizens to create requests and operators to manage allocations
 */

const express = require("express");
const router = express.Router();

const { authenticateToken, authorize } = require("../middleware/auth");
const requestController = require("../controllers/request");
const allocationController = require("../controllers/allocation");

// ============================================
// CITIZEN ROUTES
// ============================================

/**
 * POST /api/requests
 * Create a new resource request
 * Access: Authenticated citizens
 */
router.post("/", authenticateToken, requestController.createRequest);

/**
 * GET /api/requests/me
 * Get citizen's own requests
 */
router.get("/me", authenticateToken, requestController.getMyRequests);

/**
 * GET /api/requests/:requestId
 * Get specific request details
 * Citizen can only view own requests
 */
router.get("/:requestId", authenticateToken, requestController.getRequest);

/**
 * PUT /api/requests/:requestId
 * Update PENDING request
 * Citizen can update quantity, priority, description
 */
router.put("/:requestId", authenticateToken, requestController.updateRequest);

/**
 * DELETE /api/requests/:requestId
 * Cancel PENDING request
 */
router.delete(
  "/:requestId",
  authenticateToken,
  requestController.cancelRequest,
);

// ============================================
// OPERATOR ROUTES
// ============================================

/**
 * GET /api/requests/pending/list
 * View all pending requests
 * Access: Operators and Admins
 * Querystring: priority, category, limit, offset
 */
router.get(
  "/pending/list",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  requestController.getPendingRequests,
);

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
 * Helps operator with manual allocation decisions
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
 * Querystring: status, limit, offset
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
 * Mark allocation as delivered (complete)
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
