const db = require("../models");
const { Sequelize } = require("sequelize");
const { Op } = Sequelize;

const ACTIVE_COMPLAINT_STATUSES = ["ASSIGNED", "IN_PROGRESS"];

/**
 * POST /api/admin/logs
 * Store admin activity log
 */
const createAdminLog = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { action_type, entity_type, entity_id, metadata } = req.body;

    if (!action_type) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: action_type",
        code: "MISSING_FIELDS",
      });
    }

    const log = await db.AdminActivityLog.create({
      admin_id: adminId,
      action_type,
      entity_type: entity_type || null,
      entity_id: entity_id || null,
      metadata: metadata || {},
    });

    return res.status(201).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("Error in createAdminLog:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create admin log",
      code: "ADMIN_LOG_CREATE_ERROR",
    });
  }
};

/**
 * GET /api/admin/logs
 * List admin logs with pagination and filters
 */
const getAdminLogs = async (req, res) => {
  try {
    const { actionType, startDate, endDate, limit = 50, offset = 0 } = req.query;
    const where = {};

    if (actionType) {
      where.action_type = actionType;
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
        where.createdAt = range;
      }
    }

    const logs = await db.AdminActivityLog.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: "admin",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      success: true,
      data: logs.rows,
      pagination: {
        total: logs.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error in getAdminLogs:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch admin logs",
      code: "ADMIN_LOG_FETCH_ERROR",
    });
  }
};

/**
 * GET /api/admin/operator-workload
 * Returns active workload count per operator
 */
const getOperatorWorkload = async (req, res) => {
  try {
    const operators = await db.User.findAll({
      where: {
        role: "OPERATOR",
        status: "active",
        is_active: true,
        isActive: true,
      },
      attributes: ["id", "name", "createdAt"],
      order: [["createdAt", "ASC"]],
      raw: true,
    });

    const operatorIds = operators.map((operator) => operator.id);
    const counts = operatorIds.length
      ? await db.Request.findAll({
          where: {
            assigned_to: { [Op.in]: operatorIds },
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

    const countMap = new Map(
      counts.map((row) => [row.assigned_to, Number(row.activeCount) || 0]),
    );

    const workload = operators.map((operator) => ({
      operatorId: operator.id,
      name: operator.name,
      activeCount: countMap.get(operator.id) || 0,
    }));

    return res.status(200).json({
      success: true,
      data: workload,
    });
  } catch (error) {
    console.error("Error in getOperatorWorkload:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch operator workload",
      code: "OPERATOR_WORKLOAD_FETCH_ERROR",
    });
  }
};

module.exports = {
  createAdminLog,
  getAdminLogs,
  getOperatorWorkload,
};
