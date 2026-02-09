/**
 * Request Controller
 * Handles citizen resource request creation and management
 */

const db = require("../models");
const AllocationService = require("../services/AllocationService");

/**
 * CREATE REQUEST
 * Citizen creates a resource request
 *
 * Flow:
 * 1. Validate input
 * 2. Create request in PENDING status
 * 3. For EMERGENCY/HIGH priority: auto-allocate
 * 4. Otherwise: wait for operator allocation
 */
const createRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const {
      locationId,
      resourceCategory,
      quantityRequested,
      priority = "MEDIUM",
      description,
    } = req.body;

    // ========== INPUT VALIDATION ==========
    if (!locationId || !resourceCategory || !quantityRequested) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: locationId, resourceCategory, quantityRequested",
        code: "MISSING_FIELDS",
      });
    }

    if (
      !["WATER", "ELECTRICITY", "MEDICAL", "TRANSPORT", "OTHER"].includes(
        resourceCategory,
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid resourceCategory",
        code: "INVALID_CATEGORY",
      });
    }

    if (!["LOW", "MEDIUM", "HIGH", "EMERGENCY"].includes(priority)) {
      return res.status(400).json({
        success: false,
        error: "Invalid priority",
        code: "INVALID_PRIORITY",
      });
    }

    if (quantityRequested < 1) {
      return res.status(400).json({
        success: false,
        error: "Quantity must be at least 1",
        code: "INVALID_QUANTITY",
      });
    }

    // ========== VERIFY LOCATION EXISTS ==========
    const location = await db.Location.findByPk(locationId);
    if (!location) {
      return res.status(400).json({
        success: false,
        error: "Location does not exist",
        code: "LOCATION_NOT_FOUND",
      });
    }

    // ========== CREATE REQUEST ==========
    const targetCompletionTime =
      AllocationService.calculateTargetCompletionTime(priority);

    const request = await db.Request.create({
      user_id: userId,
      location_id: locationId,
      resource_category: resourceCategory,
      quantity_requested: quantityRequested,
      quantity_fulfilled: 0,
      priority,
      description: description || null,
      status: "PENDING",
      requested_at: new Date(),
      target_completion_date: targetCompletionTime,
    });

    // ========== LOG REQUEST CREATION ==========
    await db.ActionLog.create({
      entity_type: "Request",
      entity_id: request.id,
      action: "REQUEST_CREATED",
      actor_id: userId,
      metadata: {
        category: resourceCategory,
        priority,
        quantity: quantityRequested,
      },
    });

    // ========== AUTO-ALLOCATE IF HIGH/EMERGENCY PRIORITY ==========
    let allocationResult = null;

    if (["HIGH", "EMERGENCY"].includes(priority)) {
      allocationResult = await AllocationService.autoAllocateRequest(request);

      if (allocationResult.success) {
        // Reload request to get updated status
        await request.reload();

        return res.status(201).json({
          success: true,
          message: "Request created and auto-allocated",
          data: {
            request: request.toJSON(),
            allocation: allocationResult.allocation?.toJSON(),
            allocationDetails: allocationResult.message,
          },
        });
      } else {
        // Auto-allocation failed, but request is created - return PENDING status
        return res.status(201).json({
          success: true,
          message: "Request created but auto-allocation failed",
          data: {
            request: request.toJSON(),
            allocationError: allocationResult.error,
          },
          warning: `No resources available: ${allocationResult.error}. Request is PENDING allocation.`,
        });
      }
    }

    // ========== RESPONSE FOR NORMAL PRIORITY ==========
    return res.status(201).json({
      success: true,
      message: "Request created successfully",
      data: {
        request: request.toJSON(),
        nextStep: "Waiting for operator allocation",
      },
    });
  } catch (error) {
    console.error("Error in createRequest:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create request",
      code: "REQUEST_ERROR",
    });
  }
};

/**
 * GET MY REQUESTS
 * Citizen views their own requests with allocation status
 */
const getMyRequests = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const requests = await db.Request.findAll({
      where: { user_id: userId },
      include: [
        {
          model: db.Location,
          attributes: ["zone_name", "latitude", "longitude"],
        },
        {
          model: db.ResourceAllocation,
          attributes: [
            "id",
            "resource_id",
            "status",
            "distance_km",
            "allocated_at",
          ],
          include: [
            {
              model: db.Resource,
              attributes: ["name", "code", "latitude", "longitude"],
            },
          ],
        },
      ],
      order: [["requested_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Error in getMyRequests:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch requests",
      code: "FETCH_ERROR",
    });
  }
};

/**
 * GET REQUEST BY ID
 * Citizen views a specific request
 */
const getRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { requestId } = req.params;

    const request = await db.Request.findByPk(requestId, {
      include: [
        {
          model: db.Location,
          attributes: ["zone_name", "latitude", "longitude"],
        },
        {
          model: db.ResourceAllocation,
          include: [
            {
              model: db.Resource,
              attributes: ["name", "code", "latitude", "longitude"],
            },
          ],
        },
        {
          model: db.User,
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
        code: "NOT_FOUND",
      });
    }

    // Verify ownership (citizen can only see own requests)
    if (request.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "You cannot view other users' requests",
        code: "FORBIDDEN",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Error in getRequest:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch request",
      code: "FETCH_ERROR",
    });
  }
};

/**
 * CANCEL REQUEST
 * Citizen can cancel PENDING requests
 * Cannot cancel APPROVED (already allocated) or FULFILLED requests
 */
const cancelRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await db.Request.findByPk(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
        code: "NOT_FOUND",
      });
    }

    // Verify ownership
    if (request.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "You cannot cancel other users' requests",
        code: "FORBIDDEN",
      });
    }

    // Only PENDING requests can be cancelled
    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel ${request.status} request`,
        code: "INVALID_STATUS",
      });
    }

    // Update request status
    request.status = "REJECTED";
    request.rejected_at = new Date();
    request.rejection_reason = reason || "Cancelled by user";
    await request.save();

    // Log cancellation
    await db.ActionLog.create({
      entity_type: "Request",
      entity_id: request.id,
      action: "REQUEST_CANCELLED",
      actor_id: userId,
      metadata: { reason },
    });

    return res.status(200).json({
      success: true,
      message: "Request cancelled",
      data: request,
    });
  } catch (error) {
    console.error("Error in cancelRequest:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to cancel request",
      code: "CANCEL_ERROR",
    });
  }
};

/**
 * UPDATE REQUEST (for PENDING requests only)
 * Citizen can modify pending requests
 */
const updateRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { requestId } = req.params;
    const { quantity, priority, description } = req.body;

    const request = await db.Request.findByPk(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
        code: "NOT_FOUND",
      });
    }

    // Verify ownership
    if (request.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "You cannot modify other users' requests",
        code: "FORBIDDEN",
      });
    }

    // Only PENDING requests can be modified
    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        error: `Cannot modify ${request.status} request`,
        code: "INVALID_STATUS",
      });
    }

    // Update allowed fields
    if (quantity !== undefined && quantity >= 1) {
      request.quantity_requested = quantity;
    }

    if (
      priority !== undefined &&
      ["LOW", "MEDIUM", "HIGH", "EMERGENCY"].includes(priority)
    ) {
      request.priority = priority;
      // Recalculate target completion time
      request.target_completion_date =
        AllocationService.calculateTargetCompletionTime(priority);
    }

    if (description !== undefined) {
      request.description = description;
    }

    await request.save();

    // Log update
    await db.ActionLog.create({
      entity_type: "Request",
      entity_id: request.id,
      action: "REQUEST_UPDATED",
      actor_id: userId,
      metadata: { quantity, priority, description },
    });

    return res.status(200).json({
      success: true,
      message: "Request updated",
      data: request,
    });
  } catch (error) {
    console.error("Error in updateRequest:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update request",
      code: "UPDATE_ERROR",
    });
  }
};

/**
 * GET ALL PENDING REQUESTS
 * For operators to see requests awaiting allocation
 */
const getPendingRequests = async (req, res) => {
  try {
    const { priority, category, limit = 50, offset = 0 } = req.query;

    const where = { status: "PENDING" };

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.resource_category = category;
    }

    const requests = await db.Request.findAndCountAll({
      where,
      include: [
        {
          model: db.Location,
          attributes: ["zone_name", "latitude", "longitude"],
        },
        {
          model: db.User,
          attributes: ["id", "name", "email"],
        },
      ],
      order: [
        ["priority", "DESC"], // EMERGENCY first
        ["requested_at", "ASC"], // Then oldest first
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      success: true,
      data: requests.rows,
      pagination: {
        total: requests.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error in getPendingRequests:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch pending requests",
      code: "FETCH_ERROR",
    });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getRequest,
  cancelRequest,
  updateRequest,
  getPendingRequests,
};
