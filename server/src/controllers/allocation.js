/**
 * Allocation Controller
 * Handles resource allocation management by operators
 * Covers manual allocation, cancellation, delivery tracking
 */

const db = require("../models");
const AllocationService = require("../services/AllocationService");
const { Op } = require("sequelize");

const REQUEST_TO_RESOURCE_CATEGORY = {
  WATER: ["WATER"],
  MEDICAL: ["MEDICAL", "OTHER"],
  FOOD: ["OTHER"],
  FUEL: ["TRANSPORT", "OTHER"],
  PARKING: ["TRANSPORT", "OTHER"],
  EQUIPMENT: ["OTHER"],
  OTHER: ["OTHER"],
  ELECTRICITY: ["ELECTRICITY"],
  TRANSPORT: ["TRANSPORT"],
};

const isResourceCategoryCompatible = (requestCategory, resourceCategory) => {
  const allowed = REQUEST_TO_RESOURCE_CATEGORY[requestCategory] || [
    requestCategory,
  ];
  return allowed.includes(resourceCategory);
};

const REQUEST_SAFE_ATTRIBUTES = [
  "id",
  "user_id",
  "location_id",
  "resource_category",
  "quantity_requested",
  "quantity_fulfilled",
  "priority",
  "description",
  "status",
  "requested_at",
  "approved_at",
  "fulfilled_at",
  "rejected_at",
  "rejection_reason",
  "target_completion_date",
  "metadata",
  "createdAt",
  "updatedAt",
];

const isMissingProviderServiceColumnError = (error) =>
  String(error?.message || "")
    .toLowerCase()
    .includes("provider_service_id");

const findRequestByPkSafe = async (requestId, extraOptions = {}) => {
  try {
    return await db.Request.findByPk(requestId, extraOptions);
  } catch (error) {
    if (!isMissingProviderServiceColumnError(error)) {
      throw error;
    }
    return await db.Request.findByPk(requestId, {
      ...extraOptions,
      attributes: REQUEST_SAFE_ATTRIBUTES,
    });
  }
};

/**
 * MANUAL ALLOCATE
 * Operator manually assigns a resource to a request
 *
 * Business Logic:
 * 1. Verify request exists and is PENDING
 * 2. Verify resource exists and is ACTIVE
 * 3. Check resource category matches request
 * 4. Execute allocation transaction
 * 5. Log operator action
 */
const manualAllocate = async (req, res) => {
  try {
    const operatorId = req.user?.userId;
    const { requestId, resourceId } = req.body;

    // ========== INPUT VALIDATION ==========
    if (!requestId || !resourceId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: requestId, resourceId",
        code: "MISSING_FIELDS",
      });
    }

    // ========== VERIFY REQUEST EXISTS ==========
    const request = await findRequestByPkSafe(requestId, {
      include: [db.Location],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
        code: "REQUEST_NOT_FOUND",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        error: `Cannot allocate ${request.status} request`,
        code: "INVALID_REQUEST_STATUS",
      });
    }

    // ========== VERIFY RESOURCE EXISTS ==========
    const resource = await db.Resource.findByPk(resourceId);

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "Resource not found",
        code: "RESOURCE_NOT_FOUND",
      });
    }

    if (resource.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        error: `Resource is ${resource.status}, not available for allocation`,
        code: "RESOURCE_UNAVAILABLE",
      });
    }

    // ========== VERIFY CATEGORY MATCH ==========
    if (
      !isResourceCategoryCompatible(request.resource_category, resource.category)
    ) {
      return res.status(400).json({
        success: false,
        error: `Resource category (${resource.category}) does not match request (${request.resource_category})`,
        code: "CATEGORY_MISMATCH",
      });
    }

    // ========== EXECUTE ALLOCATION ==========
    const allocationResult = await AllocationService.manuallyAllocateResource(
      requestId,
      resourceId,
      operatorId,
    );

    if (!allocationResult.success) {
      return res.status(400).json({
        success: false,
        error: allocationResult.error,
        code: "ALLOCATION_FAILED",
      });
    }

    // ========== LOG OPERATOR ACTION ==========
    await db.ActionLog.create({
      entity_type: "ResourceAllocation",
      entity_id: allocationResult.allocation.id,
      action: "MANUAL_ALLOCATION",
      actor_id: operatorId,
      metadata: {
        request_id: requestId,
        resource_id: resourceId,
        quantity: request.quantity_requested,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Resource allocated successfully",
      data: {
        allocation: allocationResult.allocation,
        message: allocationResult.message,
      },
    });
  } catch (error) {
    console.error("Error in manualAllocate:", error);
    return res.status(500).json({
      success: false,
      error: "Allocation failed",
      code: "ALLOCATION_ERROR",
    });
  }
};

/**
 * AUTO ALLOCATE
 * Operator triggers automatic allocation for a PENDING request
 * System finds best resource based on distance and availability
 */
const autoAllocate = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await findRequestByPkSafe(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
        code: "REQUEST_NOT_FOUND",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        error: `Cannot allocate ${request.status} request`,
        code: "INVALID_REQUEST_STATUS",
      });
    }

    // ========== ATTEMPT AUTO-ALLOCATION ==========
    const allocationResult =
      await AllocationService.autoAllocateRequest(request);

    if (!allocationResult.success) {
      return res.status(400).json({
        success: false,
        error: allocationResult.error,
        code: "NO_RESOURCES_AVAILABLE",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Automatic allocation successful",
      data: {
        allocation: allocationResult.allocation,
        details: allocationResult.message,
      },
    });
  } catch (error) {
    console.error("Error in autoAllocate:", error);
    return res.status(500).json({
      success: false,
      error: `Auto-allocation failed: ${error.message}`,
      details: error.stack,
      code: "AUTO_ALLOCATION_ERROR",
    });
  }
};

/**
 * SUGGEST RESOURCES
 * For a PENDING request, show operator the best available resources
 * Helps operator make informed manual allocation decisions
 */
const suggestResources = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { limit = 5 } = req.query;

    const request = await findRequestByPkSafe(requestId, {
      include: [db.Location],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
        code: "REQUEST_NOT_FOUND",
      });
    }

    // Find best resource (all candidates)
    const bestResult = await AllocationService.findBestResource(request);

    if (!bestResult.success) {
      return res.status(400).json({
        success: false,
        error: bestResult.reason,
        code: "NO_RESOURCES_FOUND",
      });
    }

    // Get multiple candidates sorted by distance
    const targetCategories =
      REQUEST_TO_RESOURCE_CATEGORY[request.resource_category] || [
        request.resource_category,
      ];

    const candidates = await db.Resource.findAll({
      where: {
        category: { [Op.in]: targetCategories },
        status: "ACTIVE",
        quantity_available: {
          [db.sequelize.Sequelize.Op.gte]: request.quantity_requested,
        },
      },
      order: [["allocation_priority", "DESC"]],
    });

    // Calculate distance and sort
    const requestLoc = request.Location;
    const suggestions = candidates
      .map((resource) => {
        const distance = AllocationService.calculateDistance(
          parseFloat(requestLoc.latitude),
          parseFloat(requestLoc.longitude),
          parseFloat(resource.latitude),
          parseFloat(resource.longitude),
        );

        return {
          resource,
          resource_id: resource.id,
          name: resource.name,
          code: resource.code,
          category: resource.category,
          quantity_available: resource.quantity_available,
          distance_km: distance,
          travel_time_minutes: AllocationService.estimateTravelTime(distance),
          priority_score: resource.allocation_priority,
          is_best_match: resource.id === bestResult.resource.id,
        };
      })
      .filter((s) => s.distance_km <= s.resource.max_distance_km)
      .map(({ resource, ...rest }) => rest)
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        request_id: requestId,
        quantity_needed: request.quantity_requested,
        suggestions,
      },
    });
  } catch (error) {
    console.error("Error in suggestResources:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to suggest resources",
      code: "SUGGESTION_ERROR",
    });
  }
};

/**
 * GET ALLOCATION
 * View details of a specific allocation
 */
const getAllocation = async (req, res) => {
  try {
    const { allocationId } = req.params;

    const allocation = await db.ResourceAllocation.findByPk(allocationId, {
      include: [
        {
          model: db.Request,
          include: [{ model: db.User, attributes: ["name", "email"] }],
        },
        {
          model: db.Resource,
          attributes: ["name", "code", "category", "latitude", "longitude"],
        },
        {
          model: db.User,
          as: "allocator",
          attributes: ["name", "email"],
        },
      ],
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        error: "Allocation not found",
        code: "NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      data: allocation,
    });
  } catch (error) {
    console.error("Error in getAllocation:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch allocation",
      code: "FETCH_ERROR",
    });
  }
};

/**
 * CANCEL ALLOCATION
 * Operator cancels an existing allocation and frees resources
 */
const cancelAllocation = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const { reason } = req.body;

    const allocation = await db.ResourceAllocation.findByPk(allocationId);

    if (!allocation) {
      return res.status(404).json({
        success: false,
        error: "Allocation not found",
        code: "NOT_FOUND",
      });
    }

    // Cannot cancel delivered allocations
    if (allocation.status === "DELIVERED") {
      return res.status(400).json({
        success: false,
        error: "Cannot cancel delivered allocation",
        code: "ALREADY_DELIVERED",
      });
    }

    // Execute cancellation
    const result = await AllocationService.cancelAllocation(
      allocationId,
      reason,
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: "CANCELLATION_FAILED",
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error in cancelAllocation:", error);
    return res.status(500).json({
      success: false,
      error: "Cancellation failed",
      code: "CANCEL_ERROR",
    });
  }
};

/**
 * MARK AS IN TRANSIT
 * Operator marks allocation as dispatched and in transit
 */
const markInTransit = async (req, res) => {
  try {
    const { allocationId } = req.params;

    const allocation = await db.ResourceAllocation.findByPk(allocationId);

    if (!allocation) {
      return res.status(404).json({
        success: false,
        error: "Allocation not found",
        code: "NOT_FOUND",
      });
    }

    if (allocation.status !== "ALLOCATED") {
      return res.status(400).json({
        success: false,
        error: `Cannot mark ${allocation.status} allocation as in-transit`,
        code: "INVALID_STATUS",
      });
    }

    allocation.status = "IN_TRANSIT";
    await allocation.save();

    // Log status change
    await db.ActionLog.create({
      entity_type: "ResourceAllocation",
      entity_id: allocation.id,
      action: "MARKED_IN_TRANSIT",
      metadata: { status_change: "ALLOCATED -> IN_TRANSIT" },
    });

    return res.status(200).json({
      success: true,
      message: "Allocation marked as in-transit",
      data: allocation,
    });
  } catch (error) {
    console.error("Error in markInTransit:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update status",
      code: "STATUS_UPDATE_ERROR",
    });
  }
};

/**
 * MARK AS DELIVERED
 * Operator marks allocation as delivered to the requestor
 * Completes the allocation transaction
 */
const markDelivered = async (req, res) => {
  try {
    const { allocationId } = req.params;

    const result =
      await AllocationService.markAllocationDelivered(allocationId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: "DELIVERY_FAILED",
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error in markDelivered:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to mark as delivered",
      code: "DELIVERY_ERROR",
    });
  }
};

/**
 * GET ALLOCATIONS
 * View all allocations with filtering
 */
const getAllocations = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const allocationOrderColumn = db.ResourceAllocation.rawAttributes.allocated_at
      ? "allocated_at"
      : "createdAt";

    const where = {};
    if (status) {
      where.status = status;
    }

    let allocations;
    try {
      allocations = await db.ResourceAllocation.findAndCountAll({
        where,
        include: [
          {
            model: db.Request,
            attributes: ["id", "priority", "resource_category"],
            include: [
              {
                model: db.User,
                attributes: ["name", "email"],
              },
            ],
          },
          {
            model: db.Resource,
            attributes: ["name", "code", "category"],
          },
        ],
        order: [[allocationOrderColumn, "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    } catch (includeError) {
      console.error(
        "getAllocations include query failed, using fallback:",
        includeError.message,
      );
      allocations = await db.ResourceAllocation.findAndCountAll({
        where,
        attributes: [
          "id",
          "request_id",
          "resource_id",
          "status",
          "allocated_at",
          "createdAt",
        ],
        order: [[allocationOrderColumn, "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    }

    return res.status(200).json({
      success: true,
      data: allocations.rows,
      pagination: {
        total: allocations.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error in getAllocations:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch allocations",
      details: error.message,
      code: "FETCH_ERROR",
    });
  }
};

module.exports = {
  manualAllocate,
  autoAllocate,
  suggestResources,
  getAllocation,
  cancelAllocation,
  markInTransit,
  markDelivered,
  getAllocations,
};
