const { Op } = require("sequelize");
const db = require("../models");

const ACTIVE_COMPLAINT_STATUSES = ["ASSIGNED", "IN_PROGRESS"];
const REASSIGN_START_SLA_MINUTES = 30;
const MAX_NEARBY_AREA_CANDIDATES = 8;

const normalizeArea = (area = "") => String(area || "").trim().toLowerCase();

const sanitizeAreas = (areas = []) => {
  if (!Array.isArray(areas)) return [];
  const unique = new Set();
  for (const area of areas) {
    const normalized = normalizeArea(area);
    if (normalized) unique.add(normalized);
  }
  return Array.from(unique);
};

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  const coords = [lat1, lng1, lat2, lng2].map(Number);
  if (coords.some((value) => Number.isNaN(value))) {
    return Number.POSITIVE_INFINITY;
  }

  const [aLat, aLng, bLat, bLng] = coords;
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) *
      Math.cos(toRad(bLat)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return Number((earthRadiusKm * c).toFixed(2));
};

const getPriorityWeights = (priority = "MEDIUM") => {
  switch (priority) {
    case "EMERGENCY":
      return { distance: 0.7, workload: 0.2, fairness: 0.1 };
    case "HIGH":
      return { distance: 0.5, workload: 0.3, fairness: 0.2 };
    case "LOW":
    case "MEDIUM":
    default:
      return { distance: 0.3, workload: 0.5, fairness: 0.2 };
  }
};

const computeLocationBucket = (category, lat, lng) => {
  const day = new Date().toISOString().slice(0, 10);
  const latBucket = Number(lat).toFixed(3);
  const lngBucket = Number(lng).toFixed(3);
  return `${category || "OTHER"}:${latBucket}:${lngBucket}:${day}`;
};

const getAreaRecordByName = async (areaName, transaction) => {
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

const getComplaintCoordinates = ({
  locationPayload,
  locationRecord,
  latitude,
  longitude,
}) => {
  const lat =
    locationPayload?.lat ??
    locationRecord?.latitude ??
    (latitude !== undefined ? Number(latitude) : null);
  const lng =
    locationPayload?.lng ??
    locationRecord?.longitude ??
    (longitude !== undefined ? Number(longitude) : null);

  if (Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return { lat: null, lng: null };
  }

  return {
    lat: lat === null || lat === undefined ? null : Number(lat),
    lng: lng === null || lng === undefined ? null : Number(lng),
  };
};

const getAreaDistanceMap = async (complaintCoords, transaction) => {
  const { lat, lng } = complaintCoords || {};
  if (lat === null || lng === null) return new Map();

  const areas = await db.Location.findAll({
    where: { is_active: true },
    attributes: ["id", "zone_name", "latitude", "longitude"],
    transaction,
  });

  const entries = areas.map((area) => [
    area.id,
    {
      locationId: area.id,
      zoneName: area.zone_name,
      distanceKm: calculateDistanceKm(lat, lng, area.latitude, area.longitude),
    },
  ]);

  return new Map(entries);
};

const getExactAreaCandidates = async (areaId, transaction) => {
  if (!areaId) return [];

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
          "email",
          "max_active_complaints",
          "last_assigned_at",
          "isActive",
        ],
      },
    ],
    transaction,
  });
};

const getLegacyAreaCandidates = async (
  areaName,
  complaintCoords,
  distanceMap,
  transaction,
) => {
  const normalized = normalizeArea(areaName);
  if (!normalized) return [];

  const users = await db.User.findAll({
    where: {
      role: "OPERATOR",
      status: "active",
      is_active: true,
      isActive: true,
    },
    attributes: [
      "id",
      "name",
      "email",
      "assignedAreas",
      "max_active_complaints",
      "last_assigned_at",
    ],
    transaction,
  });

  return users
    .filter((user) => sanitizeAreas(user.assignedAreas).includes(normalized))
    .map((user) => ({
      priority: 100,
      is_primary: false,
      weight: 1,
      contractor: user,
      area: null,
      areaMatchType: "SAME_AREA",
      distanceKm:
        complaintCoords?.lat === null || complaintCoords?.lng === null
          ? 0
          : Math.min(
              ...sanitizeAreas(user.assignedAreas)
                .map((name) => {
                  const areaMatch = Array.from(distanceMap.values()).find(
                    (entry) => normalizeArea(entry.zoneName) === name,
                  );
                  return areaMatch ? areaMatch.distanceKm : Number.POSITIVE_INFINITY;
                })
                .filter((value) => Number.isFinite(value)),
              0,
            ),
    }));
};

const getNearbyAreaCandidates = async (
  areaId,
  complaintCoords,
  distanceMap,
  transaction,
) => {
  if (complaintCoords?.lat === null || complaintCoords?.lng === null) return [];

  const nearbyAreas = Array.from(distanceMap.values())
    .filter((entry) => entry.locationId !== areaId && Number.isFinite(entry.distanceKm))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_NEARBY_AREA_CANDIDATES);

  if (!nearbyAreas.length) return [];

  const nearbyIds = nearbyAreas.map((entry) => entry.locationId);
  const distanceByAreaId = new Map(
    nearbyAreas.map((entry) => [entry.locationId, entry.distanceKm]),
  );

  const mappings = await db.ContractorArea.findAll({
    where: { area_id: { [Op.in]: nearbyIds } },
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
          "email",
          "max_active_complaints",
          "last_assigned_at",
          "isActive",
        ],
      },
      {
        model: db.Location,
        as: "area",
        required: false,
        attributes: ["id", "zone_name", "latitude", "longitude"],
      },
    ],
    transaction,
  });

  return mappings.map((mapping) => ({
    ...mapping.toJSON(),
    contractor: mapping.contractor,
    area: mapping.area || null,
    areaMatchType: "NEARBY_AREA",
    distanceKm: distanceByAreaId.get(mapping.area_id) ?? Number.POSITIVE_INFINITY,
  }));
};

const getActiveCounts = async (operatorIds, transaction) => {
  if (!operatorIds.length) return new Map();

  const rows = await db.Request.findAll({
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
    transaction,
  });

  return new Map(
    rows.map((row) => [row.assigned_to, Number(row.activeCount) || 0]),
  );
};

const calculateScore = ({
  candidate,
  activeCount,
  complaintPriority,
}) => {
  const capacity = Math.max(
    1,
    Number(candidate.contractor.max_active_complaints) || 10,
  );
  const workloadRatio = activeCount / capacity;
  const distanceKm = Number(candidate.distanceKm);
  const normalizedDistance = Number.isFinite(distanceKm)
    ? Math.min(distanceKm / 25, 1)
    : 1;
  const fairnessFactor = candidate.contractor.last_assigned_at
    ? Math.min(
        (Date.now() - new Date(candidate.contractor.last_assigned_at).getTime()) /
          (1000 * 60 * 60 * 24),
        1,
      )
    : 1;

  const weights = getPriorityWeights(complaintPriority);
  const score =
    normalizedDistance * weights.distance +
    workloadRatio * weights.workload +
    (1 - fairnessFactor) * weights.fairness;

  return {
    operatorId: candidate.contractor.id,
    operatorName: candidate.contractor.name || "Operator",
    operatorEmail: candidate.contractor.email || "",
    capacity,
    activeCount,
    workloadRatio: Number(workloadRatio.toFixed(4)),
    distanceKm: Number.isFinite(distanceKm) ? distanceKm : null,
    areaMatchType: candidate.areaMatchType,
    areaName: candidate.area?.zone_name || null,
    priority: Number(candidate.priority) || 100,
    weight: Number(candidate.weight) || 1,
    lastAssignedAt: candidate.contractor.last_assigned_at || null,
    score: Number(score.toFixed(4)),
  };
};

const sortRankedCandidates = (a, b) => {
  if (a.score !== b.score) return a.score - b.score;
  if (a.areaMatchType !== b.areaMatchType) {
    return a.areaMatchType === "SAME_AREA" ? -1 : 1;
  }
  if (a.workloadRatio !== b.workloadRatio) return a.workloadRatio - b.workloadRatio;
  if ((a.distanceKm ?? Number.POSITIVE_INFINITY) !== (b.distanceKm ?? Number.POSITIVE_INFINITY)) {
    return (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
  }

  const aTs = a.lastAssignedAt ? new Date(a.lastAssignedAt).getTime() : 0;
  const bTs = b.lastAssignedAt ? new Date(b.lastAssignedAt).getTime() : 0;
  if (aTs !== bTs) return aTs - bTs;
  return a.operatorId.localeCompare(b.operatorId);
};

const buildAssignmentReason = (selected) => {
  const locationPart =
    selected.areaMatchType === "SAME_AREA"
      ? "same area"
      : `nearby area${selected.distanceKm !== null ? `, ${selected.distanceKm} km away` : ""}`;
  return `auto-assigned: ${locationPart}, load ${selected.activeCount}/${selected.capacity}, score ${selected.score}`;
};

const buildUnassignedReason = (details) => {
  if (!details.areaName && details.coordinatesMissing) {
    return "Auto-assignment skipped: complaint location is incomplete";
  }
  if (!details.areaName) {
    return "Auto-assignment skipped: complaint area could not be resolved";
  }
  if (details.sameAreaChecked && !details.sameAreaAvailable) {
    if (details.nearbyChecked && !details.nearbyAvailable) {
      return `No available operator in ${details.areaName} or nearby areas`;
    }
    return `No available operator in ${details.areaName}`;
  }
  return "No available operator for this complaint";
};

const lockOperatorAndRecheck = async (ranked, transaction) => {
  for (const candidate of ranked) {
    const operator = await db.User.findOne({
      where: {
        id: candidate.operatorId,
        role: "OPERATOR",
        status: "active",
        is_active: true,
        isActive: true,
      },
      attributes: ["id", "max_active_complaints", "last_assigned_at"],
      transaction,
      lock: transaction.LOCK.UPDATE,
      skipLocked: true,
    });

    if (!operator) continue;

    const latestActiveCount = await db.Request.count({
      where: {
        assigned_to: candidate.operatorId,
        status: { [Op.in]: ACTIVE_COMPLAINT_STATUSES },
      },
      transaction,
    });

    const capacity = Math.max(1, Number(operator.max_active_complaints) || 10);
    if (latestActiveCount >= capacity) {
      continue;
    }

    return {
      ...candidate,
      activeCount: latestActiveCount,
      capacity,
      workloadRatio: Number((latestActiveCount / capacity).toFixed(4)),
      score: Number(candidate.score.toFixed(4)),
    };
  }

  return null;
};

const getEligibleOperators = async ({
  areaName,
  areaId,
  complaintCoords,
  complaintPriority,
  transaction,
}) => {
  const details = {
    areaName: areaName || null,
    sameAreaChecked: false,
    sameAreaAvailable: false,
    nearbyChecked: false,
    nearbyAvailable: false,
    coordinatesMissing:
      complaintCoords?.lat === null || complaintCoords?.lng === null,
  };

  const areaDistanceMap = await getAreaDistanceMap(complaintCoords, transaction);

  let sameAreaCandidates = [];
  if (areaId) {
    details.sameAreaChecked = true;
    sameAreaCandidates = await getExactAreaCandidates(areaId, transaction);
  }
  if (!sameAreaCandidates.length && areaName) {
    details.sameAreaChecked = true;
    sameAreaCandidates = await getLegacyAreaCandidates(
      areaName,
      complaintCoords,
      areaDistanceMap,
      transaction,
    );
  }

  const sameAreaDecorated = sameAreaCandidates.map((candidate) => ({
    ...candidate,
    contractor: candidate.contractor,
    area: candidate.area || null,
    areaMatchType: "SAME_AREA",
    distanceKm:
      candidate.distanceKm ??
      (complaintCoords?.lat === null || complaintCoords?.lng === null
        ? 0
        : 0),
  }));

  let candidatePool = sameAreaDecorated;

  if (!candidatePool.length) {
    details.sameAreaAvailable = false;
    details.nearbyChecked = true;
    candidatePool = await getNearbyAreaCandidates(
      areaId,
      complaintCoords,
      areaDistanceMap,
      transaction,
    );
  } else {
    details.sameAreaAvailable = true;
  }

  if (candidatePool.length) {
    details.nearbyAvailable = candidatePool.some(
      (candidate) => candidate.areaMatchType === "NEARBY_AREA",
    );
  }

  const operatorIds = [...new Set(candidatePool.map((candidate) => candidate.contractor.id))];
  const activeCounts = await getActiveCounts(operatorIds, transaction);

  const ranked = candidatePool
    .map((candidate) =>
      calculateScore({
        candidate,
        activeCount: activeCounts.get(candidate.contractor.id) || 0,
        complaintPriority,
      }),
    )
    .filter((candidate) => candidate.activeCount < candidate.capacity)
    .sort(sortRankedCandidates);

  if (!ranked.length) {
    if (details.sameAreaChecked) details.sameAreaAvailable = false;
    if (details.nearbyChecked) details.nearbyAvailable = false;
  }

  return { ranked, details };
};

const autoAssignComplaint = async ({
  areaName,
  areaId,
  complaintCoords,
  complaintPriority,
  transaction,
}) => {
  const { ranked, details } = await getEligibleOperators({
    areaName,
    areaId,
    complaintCoords,
    complaintPriority,
    transaction,
  });

  if (!ranked.length) {
    return {
      assigned: false,
      strategy: "ESCALATED",
      score: null,
      reason: buildUnassignedReason(details),
      operator: null,
    };
  }

  const selected = await lockOperatorAndRecheck(ranked, transaction);
  if (!selected) {
    return {
      assigned: false,
      strategy: "ESCALATED",
      score: null,
      reason: "All eligible operators reached capacity during assignment",
      operator: null,
    };
  }

  return {
    assigned: true,
    strategy: "AUTO",
    score: selected.score,
    reason: buildAssignmentReason(selected),
    operator: {
      id: selected.operatorId,
      name: selected.operatorName,
      email: selected.operatorEmail,
    },
  };
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

const reassignComplaintAutomatically = async (requestId, transaction, options = {}) => {
  const complaint = await db.Request.findOne({
    where: { id: requestId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!complaint) {
    return { reassigned: false, reason: "Complaint not found" };
  }

  if (!["PENDING", "ASSIGNED"].includes(complaint.status)) {
    return {
      reassigned: false,
      reason: `Complaint cannot be re-assigned from ${complaint.status} state`,
    };
  }

  const areaName =
    complaint.location_data?.area ||
    complaint.location_data?.address ||
    "";
  const complaintCoords = getComplaintCoordinates({
    locationPayload: complaint.location_data,
    locationRecord: null,
  });
  const match = await autoAssignComplaint({
    areaName,
    areaId: complaint.location_id,
    complaintCoords,
    complaintPriority: complaint.priority,
    transaction,
  });

  complaint.assigned_to = match.assigned ? match.operator.id : null;
  complaint.status = match.assigned ? "ASSIGNED" : "PENDING";
  complaint.assigned_at = match.assigned ? new Date() : null;
  complaint.assignment_strategy = match.assigned ? "AUTO" : "ESCALATED";
  complaint.assignment_score = match.score;
  complaint.assignment_reason = match.reason;
  complaint.reassignment_cooldown_until = match.assigned
    ? new Date(Date.now() + 15 * 60 * 1000)
    : complaint.reassignment_cooldown_until;
  await complaint.save({ transaction });

  if (match.assigned) {
    await db.User.update(
      { last_assigned_at: new Date() },
      { where: { id: match.operator.id }, transaction },
    );
  }

  if (!options.skipAuditLog) {
    await db.ActionLog.create(
      {
        entity_type: "Complaint",
        entity_id: complaint.id,
        action: match.assigned ? "COMPLAINT_REASSIGNED_AUTO" : "COMPLAINT_REASSIGN_FAILED",
        metadata: {
          request_id: complaint.id,
          assigned_to: match.operator?.id || null,
          assignment_reason: match.reason,
          assignment_score: match.score,
        },
      },
      { transaction },
    );
  }

  return {
    reassigned: match.assigned,
    complaint,
    assignment: match,
  };
};

const reassignStaleComplaints = async () => {
  const cutoff = new Date(Date.now() - REASSIGN_START_SLA_MINUTES * 60 * 1000);
  const staleComplaints = await db.Request.findAll({
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

  for (const complaint of staleComplaints) {
    const transaction = await db.sequelize.transaction();
    try {
      const result = await reassignComplaintAutomatically(complaint.id, transaction, {
        skipAuditLog: false,
      });
      if (result.reassigned) {
        reassigned += 1;
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  return { reassigned, thresholdMinutes: REASSIGN_START_SLA_MINUTES };
};

module.exports = {
  ACTIVE_COMPLAINT_STATUSES,
  REASSIGN_START_SLA_MINUTES,
  autoAssignComplaint,
  computeLocationBucket,
  findOpenBucketParent,
  reassignComplaintAutomatically,
  reassignStaleComplaints,
  sanitizeAreas,
};
