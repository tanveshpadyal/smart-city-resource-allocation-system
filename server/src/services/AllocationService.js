/**
 * Resource Allocation Service
 * Core business logic for matching requests to resources
 *
 * RESPONSIBILITIES:
 * - Find suitable resources based on distance and availability
 * - Handle priority-based allocation
 * - Manage allocation transactions
 * - Calculate distance between locations
 * - Determine SLA target completion times
 */

const db = require("../models");
const sequelize = require("../config/database");

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
 * Calculate distance between two geographic points (Haversine formula)
 * Returns distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

/**
 * Estimate travel time based on distance and road conditions
 * Simplified model: 1 km = 2 minutes (urban average)
 */
const estimateTravelTime = (distanceKm) => {
  return Math.ceil(distanceKm * 2);
};

/**
 * Calculate SLA target completion time based on priority
 * EMERGENCY: 30 minutes
 * HIGH: 2 hours
 * MEDIUM: 24 hours
 * LOW: 72 hours
 */
const calculateTargetCompletionTime = (priority) => {
  const now = new Date();
  const delays = {
    EMERGENCY: 30 * 60 * 1000, // 30 minutes
    HIGH: 2 * 60 * 60 * 1000, // 2 hours
    MEDIUM: 24 * 60 * 60 * 1000, // 24 hours
    LOW: 72 * 60 * 60 * 1000, // 72 hours
  };

  return new Date(now.getTime() + (delays[priority] || delays.MEDIUM));
};

/**
 * CORE ALLOCATION LOGIC
 * Find best resource for a request
 *
 * Algorithm:
 * 1. Get request location coordinates
 * 2. Find all ACTIVE resources in the same category
 * 3. Filter by: available quantity, within max distance
 * 4. Sort by: distance (closest first), allocation_priority (higher first)
 * 5. Select first result that has sufficient quantity
 *
 * @returns { resource, distance, travelTime, reason }
 */
const findBestResource = async (request) => {
  try {
    // Get request location
    const requestLocation = await db.Location.findByPk(request.location_id);
    if (!requestLocation) {
      return {
        success: false,
        reason: "Request location not found",
      };
    }

    // Map request categories to resource categories for compatibility.
    const targetCategories =
      REQUEST_TO_RESOURCE_CATEGORY[request.resource_category] || [
        request.resource_category,
      ];

    // Get all active resources in compatible categories
    const availableResources = await db.Resource.findAll({
      where: {
        category: {
          [db.sequelize.Sequelize.Op.in]: targetCategories,
        },
        status: "ACTIVE",
        // Must have at least the required quantity available
        quantity_available: {
          [db.sequelize.Sequelize.Op.gte]: request.quantity_requested,
        },
      },
      order: [
        // Sort by allocation priority (descending)
        ["allocation_priority", "DESC"],
      ],
    });

    if (availableResources.length === 0) {
      return {
        success: false,
        reason: `No active resources available for category ${request.resource_category}`,
      };
    }

    // Calculate distances and filter by max_distance_km
    const resourcesWithDistance = availableResources
      .map((resource) => {
        const distance = calculateDistance(
          parseFloat(requestLocation.latitude),
          parseFloat(requestLocation.longitude),
          parseFloat(resource.latitude),
          parseFloat(resource.longitude),
        );

        return {
          resource,
          distance,
          travelTime: estimateTravelTime(distance),
          withinMaxDistance: distance <= resource.max_distance_km,
        };
      })
      .filter((item) => item.withinMaxDistance)
      .sort((a, b) => {
        // Sort by distance (closest first)
        return a.distance - b.distance;
      });

    if (resourcesWithDistance.length === 0) {
      return {
        success: false,
        reason: `No resources found within maximum distance limits`,
      };
    }

    // Select the best resource (closest)
    const best = resourcesWithDistance[0];

    return {
      success: true,
      resource: best.resource,
      distance: best.distance,
      travelTime: best.travelTime,
      reason: "Optimal resource selected",
    };
  } catch (error) {
    console.error("Error in findBestResource:", error);
    return {
      success: false,
      reason: `Error finding resource: ${error.message}`,
    };
  }
};

/**
 * ALLOCATION TRANSACTION
 * Atomically:
 * 1. Check resource availability
 * 2. Reserve quantity on resource
 * 3. Create allocation record
 * 4. Update request status
 * 5. Create action log
 *
 * @returns { success, allocation, error }
 */
const allocateResourceToRequest = async (
  request,
  resource,
  allocationMode = "AUTO",
  allocatedByUserId = null,
) => {
  const transaction = await sequelize.transaction();

  try {
    // STEP 1: Lock and re-check resource availability (prevent race conditions)
    const lockedResource = await db.Resource.findByPk(resource.id, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!lockedResource || lockedResource.status !== "ACTIVE") {
      await transaction.rollback();
      return {
        success: false,
        error: "Resource is no longer active",
      };
    }

    if (lockedResource.quantity_available < request.quantity_requested) {
      await transaction.rollback();
      return {
        success: false,
        error: `Insufficient quantity. Available: ${lockedResource.quantity_available}, Requested: ${request.quantity_requested}`,
      };
    }

    // STEP 2: Reserve quantity on resource
    lockedResource.quantity_reserved += request.quantity_requested;
    lockedResource.quantity_available -= request.quantity_requested;
    await lockedResource.save({ transaction });

    // STEP 3: Calculate distance and travel time
    const requestLocation = await db.Location.findByPk(request.location_id, {
      transaction,
    });
    const distance = calculateDistance(
      parseFloat(requestLocation.latitude),
      parseFloat(requestLocation.longitude),
      parseFloat(lockedResource.latitude),
      parseFloat(lockedResource.longitude),
    );
    const travelTime = estimateTravelTime(distance);

    // STEP 4: Create allocation record
    const allocation = await db.ResourceAllocation.create(
      {
        request_id: request.id,
        resource_id: resource.id,
        allocated_by: allocatedByUserId,
        quantity_allocated: request.quantity_requested,
        allocation_mode: allocationMode,
        distance_km: distance,
        travel_time_minutes: travelTime,
        status: "ALLOCATED",
        allocated_at: new Date(),
      },
      { transaction },
    );

    // STEP 5: Update request status to APPROVED
    request.approved_at = new Date();
    request.status = "APPROVED";
    request.quantity_fulfilled = request.quantity_requested;
    await request.save({ transaction });

    // STEP 6: Create audit log
    await db.ActionLog.create(
      {
        entity_type: "ResourceAllocation",
        entity_id: allocation.id,
        action: "ALLOCATION_CREATED",
        metadata: {
          allocation_mode: allocationMode,
          distance_km: distance,
          travel_time_minutes: travelTime,
          quantity: request.quantity_requested,
        },
      },
      { transaction },
    );

    // Commit transaction
    await transaction.commit();

    return {
      success: true,
      allocation,
      message: `Resource allocated successfully. Distance: ${distance}km, Est. Time: ${travelTime} mins`,
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Error in allocateResourceToRequest:", error);
    return {
      success: false,
      error: `Allocation failed: ${error.message}`,
    };
  }
};

/**
 * AUTO-ALLOCATION PROCESS
 * Triggered when a request is created with HIGH/EMERGENCY priority
 * or manually triggered by operators
 *
 * 1. Find best resource
 * 2. Attempt allocation
 * 3. Log result
 * 4. Handle failure gracefully
 */
const autoAllocateRequest = async (request) => {
  try {
    // Check if already allocated
    if (request.status === "APPROVED") {
      return {
        success: false,
        error: "Request already allocated",
      };
    }

    // Find best resource
    const findResult = await findBestResource(request);

    if (!findResult.success) {
      // Mark request as pending (no resources available yet)
      await request.update({
        status: "PENDING",
      });

      await db.ActionLog.create({
        entity_type: "Request",
        entity_id: request.id,
        action: "ALLOCATION_FAILED",
        metadata: {
          reason: findResult.reason,
          priority: request.priority,
        },
      });

      return {
        success: false,
        error: findResult.reason,
      };
    }

    // Attempt allocation
    const allocationResult = await allocateResourceToRequest(
      request,
      findResult.resource,
      "AUTO",
      null, // No specific operator for auto-allocation
    );

    return allocationResult;
  } catch (error) {
    console.error("Error in autoAllocateRequest:", error);
    return {
      success: false,
      error: `Auto-allocation error: ${error.message}`,
    };
  }
};

/**
 * MANUAL ALLOCATION
 * Operator manually allocates a specific resource to a request
 * Validates operator has permission and resource is available
 */
const manuallyAllocateResource = async (requestId, resourceId, operatorId) => {
  try {
    const request = await findRequestByPkSafe(requestId);
    if (!request) {
      return { success: false, error: "Request not found" };
    }

    if (request.status === "APPROVED") {
      return { success: false, error: "Request already allocated" };
    }

    const resource = await db.Resource.findByPk(resourceId);
    if (!resource) {
      return { success: false, error: "Resource not found" };
    }

    if (
      !isResourceCategoryCompatible(request.resource_category, resource.category)
    ) {
      return {
        success: false,
        error: "Resource category does not match request",
      };
    }

    // Attempt allocation with transaction
    return await allocateResourceToRequest(
      request,
      resource,
      "MANUAL",
      operatorId,
    );
  } catch (error) {
    console.error("Error in manuallyAllocateResource:", error);
    return {
      success: false,
      error: `Manual allocation error: ${error.message}`,
    };
  }
};

/**
 * CANCEL ALLOCATION
 * Atomically cancel an allocation and free up the resource
 */
const cancelAllocation = async (allocationId, reason = null) => {
  const transaction = await sequelize.transaction();

  try {
    const allocation = await db.ResourceAllocation.findByPk(allocationId, {
      transaction,
    });

    if (!allocation) {
      await transaction.rollback();
      return { success: false, error: "Allocation not found" };
    }

    if (allocation.status === "CANCELLED") {
      await transaction.rollback();
      return { success: false, error: "Allocation already cancelled" };
    }

    // Free up the resource
    const resource = await db.Resource.findByPk(allocation.resource_id, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    resource.quantity_reserved -= allocation.quantity_allocated;
    resource.quantity_available += allocation.quantity_allocated;
    await resource.save({ transaction });

    // Update allocation status
    allocation.status = "CANCELLED";
    allocation.cancelled_at = new Date();
    allocation.cancellation_reason = reason;
    await allocation.save({ transaction });

    // Revert request to PENDING
    const request = await findRequestByPkSafe(allocation.request_id, {
      transaction,
    });
    request.status = "PENDING";
    request.approved_at = null;
    request.quantity_fulfilled = 0;
    await request.save({ transaction });

    // Log cancellation
    await db.ActionLog.create(
      {
        entity_type: "ResourceAllocation",
        entity_id: allocation.id,
        action: "ALLOCATION_CANCELLED",
        metadata: {
          reason,
          quantity_freed: allocation.quantity_allocated,
        },
      },
      { transaction },
    );

    await transaction.commit();

    return {
      success: true,
      message: "Allocation cancelled and resource freed",
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Error in cancelAllocation:", error);
    return {
      success: false,
      error: `Cancellation failed: ${error.message}`,
    };
  }
};

/**
 * MARK ALLOCATION AS DELIVERED
 * Move to IN_TRANSIT → DELIVERED state
 */
const markAllocationDelivered = async (allocationId) => {
  const transaction = await sequelize.transaction();

  try {
    const allocation = await db.ResourceAllocation.findByPk(allocationId, {
      transaction,
    });

    if (!allocation) {
      await transaction.rollback();
      return { success: false, error: "Allocation not found" };
    }

    // Move from reserved to used
    const resource = await db.Resource.findByPk(allocation.resource_id, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    resource.quantity_reserved -= allocation.quantity_allocated;
    resource.quantity_used += allocation.quantity_allocated;
    await resource.save({ transaction });

    // Update allocation
    allocation.status = "DELIVERED";
    allocation.delivered_at = new Date();
    await allocation.save({ transaction });

    // Update request
    const request = await findRequestByPkSafe(allocation.request_id, {
      transaction,
    });
    request.status = "FULFILLED";
    request.fulfilled_at = new Date();
    await request.save({ transaction });

    // Log delivery
    await db.ActionLog.create(
      {
        entity_type: "ResourceAllocation",
        entity_id: allocation.id,
        action: "ALLOCATION_DELIVERED",
        metadata: {
          delivered_at: new Date(),
        },
      },
      { transaction },
    );

    await transaction.commit();

    return {
      success: true,
      message: "Allocation marked as delivered",
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Error in markAllocationDelivered:", error);
    return {
      success: false,
      error: `Delivery update failed: ${error.message}`,
    };
  }
};

module.exports = {
  // Utility functions
  calculateDistance,
  estimateTravelTime,
  calculateTargetCompletionTime,

  // Core allocation logic
  findBestResource,
  allocateResourceToRequest,
  autoAllocateRequest,
  manuallyAllocateResource,
  cancelAllocation,
  markAllocationDelivered,
};
