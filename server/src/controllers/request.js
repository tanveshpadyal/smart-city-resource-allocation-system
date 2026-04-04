/**
 * Request Controller (Complaint Management)
 * Handles citizen complaint creation and status tracking.
 */

const db = require("../models");
const { Sequelize } = require("sequelize");
const { Parser } = require("json2csv");
const {
  autoAssignComplaint,
  computeLocationBucket,
  findOpenBucketParent,
  ACTIVE_COMPLAINT_STATUSES,
  reassignComplaintAutomatically,
} = require("../services/complaintAssignment");
const { SLA_HOURS, updateSlaBreaches } = require("../services/slaService");
const {
  emitComplaintCreated,
  emitComplaintAssigned,
  emitComplaintStatusChanged,
} = require("../sockets");
const { Op } = Sequelize;

/**
 * CREATE COMPLAINT
 * Citizen creates a new complaint
 *
 * Flow:
 * 1. Validate input
 * 2. Create request in PENDING status
 * 3. Return complaint with ID
 */
const createRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const {
      complaint_category,
      priority,
      location_id,
      location,
      latitude,
      longitude,
      description,
      image,
    } = req.body;

    // ========== INPUT VALIDATION ==========
    if (!complaint_category) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: complaint_category",
        code: "MISSING_FIELDS",
      });
    }

    if (
      !["ROAD", "GARBAGE", "WATER", "LIGHT", "OTHER"].includes(
        complaint_category,
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid complaint_category. Must be one of: ROAD, GARBAGE, WATER, LIGHT, OTHER",
        code: "INVALID_CATEGORY",
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: description",
        code: "MISSING_FIELDS",
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: image",
        code: "MISSING_FIELDS",
      });
    }

    // ========== VERIFY OR CREATE LOCATION ==========
    let locationRecord = null;
    let locationPayload = null;

    if (location && typeof location === "object") {
      const lat = Number(location.lat);
      const lng = Number(location.lng);

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({
          success: false,
          error: "Invalid location coordinates",
          code: "INVALID_LOCATION",
        });
      }

      locationPayload = {
        area: location.area || "",
        address: location.address || "",
        pincode: location.pincode || "",
        lat,
        lng,
      };
    }

    if (location_id) {
      locationRecord = await db.Location.findByPk(location_id);
      if (!locationRecord) {
        return res.status(400).json({
          success: false,
          error: "Location does not exist",
          code: "LOCATION_NOT_FOUND",
        });
      }
    } else if (locationPayload) {
      const zoneName =
        locationPayload.area ||
        locationPayload.address ||
        `Complaint location - ${Date.now()}`;

      // Reuse existing zone records to avoid unique constraint failures on zone_name.
      locationRecord = await db.Location.findOne({
        where: { zone_name: zoneName },
      });

      if (!locationRecord) {
        locationRecord = await db.Location.create({
          zone_name: zoneName,
          latitude: locationPayload.lat,
          longitude: locationPayload.lng,
        });
      }
    } else if (latitude !== undefined && longitude !== undefined) {
      // Legacy coordinates support
      const zoneName = `Complaint location - ${Date.now()}`;
      locationRecord = await db.Location.create({
        zone_name: zoneName,
        latitude: Number(latitude),
        longitude: Number(longitude),
      });
      locationPayload = {
        area: "",
        address: "",
        pincode: "",
        lat: Number(latitude),
        lng: Number(longitude),
      };
    } else {
      return res.status(400).json({
        success: false,
        error:
          "Missing required location: provide location object, location_id, or coordinates",
        code: "MISSING_LOCATION",
      });
    }

    const normalizedPriority = ["LOW", "MEDIUM", "HIGH", "EMERGENCY"].includes(
      priority,
    )
      ? priority
      : "MEDIUM";

    const complaintArea = locationPayload?.area || locationRecord?.zone_name || "";
    const locationBucket = computeLocationBucket(
      complaint_category,
      locationPayload?.lat,
      locationPayload?.lng,
    );

    const transaction = await db.sequelize.transaction();
    let complaint;
    let autoAssignmentResult = null;
    let parentComplaintId = null;
    let assignmentNotificationPayload = null;

    try {
      const openBucketParent = await findOpenBucketParent(
        locationBucket,
        transaction,
      );
      if (openBucketParent) {
        parentComplaintId = openBucketParent.id;
      }

      autoAssignmentResult = await autoAssignComplaint({
        areaName: complaintArea,
        areaId: locationRecord?.id || null,
        complaintCoords: {
          lat: locationPayload?.lat ?? Number(locationRecord?.latitude ?? null),
          lng: locationPayload?.lng ?? Number(locationRecord?.longitude ?? null),
        },
        complaintPriority: normalizedPriority,
        transaction,
      });
      const isAutoAssigned = Boolean(autoAssignmentResult?.assigned);

      complaint = await db.Request.create(
        {
          user_id: userId,
          location_id: locationRecord?.id || null,
          location_data: locationPayload,
          complaint_category,
          priority: normalizedPriority,
          assigned_to: isAutoAssigned ? autoAssignmentResult.operator.id : null,
          description,
          image: image || null,
          slaBreached: false,
          status: isAutoAssigned ? "ASSIGNED" : "PENDING",
          requested_at: new Date(),
          assigned_at: isAutoAssigned ? new Date() : null,
          assignment_strategy: autoAssignmentResult?.strategy || "ESCALATED",
          assignment_score: autoAssignmentResult?.score ?? null,
          assignment_reason:
            autoAssignmentResult?.reason || "No available operator for this complaint",
          location_bucket: locationBucket,
          parent_complaint_id: parentComplaintId,
        },
        { transaction },
      );

      if (isAutoAssigned) {
        await db.User.update(
          { last_assigned_at: new Date() },
          { where: { id: autoAssignmentResult.operator.id }, transaction },
        );
        assignmentNotificationPayload = {
          complaint: {
            ...complaint.toJSON(),
            user_id: userId,
          },
          operator: autoAssignmentResult.operator,
          assignmentMethod: autoAssignmentResult?.strategy || "AUTO",
          triggeredBy: {
            userId,
            role: req.user?.role || "CITIZEN",
          },
        };
      }

      await transaction.commit();
    } catch (innerError) {
      await transaction.rollback();
      throw innerError;
    }

    if (assignmentNotificationPayload) {
      emitComplaintAssigned(assignmentNotificationPayload);
    }

    emitComplaintCreated({
      complaint: complaint.toJSON(),
    });

    // ========== LOG COMPLAINT CREATION ==========
    await db.ActionLog.create({
      entity_type: "Complaint",
      entity_id: complaint.id,
      action: "COMPLAINT_CREATED",
      actor_id: userId,
      metadata: {
        category: complaint_category,
        location_id: locationRecord?.id || null,
        location: locationPayload,
        auto_assigned: Boolean(autoAssignmentResult?.assigned),
        assigned_to: autoAssignmentResult?.operator?.id || null,
        assignment_strategy: complaint.assignment_strategy,
        assignment_reason: complaint.assignment_reason,
        assignment_score: complaint.assignment_score,
        parent_complaint_id: complaint.parent_complaint_id || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: autoAssignmentResult?.assigned
        ? "Complaint created and auto-assigned successfully"
        : "Complaint created successfully and is awaiting assignment",
      data: {
        ...complaint.toJSON(),
        auto_assigned: Boolean(autoAssignmentResult?.assigned),
        assigned_operator: autoAssignmentResult?.operator || null,
      },
    });
  } catch (error) {
    const validationDetails = Array.isArray(error?.errors)
      ? error.errors.map((e) => e.message).join("; ")
      : null;
    console.error(
      "Error in createRequest:",
      validationDetails || error.message,
    );
    return res.status(500).json({
      success: false,
      error: "Failed to create complaint",
      details: validationDetails || error.message,
      code: "REQUEST_ERROR",
    });
  }
};

/**
 * GET MY COMPLAINTS
 * Citizen views their own complaints with status
 */
const getMyRequests = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const complaints = await db.Request.findAll({
      where: { user_id: userId },
      include: [
        {
          model: db.Location,
          attributes: ["id", "zone_name", "latitude", "longitude"],
        },
        {
          model: db.User,
          as: "assignedOperator",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
      order: [["requested_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    console.error("Error in getMyRequests:", error.message);
    console.error("Error details:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch complaints",
      details: error.message,
      code: "FETCH_ERROR",
    });
  }
};

/**
 * GET COMPLAINT BY ID
 * Citizen views a specific complaint
 */
const getRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { requestId } = req.params;

    const complaint = await db.Request.findByPk(requestId, {
      include: [
        {
          model: db.Location,
          attributes: ["zone_name", "latitude", "longitude"],
        },
        {
          model: db.User,
          as: "assignedOperator",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
        code: "NOT_FOUND",
      });
    }

    // Verify ownership (citizen can only see own complaints)
    if (complaint.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "You cannot view other users' complaints",
        code: "FORBIDDEN",
      });
    }

    return res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Error in getRequest:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch complaint",
      code: "FETCH_ERROR",
    });
  }
};

/**
 * GET ALL PENDING COMPLAINTS
 * For admin to assign operators
 */
const getPendingRequests = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      category,
      operator,
      search,
      limit = 50,
      offset = 0,
    } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    } else {
      where.status = "PENDING";
    }

    if (category) {
      where.complaint_category = category;
    }

    if (operator) {
      where.assigned_to = operator;
    }

    if (startDate || endDate) {
      const range = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!Number.isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);
          range[Op.gte] = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          range[Op.lte] = end;
        }
      }
      if (Object.keys(range).length > 0) {
        where.requested_at = range;
      }
    }

    if (search) {
      where[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
        { complaint_category: { [Op.like]: `%${search}%` } },
      ];
    }

    const complaints = await db.Request.findAndCountAll({
      where,
      include: [
        {
          model: db.Location,
          attributes: ["zone_name", "latitude", "longitude"],
        },
        {
          model: db.User,
          as: "User",
          attributes: ["id", "name", "email"],
        },
        {
          model: db.User,
          as: "assignedOperator",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
      order: [["requested_at", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      success: true,
      data: complaints.rows,
      pagination: {
        total: complaints.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error in getPendingRequests:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch pending complaints",
      details: error.message,
      code: "FETCH_ERROR",
    });
  }
};

/**
 * GET OPERATOR'S ASSIGNED COMPLAINTS
 * Operator views only their assigned complaints
 */
const getAssignedComplaints = async (req, res) => {
  try {
    const operatorId = req.user?.userId;

    const complaints = await db.Request.findAll({
      where: {
        assigned_to: operatorId,
        status: ["ASSIGNED", "IN_PROGRESS"],
      },
      include: [
        {
          model: db.Location,
          attributes: ["zone_name", "latitude", "longitude"],
        },
        {
          model: db.User,
          as: "User",
          attributes: ["id", "name", "email"],
        },
        {
          model: db.User,
          as: "assignedOperator",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
      order: [["assigned_at", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    console.error("Error in getAssignedComplaints:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch assigned complaints",
      code: "FETCH_ERROR",
    });
  }
  };

/**
 * GET OPERATOR COMPLAINTS
 * Returns all complaints assigned to the current operator (all statuses)
 */
const getOperatorComplaints = async (req, res) => {
  try {
    const operatorId = req.user?.userId;

    const complaints = await db.Request.findAll({
      where: {
        assigned_to: operatorId,
      },
      include: [
        {
          model: db.Location,
          attributes: ["zone_name", "latitude", "longitude"],
        },
        {
          model: db.User,
          as: "User",
          attributes: ["id", "name", "email"],
        },
        {
          model: db.User,
          as: "assignedOperator",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
      order: [["assigned_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    console.error("Error in getOperatorComplaints:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch operator complaints",
      code: "FETCH_ERROR",
    });
  }
};

/**
 * UPDATE COMPLAINT STATUS (OPERATOR ONLY)
 * Allows assigned operator to move complaint to IN_PROGRESS
 */
const updateComplaintStatus = async (req, res) => {
  try {
    const operatorId = req.user?.userId;
    const { requestId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: status",
        code: "MISSING_FIELDS",
      });
    }

    const complaint = await db.Request.findByPk(requestId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
        code: "NOT_FOUND",
      });
    }

    if (complaint.assigned_to !== operatorId) {
      return res.status(403).json({
        success: false,
        error: "This complaint is not assigned to you",
        code: "FORBIDDEN",
      });
    }

    if (status !== "IN_PROGRESS") {
      return res.status(400).json({
        success: false,
        error: "Only IN_PROGRESS status is allowed here",
        code: "INVALID_STATUS",
      });
    }

    if (complaint.status !== "ASSIGNED") {
      return res.status(400).json({
        success: false,
        error: `Cannot move ${complaint.status} complaint to IN_PROGRESS`,
        code: "INVALID_STATUS",
      });
    }

    complaint.status = "IN_PROGRESS";
    complaint.started_at = new Date();
    await complaint.save();

    await db.ActionLog.create({
      entity_type: "Complaint",
      entity_id: complaint.id,
      action: "COMPLAINT_IN_PROGRESS",
      actor_id: operatorId,
    });

    emitComplaintStatusChanged({
      complaint: complaint.toJSON(),
      changedBy: {
        userId: operatorId,
        role: req.user?.role || "OPERATOR",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Complaint status updated",
      data: complaint.toJSON(),
    });
  } catch (error) {
    console.error("Error in updateComplaintStatus:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update complaint status",
      code: "STATUS_UPDATE_ERROR",
    });
  }
};

/**
 * ASSIGN COMPLAINT TO OPERATOR
 * Admin assigns complaint to an operator
 */
const assignComplaint = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { requestId } = req.params;
    const { operator_id } = req.body;

    if (!operator_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: "Missing required field: operator_id",
        code: "MISSING_FIELDS",
      });
    }

    const operator = await db.User.findOne({
      where: { id: operator_id },
      transaction,
      lock: transaction.LOCK.UPDATE,
      skipLocked: false,
    });

    if (
      !operator ||
      operator.role !== "OPERATOR" ||
      !operator.is_active ||
      !operator.isActive
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: "Operator not found or is inactive",
        code: "INVALID_OPERATOR",
      });
    }

    const complaint = await db.Request.findOne({
      where: { id: requestId },
      transaction,
      lock: transaction.LOCK.UPDATE,
      skipLocked: false,
    });

    if (!complaint) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
        code: "NOT_FOUND",
      });
    }

    if (!["PENDING", "ASSIGNED"].includes(complaint.status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: `Cannot assign ${complaint.status} complaint`,
        code: "INVALID_STATUS",
      });
    }

    const activeCount = await db.Request.count({
      where: {
        assigned_to: operator_id,
        status: { [Op.in]: ACTIVE_COMPLAINT_STATUSES },
      },
      transaction,
    });

    const capacity = Number(operator.max_active_complaints) || 10;
    if (activeCount >= capacity) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: `Contractor capacity reached (${activeCount}/${capacity})`,
        code: "CONTRACTOR_OVERLOADED",
      });
    }

    complaint.assigned_to = operator_id;
    complaint.status = "ASSIGNED";
    complaint.assigned_at = new Date();
    complaint.assignment_strategy = "MANUAL";
    complaint.assignment_score = activeCount / capacity;
    complaint.assignment_reason =
      `manual override by admin (closest/auto assignment overridden, load ${activeCount}/${capacity})`;
    await complaint.save({ transaction });

    await operator.update({ last_assigned_at: new Date() }, { transaction });

    await db.ActionLog.create(
      {
        entity_type: "Complaint",
        entity_id: complaint.id,
        action: "COMPLAINT_ASSIGNED",
        metadata: {
          actor_id: req.user?.userId,
          operator_id,
        },
      },
      { transaction },
    );

    await db.AdminActivityLog.create(
      {
        admin_id: req.user?.userId,
        action_type: "ASSIGN",
        entity_type: "Complaint",
        entity_id: complaint.id,
        metadata: { operator_id },
      },
      { transaction },
    );

    await transaction.commit();

    emitComplaintAssigned({
      complaint: complaint.toJSON(),
      operator: operator.toJSON(),
      assignmentMethod: "MANUAL",
      triggeredBy: {
        userId: req.user?.userId,
        role: req.user?.role || "ADMIN",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Complaint assigned to operator",
      data: complaint.toJSON(),
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error in assignComplaint:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to assign complaint",
      code: "ASSIGN_ERROR",
    });
  }
};

/**
 * REASSIGN COMPLAINT (ADMIN ONLY)
 * Attempts auto-reassignment for PENDING or ASSIGNED complaints
 */
const reassignComplaint = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { requestId } = req.params;
    const result = await reassignComplaintAutomatically(requestId, transaction);

    await db.AdminActivityLog.create(
      {
        admin_id: req.user?.userId,
        action_type: "REASSIGN",
        entity_type: "Complaint",
        entity_id: requestId,
        metadata: {
          reassigned: result.reassigned,
          assignment_reason: result.assignment?.reason || result.reason || null,
          assigned_to: result.assignment?.operator?.id || null,
        },
      },
      { transaction },
    );

    await transaction.commit();

    if (result.reassigned && result.complaint && result.assignment?.operator) {
      emitComplaintAssigned({
        complaint: result.complaint.toJSON(),
        operator: result.assignment.operator,
        assignmentMethod: result.assignment.strategy || "AUTO",
        triggeredBy: {
          userId: req.user?.userId,
          role: req.user?.role || "ADMIN",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: result.reassigned
        ? "Complaint re-assigned automatically"
        : "Complaint remains pending for admin review",
      data: result.complaint?.toJSON() || null,
      assignment: result.assignment || null,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error in reassignComplaint:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to reassign complaint",
      code: "REASSIGN_ERROR",
    });
  }
};

const startComplaintResolution = async (req, res) => {
  try {
    const operatorId = req.user?.userId;
    const { requestId } = req.params;

    const complaint = await db.Request.findByPk(requestId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
        code: "NOT_FOUND",
      });
    }

    // Verify operator is assigned
    if (complaint.assigned_to !== operatorId) {
      return res.status(403).json({
        success: false,
        error: "This complaint is not assigned to you",
        code: "FORBIDDEN",
      });
    }

    // Only ASSIGNED complaints can be started
    if (complaint.status !== "ASSIGNED") {
      return res.status(400).json({
        success: false,
        error: `Cannot start resolution for ${complaint.status} complaint`,
        code: "INVALID_STATUS",
      });
    }

    complaint.status = "IN_PROGRESS";
    complaint.started_at = new Date();
    await complaint.save();

    // Log action
    await db.ActionLog.create({
      entity_type: "Complaint",
      entity_id: complaint.id,
      action: "COMPLAINT_IN_PROGRESS",
      actor_id: operatorId,
    });

    emitComplaintStatusChanged({
      complaint: complaint.toJSON(),
      changedBy: {
        userId: operatorId,
        role: req.user?.role || "OPERATOR",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Complaint resolution started",
      data: complaint.toJSON(),
    });
  } catch (error) {
    console.error("Error in startComplaintResolution:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to start complaint resolution",
      code: "START_ERROR",
    });
  }
};

/**
 * RESOLVE COMPLAINT
 * Operator marks complaint as resolved with remarks
 */
const resolveComplaint = async (req, res) => {
  try {
    const operatorId = req.user?.userId;
    const { requestId } = req.params;
    const { operator_remark, note, image } = req.body;
    const resolutionNote = note || operator_remark;

    if (!resolutionNote) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: note",
        code: "MISSING_FIELDS",
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: image",
        code: "MISSING_FIELDS",
      });
    }

    const complaint = await db.Request.findByPk(requestId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
        code: "NOT_FOUND",
      });
    }

    // Verify operator
    if (complaint.assigned_to !== operatorId) {
      return res.status(403).json({
        success: false,
        error: "This complaint is not assigned to you",
        code: "FORBIDDEN",
      });
    }

    // Only IN_PROGRESS complaints can be resolved
    if (complaint.status !== "IN_PROGRESS") {
      return res.status(400).json({
        success: false,
        error: `Cannot resolve ${complaint.status} complaint`,
        code: "INVALID_STATUS",
      });
    }

    complaint.status = "RESOLVED";
    complaint.operator_remark = resolutionNote;
    complaint.resolved_at = new Date();
    complaint.metadata = {
      ...(complaint.metadata || {}),
      resolution: {
        note: resolutionNote,
        image: image || null,
        resolvedAt: complaint.resolved_at,
      },
    };
    await complaint.save();

    // Log resolution
    await db.ActionLog.create({
      entity_type: "Complaint",
      entity_id: complaint.id,
      action: "COMPLAINT_RESOLVED",
      actor_id: operatorId,
      metadata: { remark: resolutionNote },
    });

    emitComplaintStatusChanged({
      complaint: complaint.toJSON(),
      changedBy: {
        userId: operatorId,
        role: req.user?.role || "OPERATOR",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Complaint resolved successfully",
      data: complaint.toJSON(),
    });
  } catch (error) {
    console.error("Error in resolveComplaint:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to resolve complaint",
      code: "RESOLVE_ERROR",
    });
  }
};

/**
 * GET ALL COMPLAINTS (ADMIN ONLY)
 * Admin views all complaints
 */
const getAllComplaints = async (req, res) => {
  try {
    const {
      status,
      category,
      operator,
      startDate,
      endDate,
      search,
      limit = 50,
      offset = 0,
    } = req.query;

    const parsedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 50, 1), 200);
    const parsedOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);

    const where = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.complaint_category = category;
    }

    if (operator) {
      where.assigned_to = operator;
    }

    if (startDate || endDate) {
      where.requested_at = {};
      if (startDate) {
        where.requested_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.requested_at[Op.lte] = end;
      }
    }

    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      where[Op.or] = [
        { description: { [Op.iLike]: term } },
        { complaint_category: { [Op.iLike]: term } },
        db.sequelize.where(
          db.sequelize.cast(db.sequelize.col("Request.location_data"), "text"),
          { [Op.iLike]: term },
        ),
      ];
    }

    const complaints = await db.Request.findAndCountAll({
      where,
      include: [
        {
          model: db.Location,
          attributes: ["zone_name", "latitude", "longitude"],
        },
        {
          model: db.User,
          as: "User",
          attributes: ["id", "name", "email"],
        },
        {
          model: db.User,
          as: "assignedOperator",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
      order: [["requested_at", "DESC"]],
      limit: parsedLimit,
      offset: parsedOffset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      data: complaints.rows,
      pagination: {
        total: complaints.count,
        limit: parsedLimit,
        offset: parsedOffset,
      },
    });
  } catch (error) {
    console.error("Error in getAllComplaints:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch complaints",
      code: "FETCH_ERROR",
    });
  }
};

const getTimeStats = async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6);

    const dailyRecords = await db.Request.findAll({
      where: {
        requested_at: {
          [Op.gte]: startDate,
        },
      },
      attributes: ["requested_at"],
    });

    const resolvedRecords = await db.Request.findAll({
      where: {
        resolved_at: {
          [Op.ne]: null,
          [Op.gte]: startDate,
        },
      },
      attributes: ["requested_at", "resolved_at"],
    });

    const pendingRecords = await db.Request.findAll({
      where: { status: "PENDING" },
      attributes: ["requested_at"],
    });

    const dayBuckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return date;
    });

    const formatDateKey = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const dailyCounts = dayBuckets.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      const count = dailyRecords.filter(
        (record) =>
          record.requested_at >= day && record.requested_at < nextDay,
      ).length;
      return { date: formatDateKey(day), count };
    });

    const avgResolutionTime = dayBuckets.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      const resolvedToday = resolvedRecords.filter(
        (record) =>
          record.resolved_at >= day && record.resolved_at < nextDay,
      );

      if (resolvedToday.length === 0) {
        return { date: formatDateKey(day), avgHours: 0 };
      }

      const totalHours = resolvedToday.reduce((sum, record) => {
        const hours =
          (record.resolved_at.getTime() - record.requested_at.getTime()) /
          (1000 * 60 * 60);
        return sum + hours;
      }, 0);

      return {
        date: formatDateKey(day),
        avgHours: Number((totalHours / resolvedToday.length).toFixed(2)),
      };
    });

    const agingBuckets = pendingRecords.reduce(
      (acc, record) => {
        const ageHours =
          (now.getTime() - record.requested_at.getTime()) / (1000 * 60 * 60);
        if (ageHours < 24) {
          acc.lt24h += 1;
        } else if (ageHours <= 72) {
          acc.between1And3Days += 1;
        } else {
          acc.gt3Days += 1;
        }
        return acc;
      },
      { lt24h: 0, between1And3Days: 0, gt3Days: 0 },
    );

    return res.status(200).json({
      success: true,
      dailyCounts,
      avgResolutionTime,
      agingBuckets,
    });
  } catch (error) {
    console.error("Error in getTimeStats:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch analytics stats",
      code: "STATS_ERROR",
    });
  }
};

/**
 * GET OPERATOR PERFORMANCE (ADMIN ONLY)
 * Returns aggregated operator performance stats
 */
const getOperatorPerformance = async (req, res) => {
  try {
    const complaints = await db.Request.findAll({
      where: {
        assigned_to: {
          [Op.ne]: null,
        },
      },
      attributes: [
        "assigned_to",
        "requested_at",
        "resolved_at",
        "status",
      ],
      include: [
        {
          model: db.User,
          as: "assignedOperator",
          attributes: ["id", "name", "email"],
          required: true,
        },
      ],
    });

    const performanceMap = new Map();

    complaints.forEach((complaint) => {
      const operator = complaint.assignedOperator;
      if (!operator) return;

      if (!performanceMap.has(operator.id)) {
        performanceMap.set(operator.id, {
          operatorId: operator.id,
          name: operator.name,
          email: operator.email,
          totalAssigned: 0,
          resolvedCount: 0,
          totalResolutionHours: 0,
        });
      }

      const stats = performanceMap.get(operator.id);
      stats.totalAssigned += 1;

      if (complaint.status === "RESOLVED" && complaint.resolved_at) {
        stats.resolvedCount += 1;
        const hours =
          (complaint.resolved_at.getTime() -
            complaint.requested_at.getTime()) /
          (1000 * 60 * 60);
        stats.totalResolutionHours += hours;
      }
    });

    const performance = Array.from(performanceMap.values()).map((stats) => ({
      operatorId: stats.operatorId,
      name: stats.name,
      email: stats.email,
      totalAssigned: stats.totalAssigned,
      resolvedCount: stats.resolvedCount,
      avgResolutionHours:
        stats.resolvedCount > 0
          ? Number(
              (stats.totalResolutionHours / stats.resolvedCount).toFixed(2),
            )
          : 0,
    }));

    return res.status(200).json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error("Error in getOperatorPerformance:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch operator performance",
      code: "OPERATOR_PERFORMANCE_ERROR",
    });
  }
};

/**
 * GET ADMIN ANALYTICS (ADMIN ONLY)
 * Returns daily, category, and status aggregates for dashboard charts
 */
const getAdminAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6);

    const formatDateKey = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const dayBuckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return date;
    });

    const recentRequests = await db.Request.findAll({
      where: {
        requested_at: {
          [Op.gte]: startDate,
        },
      },
      attributes: ["requested_at"],
    });

    const dailyCounts = dayBuckets.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      const count = recentRequests.filter(
        (item) => item.requested_at >= day && item.requested_at < nextDay,
      ).length;
      return { date: formatDateKey(day), count };
    });

    const categoryRows = await db.Request.findAll({
      attributes: [
        "complaint_category",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      group: ["complaint_category"],
      raw: true,
    });

    const categoryStats = categoryRows.map((row) => ({
      category: row.complaint_category,
      count: Number(row.count) || 0,
    }));

    const statusRows = await db.Request.findAll({
      attributes: [
        "status",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    const statusStats = statusRows.map((row) => ({
      status: row.status,
      count: Number(row.count) || 0,
    }));

    return res.status(200).json({
      success: true,
      dailyCounts,
      categoryStats,
      statusStats,
    });
  } catch (error) {
    console.error("Error in getAdminAnalytics:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch admin analytics",
      code: "ADMIN_ANALYTICS_ERROR",
    });
  }
};

/**
 * GET COMPLAINT TIMELINE (AUTHENTICATED)
 * Returns complaint timeline events with timestamps
 */
const getComplaintTimeline = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const { requestId } = req.params;

      const complaint = await db.Request.findByPk(requestId, {
        include: [
          {
            model: db.User,
            as: "assignedOperator",
            attributes: ["id", "name", "email"],
            required: false,
          },
          {
            model: db.User,
            as: "User",
            attributes: ["id", "name", "email"],
            required: false,
          },
          {
            model: db.Location,
            attributes: ["zone_name", "latitude", "longitude"],
            required: false,
          },
        ],
      });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
        code: "NOT_FOUND",
      });
    }

    const isOwner = complaint.user_id === userId;
    const isAssignedOperator = complaint.assigned_to === userId;

    if (
      role !== "ADMIN" &&
      !isOwner &&
      !isAssignedOperator
    ) {
      return res.status(403).json({
        success: false,
        error: "You do not have access to this complaint",
        code: "FORBIDDEN",
      });
    }

    const timeline = [
      {
        type: "CREATED",
        timestamp: complaint.requested_at,
      },
      complaint.assigned_at && {
        type: "ASSIGNED",
        timestamp: complaint.assigned_at,
      },
      complaint.started_at && {
        type: "IN_PROGRESS",
        timestamp: complaint.started_at,
      },
      complaint.resolved_at && {
        type: "RESOLVED",
        timestamp: complaint.resolved_at,
      },
    ].filter(Boolean);

      return res.status(200).json({
        success: true,
        data: {
          complaint: {
            id: complaint.id,
            complaint_category: complaint.complaint_category,
            priority: complaint.priority,
            description: complaint.description,
            status: complaint.status,
            assignment_strategy: complaint.assignment_strategy,
            assignment_score: complaint.assignment_score,
            assignment_reason: complaint.assignment_reason,
            assignedOperator: complaint.assignedOperator,
            citizen: complaint.User,
            requested_at: complaint.requested_at,
            assigned_at: complaint.assigned_at,
            started_at: complaint.started_at,
            resolved_at: complaint.resolved_at,
            image: complaint.image,
            operator_remark: complaint.operator_remark,
            location: {
              area: complaint.location_data?.area || complaint.Location?.zone_name,
              address: complaint.location_data?.address || "",
              pincode: complaint.location_data?.pincode || "",
              lat:
                complaint.location_data?.lat ??
                complaint.Location?.latitude ??
                null,
              lng:
                complaint.location_data?.lng ??
                complaint.Location?.longitude ??
                null,
            },
          },
          timeline,
        },
      });
  } catch (error) {
    console.error("Error in getComplaintTimeline:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch complaint timeline",
      code: "TIMELINE_ERROR",
    });
  }
};

/**
 * GET OVERDUE COMPLAINTS (ADMIN ONLY)
 * Returns complaints pending beyond SLA threshold (default: 48 hours)
 */
const getOverdueComplaints = async (req, res) => {
  try {
    await updateSlaBreaches();

    const complaints = await db.Request.findAll({
      where: {
        status: {
          [Op.ne]: "RESOLVED",
        },
        slaBreached: true,
      },
      include: [
        {
          model: db.Location,
          attributes: ["zone_name", "latitude", "longitude"],
        },
        {
          model: db.User,
          as: "User",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: complaints,
      thresholdHours: SLA_HOURS,
    });
  } catch (error) {
    console.error("Error in getOverdueComplaints:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch overdue complaints",
      code: "OVERDUE_FETCH_ERROR",
    });
  }
};

/**
 * EXPORT COMPLAINTS (ADMIN ONLY)
 * Returns CSV file for all or pending complaints
 */
const exportComplaints = async (req, res) => {
  try {
    const type = (req.query.type || "all").toLowerCase();
    const where = {};

    if (type === "pending") {
      where.status = "PENDING";
    }

    const complaints = await db.Request.findAll({
      where,
      include: [
        {
          model: db.User,
          as: "User",
          attributes: ["id", "name", "email"],
        },
        {
          model: db.User,
          as: "assignedOperator",
          attributes: ["id", "name", "email"],
          required: false,
        },
        {
          model: db.Location,
          attributes: ["zone_name", "latitude", "longitude"],
        },
      ],
      order: [["requested_at", "DESC"]],
    });

    const rows = complaints.map((complaint) => ({
      id: complaint.id,
      category: complaint.complaint_category,
      status: complaint.status,
      description: complaint.description || "",
      requested_at: complaint.requested_at,
      assigned_at: complaint.assigned_at,
      started_at: complaint.started_at,
      resolved_at: complaint.resolved_at,
      reporter_name: complaint.User?.name || "",
      reporter_email: complaint.User?.email || "",
      operator_name: complaint.assignedOperator?.name || "",
      operator_email: complaint.assignedOperator?.email || "",
      location_area: complaint.location_data?.area || "",
      location_address: complaint.location_data?.address || "",
      location_pincode: complaint.location_data?.pincode || "",
      location_lat: complaint.location_data?.lat || complaint.Location?.latitude || "",
      location_lng: complaint.location_data?.lng || complaint.Location?.longitude || "",
    }));

    const fields = [
      "id",
      "category",
      "status",
      "description",
      "requested_at",
      "assigned_at",
      "started_at",
      "resolved_at",
      "reporter_name",
      "reporter_email",
      "operator_name",
      "operator_email",
      "location_area",
      "location_address",
      "location_pincode",
      "location_lat",
      "location_lng",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(rows);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `complaints_${type}_${timestamp}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await db.AdminActivityLog.create({
      admin_id: req.user?.userId,
      action_type: "EXPORT",
      entity_type: "Complaint",
      metadata: { type, count: complaints.length },
    });
    return res.status(200).send(csv);
  } catch (error) {
    console.error("Error in exportComplaints:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to export complaints",
      code: "EXPORT_ERROR",
    });
  }
};

/**
 * GET ADMIN LOCATIONS (ADMIN ONLY)
 * Returns complaints with valid lat/lng for map views
 */
const getAdminLocations = async (req, res) => {
  try {
    const complaints = await db.Request.findAll({
      where: {
        location_data: {
          [Op.ne]: null,
        },
      },
      attributes: [
        "id",
        "description",
        "status",
        "complaint_category",
        "location_data",
      ],
      order: [["requested_at", "DESC"]],
    });

    const locations = complaints
      .map((complaint) => ({
        _id: complaint.id,
        title: complaint.description || "Complaint",
        status: complaint.status,
        category: complaint.complaint_category,
        location: {
          lat: complaint.location_data?.lat,
          lng: complaint.location_data?.lng,
          area: complaint.location_data?.area || "",
        },
      }))
      .filter(
        (item) =>
          typeof item.location.lat === "number" &&
          typeof item.location.lng === "number" &&
          !Number.isNaN(item.location.lat) &&
          !Number.isNaN(item.location.lng),
      );

    return res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error("Error in getAdminLocations:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch admin locations",
      code: "ADMIN_LOCATIONS_ERROR",
    });
  }
};

/**
 * GET AREA OPTIONS (AUTHENTICATED)
 * Returns active city area names for complaint forms
 */
const getAreaOptions = async (req, res) => {
  try {
    const locations = await db.Location.findAll({
      where: { is_active: true },
      attributes: ["id", "zone_name", "latitude", "longitude"],
      order: [["zone_name", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error("Error in getAreaOptions:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch area options",
      code: "AREA_OPTIONS_FETCH_ERROR",
    });
  }
};

/**
 * GET ADMIN AREAS (ADMIN ONLY)
 * Returns configured city areas from Location master
 */
const getAdminAreas = async (req, res) => {
  try {
    const locations = await db.Location.findAll({
      where: { is_active: true },
      attributes: ["id", "zone_name", "zone_code", "latitude", "longitude"],
      order: [["zone_name", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error("Error in getAdminAreas:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch city areas",
      code: "ADMIN_AREAS_FETCH_ERROR",
    });
  }
};

/**
 * CREATE ADMIN AREA (ADMIN ONLY)
 * Adds a new city area to Location master
 */
const createAdminArea = async (req, res) => {
  try {
    const { areaName, latitude, longitude } = req.body;

    const normalizedName = typeof areaName === "string" ? areaName.trim() : "";
    if (!normalizedName) {
      return res.status(400).json({
        success: false,
        error: "Area name is required",
        code: "AREA_NAME_REQUIRED",
      });
    }

    const existing = await db.Location.findOne({
      where: {
        zone_name: { [Op.iLike]: normalizedName },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Area already exists",
        code: "AREA_EXISTS",
      });
    }

    const lat =
      latitude === undefined || latitude === null || latitude === ""
        ? 18.5204
        : Number(latitude);
    const lng =
      longitude === undefined || longitude === null || longitude === ""
        ? 73.8567
        : Number(longitude);

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        error: "Invalid latitude",
        code: "INVALID_LATITUDE",
      });
    }

    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        error: "Invalid longitude",
        code: "INVALID_LONGITUDE",
      });
    }

    const area = await db.Location.create({
      zone_name: normalizedName,
      zone_code: `AR-${Date.now().toString().slice(-6)}`,
      latitude: lat,
      longitude: lng,
      is_active: true,
    });

    return res.status(201).json({
      success: true,
      message: "City area added successfully",
      data: area,
    });
  } catch (error) {
    console.error("Error in createAdminArea:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to add city area",
      code: "ADMIN_AREA_CREATE_ERROR",
    });
  }
};

/**
 * GET CONTRACTOR WORKLOAD SUMMARY (ADMIN ONLY)
 */
const getContractorWorkloadSummary = async (req, res) => {
  try {
    const contractors = await db.User.findAll({
      where: {
        role: "OPERATOR",
        status: "active",
        is_active: true,
      },
      attributes: [
        "id",
        "name",
        "email",
        "isActive",
        "max_active_complaints",
        "last_assigned_at",
      ],
      order: [["name", "ASC"]],
    });

    const contractorIds = contractors.map((c) => c.id);
    const loadRows = contractorIds.length
      ? await db.Request.findAll({
          where: {
            assigned_to: { [Op.in]: contractorIds },
            status: { [Op.in]: ACTIVE_COMPLAINT_STATUSES },
          },
          attributes: [
            "assigned_to",
            [db.sequelize.fn("COUNT", db.sequelize.col("id")), "activeCount"],
          ],
          group: ["assigned_to"],
          raw: true,
        })
      : [];

    const loadMap = new Map(
      loadRows.map((row) => [row.assigned_to, Number(row.activeCount) || 0]),
    );

    const data = contractors.map((contractor) => {
      const activeCount = loadMap.get(contractor.id) || 0;
      const capacity = Number(contractor.max_active_complaints) || 10;
      return {
        id: contractor.id,
        name: contractor.name,
        email: contractor.email,
        available: Boolean(contractor.isActive),
        activeCount,
        capacity,
        utilization: Number((activeCount / capacity).toFixed(4)),
        lastAssignedAt: contractor.last_assigned_at,
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in getContractorWorkloadSummary:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch contractor workload summary",
      code: "WORKLOAD_FETCH_ERROR",
    });
  }
};

/**
 * GET UNASSIGNED COMPLAINT QUEUE (ADMIN ONLY)
 */
const getUnassignedQueue = async (req, res) => {
  try {
    const complaints = await db.Request.findAll({
      where: {
        status: "PENDING",
        assigned_to: null,
      },
      include: [
        {
          model: db.Location,
          attributes: ["id", "zone_name"],
          required: false,
        },
        {
          model: db.User,
          as: "assignedOperator",
          attributes: ["id", "name"],
          required: false,
        },
      ],
      order: [["requested_at", "ASC"]],
      limit: 200,
    });

    return res.status(200).json({
      success: true,
      data: complaints.map((item) => ({
        ...item.toJSON(),
        dispatch_reason: item.assignment_reason || "No available contractor for this area",
      })),
    });
  } catch (error) {
    console.error("Error in getUnassignedQueue:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch unassigned queue",
      code: "UNASSIGNED_QUEUE_ERROR",
    });
  }
};

// ============ EXPORTS ============
module.exports = {
  // Citizen operations
  createRequest,
  getMyRequests,
  getRequest,

  // Admin operations
  getPendingRequests,
  getAllComplaints,
  getTimeStats,
  getOperatorPerformance,
  getAdminAnalytics,
  assignComplaint,
  reassignComplaint,
  getComplaintTimeline,
  getOverdueComplaints,
  exportComplaints,
  getAdminLocations,
  getAreaOptions,
  getAdminAreas,
  createAdminArea,
  getContractorWorkloadSummary,
  getUnassignedQueue,

  // Operator operations
  getAssignedComplaints,
  getOperatorComplaints,
  startComplaintResolution,
  updateComplaintStatus,
  resolveComplaint,
};
