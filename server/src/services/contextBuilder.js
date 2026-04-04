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
  imageAttached: Boolean(complaint.image),
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

const countByField = (items, getValue, seed = {}) =>
  items.reduce((acc, item) => {
    const key = getValue(item);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, { ...seed });

const summarizeAreas = (items, limit = 5) =>
  Object.entries(
    countByField(items, (item) => item.location_data?.area || item.Location?.zone_name),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([area, count]) => ({ area, count }));

const summarizeCategories = (items) =>
  countByField(items, (item) => item.complaint_category, {
    ROAD: 0,
    GARBAGE: 0,
    WATER: 0,
    LIGHT: 0,
    OTHER: 0,
  });

const summarizePriorities = (items) =>
  countByField(items, (item) => item.priority, {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    EMERGENCY: 0,
  });

const buildComplaintHighlights = (items, limit = 5) =>
  items.slice(0, limit).map((item) => ({
    id: item.id,
    category: item.complaint_category,
    status: item.status,
    priority: item.priority,
    area: item.location_data?.area || item.Location?.zone_name || null,
    requestedAt: item.requested_at,
    description: item.description,
  }));

const buildCitizenContext = async (userId) => {
  const [user, complaints] = await Promise.all([
    db.User.findByPk(userId, {
      attributes: ["id", "name", "email", "role", "createdAt"],
    }),
    db.Request.findAll({
      where: { user_id: userId },
      attributes: complaintAttributes,
      include: complaintInclude,
      order: [["requested_at", "DESC"]],
      limit: 25,
    }),
  ]);

  const openComplaints = complaints.filter((item) => item.status !== "RESOLVED");

  return {
    scope: "citizen",
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          memberSince: user.createdAt,
        }
      : null,
    summary: {
      totalComplaints: complaints.length,
      openComplaints: openComplaints.length,
      statusCounts: countByStatus(complaints),
      categoryCounts: summarizeCategories(complaints),
      priorityCounts: summarizePriorities(complaints),
      topAreas: summarizeAreas(complaints, 3),
    },
    recentComplaints: buildComplaintHighlights(complaints, 5),
    openComplaintDetails: openComplaints.slice(0, 10).map(mapComplaint),
    complaints: complaints.map(mapComplaint),
  };
};

const buildOperatorContext = async (userId) => {
  const [user, complaints] = await Promise.all([
    db.User.findByPk(userId, {
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "max_active_complaints",
        "isActive",
        "assignedAreas",
      ],
    }),
    db.Request.findAll({
      where: { assigned_to: userId },
      attributes: complaintAttributes,
      include: complaintInclude,
      order: [["assigned_at", "DESC"]],
      limit: 40,
    }),
  ]);

  const activeComplaints = complaints.filter((item) =>
    ["ASSIGNED", "IN_PROGRESS"].includes(item.status),
  );
  const resolvedComplaints = complaints.filter((item) => item.status === "RESOLVED");

  return {
    scope: "operator",
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          available: Boolean(user.isActive),
          maxActiveComplaints: user.max_active_complaints,
          assignedAreas: user.assignedAreas || [],
        }
      : null,
    summary: {
      totalAssignedComplaints: complaints.length,
      activeComplaints: activeComplaints.length,
      resolvedComplaints: resolvedComplaints.length,
      statusCounts: countByStatus(complaints),
      categoryCounts: summarizeCategories(complaints),
      priorityCounts: summarizePriorities(complaints),
      topAreas: summarizeAreas(complaints, 5),
    },
    currentQueue: activeComplaints.map(mapComplaint),
    recentResolvedComplaints: resolvedComplaints.slice(0, 5).map(mapComplaint),
    complaints: complaints.map(mapComplaint),
  };
};

const buildAdminContext = async () => {
  const [statusRows, recentComplaints, operatorRows, overdueCount, userRoleRows, allLocations, categoryRows] =
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
      db.User.findAll({
        attributes: [
          "role",
          [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
        ],
        group: ["role"],
        raw: true,
      }),
      db.Location.findAll({
        where: { is_active: true },
        attributes: ["id", "zone_name", "city_region"],
        order: [["zone_name", "ASC"]],
      }),
      db.Request.findAll({
        attributes: [
          "complaint_category",
          [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
        ],
        group: ["complaint_category"],
        raw: true,
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

  const userCounts = {
    totalUsers: 0,
    admins: 0,
    operators: 0,
    citizens: 0,
  };

  userRoleRows.forEach((row) => {
    const count = Number(row.count) || 0;
    userCounts.totalUsers += count;

    if (row.role === "ADMIN") {
      userCounts.admins = count;
    }

    if (row.role === "OPERATOR") {
      userCounts.operators = count;
    }

    if (row.role === "CITIZEN") {
      userCounts.citizens = count;
    }
  });

  const categoryCounts = {
    ROAD: 0,
    GARBAGE: 0,
    WATER: 0,
    LIGHT: 0,
    OTHER: 0,
  };

  categoryRows.forEach((row) => {
    categoryCounts[row.complaint_category] = Number(row.count) || 0;
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

  const openComplaints = recentComplaints.filter((item) => item.status !== "RESOLVED");

  return {
    scope: "admin",
    summary: {
      totalComplaints:
        statusCounts.PENDING +
        statusCounts.ASSIGNED +
        statusCounts.IN_PROGRESS +
        statusCounts.RESOLVED,
      statusCounts,
      categoryCounts,
      overdueOpenComplaints: overdueCount,
      userCounts,
      totalActiveAreas: allLocations.length,
    },
    quickFacts: {
      pendingComplaints: statusCounts.PENDING,
      assignedComplaints: statusCounts.ASSIGNED,
      inProgressComplaints: statusCounts.IN_PROGRESS,
      resolvedComplaints: statusCounts.RESOLVED,
      activeOperators: userCounts.operators,
    },
    activeAreas: allLocations.slice(0, 20).map((location) => ({
      id: location.id,
      name: location.zone_name,
      region: location.city_region || null,
    })),
    recentComplaints: recentComplaints.map(mapComplaint),
    openComplaintHighlights: buildComplaintHighlights(openComplaints, 10),
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
