/**
 * Example: Role-Based Route Protection
 * Shows how to implement different access levels throughout the app
 */

const express = require("express");
const router = express.Router();

// ============================================
// IMPORT MIDDLEWARE
// ============================================
const {
  authenticateToken,
  authorize,
  requireAdmin,
  requireOperator,
  optionalAuth,
} = require("../middleware/auth");

// ============================================
// CITIZEN ROUTES
// ============================================

/**
 * POST /api/requests/create
 * Citizens create new resource requests
 * Access: Authenticated citizens, operators, admins
 */
router.post(
  "/requests/create",
  authenticateToken, // ← Must be logged in
  async (req, res) => {
    try {
      const { resourceType, quantity, urgency } = req.body;

      // Create request linked to current user
      const request = await db.Request.create({
        user_id: req.user.userId, // ← From JWT token
        resource_type: resourceType,
        quantity,
        urgency,
        status: "PENDING",
      });

      res.status(201).json({
        success: true,
        data: request,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

/**
 * GET /api/requests/my
 * Citizens view their own requests
 */
router.get("/requests/my", authenticateToken, async (req, res) => {
  try {
    const requests = await db.Request.findAll({
      where: { user_id: req.user.userId }, // ← Filter by logged-in user
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/requests/:id
 * Citizens can only update their own requests
 */
router.put("/requests/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const request = await db.Request.findByPk(id);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.user_id !== req.user.userId) {
      // ← User can only edit their own
      return res.status(403).json({
        error: "You can only edit your own requests",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        error: "Can only edit pending requests",
      });
    }

    await request.update(req.body);

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// OPERATOR ROUTES
// ============================================

/**
 * GET /api/requests/pending
 * Operators view all pending requests
 * Access: Operators and Admins only
 */
router.get(
  "/requests/pending",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]), // ← Role check
  async (req, res) => {
    try {
      const requests = await db.Request.findAll({
        where: { status: "PENDING" },
        include: [
          {
            model: db.User,
            attributes: ["id", "name", "email"], // ← Don't expose password
          },
        ],
        order: [["urgency", "DESC"]],
      });

      res.json({
        success: true,
        data: requests,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

/**
 * POST /api/resources/allocate
 * Operators allocate resources to requests
 */
router.post(
  "/resources/allocate",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  async (req, res) => {
    try {
      const { requestId, resourceId, quantity } = req.body;

      // Allocate resource
      const allocation = await db.ResourceAllocation.create({
        request_id: requestId,
        resource_id: resourceId,
        quantity_allocated: quantity,
        allocated_by: req.user.userId, // ← Track who allocated
        allocated_at: new Date(),
      });

      // Update request status
      await db.Request.update(
        { status: "ALLOCATED" },
        { where: { id: requestId } },
      );

      // Log action
      await db.ActionLog.create({
        user_id: req.user.userId,
        action_type: "RESOURCE_ALLOCATION",
        description: `Allocated ${quantity} units of resource ${resourceId} to request ${requestId}`,
        status: "SUCCESS",
      });

      res.json({
        success: true,
        data: allocation,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

/**
 * GET /api/analytics/operations
 * Operators view operational analytics
 */
router.get(
  "/analytics/operations",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  async (req, res) => {
    try {
      const totalRequests = await db.Request.count();
      const pendingRequests = await db.Request.count({
        where: { status: "PENDING" },
      });
      const allocatedRequests = await db.Request.count({
        where: { status: "ALLOCATED" },
      });

      res.json({
        success: true,
        data: {
          totalRequests,
          pendingRequests,
          allocatedRequests,
          allocationRate: ((allocatedRequests / totalRequests) * 100).toFixed(
            2,
          ),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * GET /api/admin/users
 * View all users in system
 * Access: Admin only
 */
router.get(
  "/admin/users",
  authenticateToken,
  requireAdmin, // ← Shorthand for authorize(['ADMIN'])
  async (req, res) => {
    try {
      const users = await db.User.findAll({
        attributes: ["id", "name", "email", "role", "is_active"],
      });

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

/**
 * PUT /api/admin/users/:userId/role
 * Change user role
 * Admin only
 */
router.put(
  "/admin/users/:userId/role",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { newRole } = req.body;

      // Validate role
      if (!["CITIZEN", "OPERATOR", "ADMIN"].includes(newRole)) {
        return res.status(400).json({
          error: "Invalid role. Must be CITIZEN, OPERATOR, or ADMIN",
        });
      }

      // Prevent demoting a fellow admin
      const targetUser = await db.User.findByPk(userId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (targetUser.role === "ADMIN" && newRole !== "ADMIN") {
        // Additional check: Only one admin minimum or allow?
        // This is a business rule - implement as needed
        console.warn(`Admin ${userId} being demoted from ADMIN to ${newRole}`);
      }

      await targetUser.update({ role: newRole });

      // Log admin action
      await db.ActionLog.create({
        user_id: req.user.userId,
        action_type: "ROLE_CHANGE",
        description: `Changed user ${userId} role to ${newRole}`,
        status: "SUCCESS",
      });

      res.json({
        success: true,
        message: `User role updated to ${newRole}`,
        data: targetUser,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

/**
 * DELETE /api/admin/users/:userId
 * Deactivate user account
 * Admin only
 */
router.delete(
  "/admin/users/:userId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await db.User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent self-deletion
      if (userId === req.user.userId) {
        return res.status(400).json({
          error: "You cannot deactivate your own account",
        });
      }

      // Soft delete: deactivate instead of hard delete
      await user.update({ is_active: false });

      // Log admin action
      await db.ActionLog.create({
        user_id: req.user.userId,
        action_type: "USER_DEACTIVATION",
        description: `Deactivated user ${userId} (${user.email})`,
        status: "SUCCESS",
      });

      res.json({
        success: true,
        message: "User deactivated",
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

/**
 * GET /api/admin/audit-logs
 * View system audit trails
 * Admin only
 */
router.get(
  "/admin/audit-logs",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { limit = 100, offset = 0 } = req.query;

      const logs = await db.ActionLog.findAndCountAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: db.User,
            attributes: ["id", "email"],
          },
        ],
      });

      res.json({
        success: true,
        data: logs.rows,
        pagination: {
          total: logs.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * GET /api/resources
 * Anyone can view available resources
 * Optional auth: shows additional info if logged in
 */
router.get(
  "/resources",
  optionalAuth, // ← Works with or without token
  async (req, res) => {
    try {
      let query = {};

      // If user is authenticated, include allocation status
      if (req.user) {
        // Show resources with user's allocations
        const resources = await db.Resource.findAll({
          include: [
            {
              model: db.ResourceAllocation,
              where: { allocated_by: req.user.userId },
              required: false,
            },
          ],
        });
        return res.json({ success: true, data: resources });
      }

      // Public view: basic resource info only
      const resources = await db.Resource.findAll({
        attributes: ["id", "name", "type", "quantity_available"],
      });

      res.json({
        success: true,
        data: resources,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

/**
 * GET /api/health-check
 * Public endpoint, no auth needed
 */
router.get("/health-check", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// EXPORTS
// ============================================

module.exports = router;

/**
 * Usage in app.js:
 *
 * const routes = require('./routes/example');
 * app.use('/api', routes);
 *
 * This creates endpoints like:
 * POST   /api/requests/create
 * GET    /api/requests/my
 * PUT    /api/requests/:id
 * GET    /api/requests/pending
 * POST   /api/resources/allocate
 * GET    /api/analytics/operations
 * GET    /api/admin/users
 * PUT    /api/admin/users/:userId/role
 * DELETE /api/admin/users/:userId
 * GET    /api/admin/audit-logs
 * GET    /api/resources
 * GET    /api/health-check
 */
