const { Op } = require("sequelize");
const db = require("../models");

const ACTIVE_COMPLAINT_STATUSES = ["ASSIGNED", "IN_PROGRESS"];

const normalizeArea = (area = "") => area.trim().toLowerCase();

const sanitizeAreas = (areas = []) => {
  if (!Array.isArray(areas)) return [];
  const unique = new Set();
  for (const area of areas) {
    if (typeof area !== "string") continue;
    const normalized = normalizeArea(area);
    if (normalized) {
      unique.add(normalized);
    }
  }
  return Array.from(unique);
};

const assignComplaintByArea = async (area) => {
  const targetArea = normalizeArea(area);
  if (!targetArea) {
    return null;
  }

  const candidates = await db.User.findAll({
    where: {
      role: "OPERATOR",
      status: "active",
      is_active: true,
      isActive: true,
    },
    attributes: ["id", "name", "assignedAreas", "createdAt"],
  });

  const matchingOperators = candidates.filter((operator) => {
    const operatorAreas = sanitizeAreas(operator.assignedAreas);
    return operatorAreas.includes(targetArea);
  });

  if (matchingOperators.length === 0) {
    return null;
  }

  const operatorIds = matchingOperators.map((operator) => operator.id);
  const activeLoadRows = await db.Request.findAll({
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
  });

  const activeCounts = new Map(
    activeLoadRows.map((row) => [row.assigned_to, Number(row.activeCount) || 0]),
  );

  const rankedOperators = matchingOperators
    .map((operator) => ({
      id: operator.id,
      name: operator.name || "",
      activeCount: activeCounts.get(operator.id) || 0,
      createdAt: operator.createdAt,
    }))
    .sort((a, b) => {
      if (a.activeCount !== b.activeCount) {
        return a.activeCount - b.activeCount;
      }
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (timeA !== timeB) {
        return timeA - timeB; // Oldest operator first on tie
      }
      return a.id.localeCompare(b.id);
    });

  return rankedOperators[0] || null;
};

module.exports = {
  assignComplaintByArea,
  sanitizeAreas,
};
