const { Op } = require("sequelize");
const db = require("../models");

const complaintAttributes = [
  "id",
  "complaint_category",
  "description",
  "status",
  "priority",
  "requested_at",
  "assigned_at",
  "started_at",
  "resolved_at",
  "assignment_reason",
  "operator_remark",
];

const complaintInclude = [
  {
    model: db.Location,
    attributes: ["id", "zone_name"],
    required: false,
  },
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
];

const mapComplaint = (complaint) => ({
  id: complaint.id,
  category: complaint.complaint_category,
  description: complaint.description,
  status: complaint.status,
  priority: complaint.priority,
  requestedAt: complaint.requested_at,
  assignedAt: complaint.assigned_at,
  startedAt: complaint.started_at,
  resolvedAt: complaint.resolved_at,
  assignmentReason: complaint.assignment_reason,
  operatorRemark: complaint.operator_remark,
  area: complaint.location_data?.area || complaint.Location?.zone_name || null,
  assignedOperator: complaint.assignedOperator
    ? {
        id: complaint.assignedOperator.id,
        name: complaint.assignedOperator.name,
        email: complaint.assignedOperator.email,
      }
    : null,
  citizen: complaint.User
    ? {
        id: complaint.User.id,
        name: complaint.User.name,
        email: complaint.User.email,
      }
    : null,
});

const countByStatus = (items) =>
  items.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {
      PENDING: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
    },
  );

const buildCitizenContext = async (userId) => {
  const complaints = await db.Request.findAll({
    where: { user_id: userId },
    attributes: complaintAttributes,
    include: complaintInclude,
    order: [["requested_at", "DESC"]],
    limit: 20,
  });

  return {
    scope: "citizen",
    summary: {
      totalComplaints: complaints.length,
      statusCounts: countByStatus(complaints),
    },
    complaints: complaints.map(mapComplaint),
  };
};

const buildOperatorContext = async (userId) => {
  const complaints = await db.Request.findAll({
    where: { assigned_to: userId },
    attributes: complaintAttributes,
    include: complaintInclude,
    order: [["assigned_at", "DESC"]],
    limit: 30,
  });

  const activeComplaints = complaints.filter((item) =>
    ["ASSIGNED", "IN_PROGRESS"].includes(item.status),
  );

  return {
    scope: "operator",
    summary: {
      totalAssignedComplaints: complaints.length,
      activeComplaints: activeComplaints.length,
      statusCounts: countByStatus(complaints),
    },
    complaints: complaints.map(mapComplaint),
  };
};

const buildAdminContext = async () => {
  const [statusRows, recentComplaints, operatorRows, overdueCount] =
    await Promise.all([
      db.Request.findAll({
        attributes: [
          "status",
          [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
        ],
        group: ["status"],
        raw: true,
      }),
      db.Request.findAll({
        attributes: complaintAttributes,
        include: complaintInclude,
        order: [["requested_at", "DESC"]],
        limit: 20,
      }),
      db.User.findAll({
        where: {
          role: "OPERATOR",
          status: "active",
          is_active: true,
        },
        attributes: ["id", "name", "email", "isActive", "max_active_complaints"],
        order: [["name", "ASC"]],
      }),
      db.Request.count({
        where: {
          status: {
            [Op.ne]: "RESOLVED",
          },
          slaBreached: true,
        },
      }),
    ]);

  const statusCounts = {
    PENDING: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
  };

  statusRows.forEach((row) => {
    statusCounts[row.status] = Number(row.count) || 0;
  });

  const operatorIds = operatorRows.map((operator) => operator.id);
  const loadRows = operatorIds.length
    ? await db.Request.findAll({
        where: {
          assigned_to: { [Op.in]: operatorIds },
          status: { [Op.in]: ["ASSIGNED", "IN_PROGRESS"] },
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

  return {
    scope: "admin",
    summary: {
      totalComplaints:
        statusCounts.PENDING +
        statusCounts.ASSIGNED +
        statusCounts.IN_PROGRESS +
        statusCounts.RESOLVED,
      statusCounts,
      overdueOpenComplaints: overdueCount,
    },
    recentComplaints: recentComplaints.map(mapComplaint),
    operatorWorkload: operatorRows.map((operator) => {
      const activeCount = loadMap.get(operator.id) || 0;
      const capacity = operator.max_active_complaints || 0;

      return {
        id: operator.id,
        name: operator.name,
        email: operator.email,
        active: Boolean(operator.isActive),
        activeComplaints: activeCount,
        capacity,
        availableCapacity: Math.max(capacity - activeCount, 0),
      };
    }),
  };
};

const buildContext = async ({ userId, role }) => {
  if (role === "CITIZEN") {
    return buildCitizenContext(userId);
  }

  if (role === "OPERATOR") {
    return buildOperatorContext(userId);
  }

  if (role === "ADMIN") {
    return buildAdminContext();
  }

  throw new Error(`Unsupported role: ${role}`);
};

module.exports = {
  buildContext,
};
