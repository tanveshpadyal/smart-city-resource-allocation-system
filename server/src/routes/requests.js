/**
 * Request Routes (Complaint Management)
 * Endpoints for citizens, operators, and admins to manage complaints
 */

const express = require("express");
const router = express.Router();

const { authenticateToken, authorize } = require("../middleware/auth");
const requestController = require("../controllers/request");

// ============================================
// CITIZEN ROUTES
// ============================================

/**
 * POST /api/requests
 * Create a new complaint
 * Access: Authenticated citizens
 * Body: complaint_category, description, location_id OR (latitude, longitude), image (optional)
 */
router.post(
  "/",
  authenticateToken,
  authorize(["CITIZEN"]),
  requestController.createRequest,
);

/**
 * GET /api/requests/me
 * Get citizen's own complaints
 */
router.get(
  "/me",
  authenticateToken,
  authorize(["CITIZEN"]),
  requestController.getMyRequests,
);

/**
 * GET /api/requests/:requestId
 * Get specific complaint details
 * Citizen can only view own complaints
 */
router.get("/:requestId", authenticateToken, requestController.getRequest);

/**
 * GET /api/requests/:requestId/timeline
 * Get complaint timeline events
 */
router.get(
  "/:requestId/timeline",
  authenticateToken,
  requestController.getComplaintTimeline,
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * GET /api/requests/admin/all
 * View all complaints with filtering
 * Access: Admin only
 * Querystring: status, category, limit, offset
 */
router.get(
  "/admin/all",
  authenticateToken,
  authorize(["ADMIN"]),
  requestController.getAllComplaints,
);

/**
 * GET /api/requests/admin/pending
 * View all pending complaints (unassigned)
 * Access: Admin only
 * Querystring: category, limit, offset
 */
router.get(
  "/admin/pending",
  authenticateToken,
  authorize(["ADMIN"]),
  requestController.getPendingRequests,
);

/**
 * GET /api/requests/admin/stats/time
 * Time-based analytics for admin dashboard
 */
router.get(
  "/admin/stats/time",
  authenticateToken,
  authorize(["ADMIN"]),
  requestController.getTimeStats,
);

/**
 * GET /api/requests/admin/operator-performance
 * Operator performance leaderboard
 */
router.get(
  "/admin/operator-performance",
  authenticateToken,
  authorize(["ADMIN"]),
  requestController.getOperatorPerformance,
);

/**
 * GET /api/requests/admin/analytics
 * Dashboard chart analytics (daily/category/status)
 */
router.get(
  "/admin/analytics",
  authenticateToken,
  authorize(["ADMIN"]),
  requestController.getAdminAnalytics,
);

/**
 * GET /api/requests/admin/overdue
 * Overdue complaints based on SLA
 */
router.get(
  "/admin/overdue",
  authenticateToken,
  authorize(["ADMIN"]),
  requestController.getOverdueComplaints,
);

/**
 * GET /api/requests/admin/export
 * Export complaints as CSV
 */
router.get(
  "/admin/export",
  authenticateToken,
  authorize(["ADMIN"]),
  requestController.exportComplaints,
);

/**
 * GET /api/requests/admin/locations
 * Returns complaints with valid lat/lng
 */
router.get(
  "/admin/locations",
  authenticateToken,
  authorize(["ADMIN"]),
  requestController.getAdminLocations,
);

/**
 * POST /api/requests/:requestId/assign
 * Assign complaint to operator
 * Access: Admin only
 * Body: operator_id
 */
router.post(
  "/:requestId/assign",
  authenticateToken,
  authorize(["ADMIN"]),
  requestController.assignComplaint,
);

// ============================================
// OPERATOR ROUTES
// ============================================

/**
 * GET /api/requests/operator/assigned
 * Get assigned complaints for operator
 * Access: Operator only
 */
router.get(
  "/operator/assigned",
  authenticateToken,
  authorize(["OPERATOR"]),
  requestController.getAssignedComplaints,
);

/**
 * PATCH /api/requests/:requestId/status
 * Update complaint status (operator only)
 * Body: status
 */
router.patch(
  "/:requestId/status",
  authenticateToken,
  authorize(["OPERATOR"]),
  requestController.updateComplaintStatus,
);

/**
 * POST /api/requests/:requestId/start
 * Start complaint resolution
 * Access: Assigned operator only
 */
router.post(
  "/:requestId/start",
  authenticateToken,
  authorize(["OPERATOR"]),
  requestController.startComplaintResolution,
);

/**
 * POST /api/requests/:requestId/resolve
 * Mark complaint as resolved
 * Access: Assigned operator only
 * Body: operator_remark
 */
router.post(
  "/:requestId/resolve",
  authenticateToken,
  authorize(["OPERATOR"]),
  requestController.resolveComplaint,
);

module.exports = router;
