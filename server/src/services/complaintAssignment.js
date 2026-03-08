const { Op } = require("sequelize");
const db = require("../models");

const ACTIVE_COMPLAINT_STATUSES = ["ASSIGNED", "IN_PROGRESS"];
const REASSIGN_START_SLA_MINUTES = 30;

const normalizeArea = (area = "") => area.trim().toLowerCase();

const sanitizeAreas = (areas = []) => {
  if (!Array.isArray(areas)) return [];
  const unique = new Set();
  for (const area of areas) {
    if (typeof area !== "string") continue;
    const normalized = normalizeArea(area);
    if (normalized) unique.add(normalized);
  }
  return Array.from(unique);
};

const getAreaRecord = async (areaName, transaction) => {
  const normalized = normalizeArea(areaName);
  if (!normalized) return null;
  return db.Location.findOne({
    where: db.sequelize.where(
      db.sequelize.fn("LOWER", db.sequelize.col("zone_name")),
      normalized,
    ),
    transaction,
  });
};

const getContractorAreaCandidates = async (areaId, transaction) => {
  return db.ContractorArea.findAll({
    where: { area_id: areaId },
    include: [
      {
        model: db.User,
        as: "contractor",
        required: true,
        where: {
          role: "OPERATOR",
          status: "active",
          is_active: true,
          isActive: true,
        },
        attributes: [
          "id",
          "name",
          "max_active_complaints",
          "last_assigned_at",
          "isActive",
        ],
      },
    ],
    transaction,
  });
};

const getLegacyAreaCandidates = async (areaName, transaction) => {
  const normalized = normalizeArea(areaName);
  if (!normalized) return [];
  const candidates = await db.User.findAll({
    where: {
      role: "OPERATOR",
      status: "active",
      is_active: true,
      isActive: true,
    },
    attributes: [
      "id",
      "name",
      "assignedAreas",
      "max_active_complaints",
      "last_assigned_at",
    ],
    transaction,
  });

  return candidates
    .filter((user) => sanitizeAreas(user.assignedAreas).includes(normalized))
    .map((user) => ({
      contractor: user,
      priority: 100,
      weight: 1,
    }));
};

const getActiveCounts = async (contractorIds, transaction) => {
  if (!contractorIds.length) return new Map();
  const rows = await db.Request.findAll({
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
    transaction,
  });

  return new Map(
    rows.map((row) => [row.assigned_to, Number(row.activeCount) || 0]),
  );
};

const scoreCandidate = (candidate, activeCount) => {
  const capacity = Number(candidate.contractor.max_active_complaints) || 10;
  const utilization = activeCount / capacity;
  return {
    contractorId: candidate.contractor.id,
    contractorName: candidate.contractor.name || "Contractor",
    priority: Number(candidate.priority) || 100,
    weight: Number(candidate.weight) || 1,
    activeCount,
    capacity,
    utilization,
    lastAssignedAt: candidate.contractor.last_assigned_at || null,
    score:
      utilization * 1000 +
      activeCount * 10 +
      (Number(candidate.priority) || 100) -
      (Number(candidate.weight) || 1),
  };
};

const sortRanked = (a, b) => {
  if (a.utilization !== b.utilization) return a.utilization - b.utilization;
  if (a.activeCount !== b.activeCount) return a.activeCount - b.activeCount;
  if (a.priority !== b.priority) return a.priority - b.priority;
  const aTs = a.lastAssignedAt ? new Date(a.lastAssignedAt).getTime() : 0;
  const bTs = b.lastAssignedAt ? new Date(b.lastAssignedAt).getTime() : 0;
  if (aTs !== bTs) return aTs - bTs;
  return a.contractorId.localeCompare(b.contractorId);
};

const findBestContractorForArea = async (areaName, transaction) => {
  const area = await getAreaRecord(areaName, transaction);
  if (!area) return null;

  let mappings = await getContractorAreaCandidates(area.id, transaction);
  if (!mappings.length) {
    mappings = await getLegacyAreaCandidates(areaName, transaction);
  }
  if (!mappings.length) return null;

  const contractorIds = mappings.map((m) => m.contractor.id);
  const activeCounts = await getActiveCounts(contractorIds, transaction);

  const ranked = mappings
    .map((mapping) =>
      scoreCandidate(
        mapping,
        activeCounts.get(mapping.contractor.id) || 0,
      ),
    )
    .filter((entry) => entry.activeCount < entry.capacity)
    .sort(sortRanked);

  if (!ranked.length) return null;
  return { area, selected: ranked[0], ranked };
};

const buildAssignmentReason = (selected) =>
  `lowest utilization (${selected.activeCount}/${selected.capacity}), area priority ${selected.priority}`;

const assignComplaintByArea = async (areaName, transaction) => {
  const match = await findBestContractorForArea(areaName, transaction);
  if (!match) return null;
  return {
    id: match.selected.contractorId,
    name: match.selected.contractorName,
    score: match.selected.score,
    reason: buildAssignmentReason(match.selected),
  };
};

const computeLocationBucket = (category, lat, lng) => {
  const day = new Date().toISOString().slice(0, 10);
  const latBucket = Number(lat).toFixed(3);
  const lngBucket = Number(lng).toFixed(3);
  return `${category || "OTHER"}:${latBucket}:${lngBucket}:${day}`;
};

const findOpenBucketParent = async (locationBucket, transaction) => {
  if (!locationBucket) return null;
  return db.Request.findOne({
    where: {
      location_bucket: locationBucket,
      status: { [Op.in]: ["PENDING", "ASSIGNED", "IN_PROGRESS"] },
    },
    order: [["createdAt", "ASC"]],
    transaction,
  });
};

const reassignStaleComplaints = async () => {
  const cutoff = new Date(Date.now() - REASSIGN_START_SLA_MINUTES * 60 * 1000);
  const stale = await db.Request.findAll({
    where: {
      status: "ASSIGNED",
      started_at: null,
      assigned_at: { [Op.lt]: cutoff },
      [Op.or]: [
        { reassignment_cooldown_until: null },
        { reassignment_cooldown_until: { [Op.lt]: new Date() } },
      ],
    },
    order: [["assigned_at", "ASC"]],
    limit: 50,
  });

  let reassigned = 0;
  for (const complaint of stale) {
    const area =
      complaint.location_data?.area || complaint.location_data?.address || "";
    const match = await findBestContractorForArea(area);
    if (!match) continue;
    if (match.selected.contractorId === complaint.assigned_to) continue;

    complaint.assigned_to = match.selected.contractorId;
    complaint.assignment_strategy = "ESCALATED";
    complaint.assignment_score = match.selected.score;
    complaint.assignment_reason = `reassigned: ${buildAssignmentReason(
      match.selected,
    )}`;
    complaint.assigned_at = new Date();
    complaint.reassignment_cooldown_until = new Date(
      Date.now() + 15 * 60 * 1000,
    );
    await complaint.save();

    await db.User.update(
      { last_assigned_at: new Date() },
      { where: { id: match.selected.contractorId } },
    );
    reassigned += 1;
  }

  return { reassigned, thresholdMinutes: REASSIGN_START_SLA_MINUTES };
};

module.exports = {
  ACTIVE_COMPLAINT_STATUSES,
  REASSIGN_START_SLA_MINUTES,
  assignComplaintByArea,
  computeLocationBucket,
  findOpenBucketParent,
  reassignStaleComplaints,
  sanitizeAreas,
};
