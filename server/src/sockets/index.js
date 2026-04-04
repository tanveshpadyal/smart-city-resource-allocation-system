const { Server } = require("socket.io");
const authUtils = require("../utils/auth");

let io = null;

const buildAllowedOrigins = () =>
  (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const buildComplaintPayload = (complaint, extras = {}) => ({
  complaintId: complaint.id,
  status: complaint.status,
  priority: complaint.priority,
  complaintCategory: complaint.complaint_category,
  assignmentStrategy: complaint.assignment_strategy || null,
  assignmentReason: complaint.assignment_reason || null,
  assignedTo: complaint.assigned_to || null,
  citizenId: complaint.user_id,
  requestedAt: complaint.requested_at || null,
  assignedAt: complaint.assigned_at || null,
  startedAt: complaint.started_at || null,
  resolvedAt: complaint.resolved_at || null,
  operatorRemark: complaint.operator_remark || null,
  ...extras,
});

const emitToRoleAndUsers = ({
  event,
  payload,
  userIds = [],
  roles = ["ADMIN"],
}) => {
  if (!io) return;

  for (const role of roles) {
    io.to(`role:${role}`).emit(event, payload);
  }

  for (const userId of userIds.filter(Boolean)) {
    io.to(`user:${userId}`).emit(event, payload);
  }
};

const initSocketServer = (httpServer) => {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        const allowedOrigins = buildAllowedOrigins();
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("CORS origin not allowed"));
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = authUtils.verifyAccessToken(token);
      if (!decoded) {
        return next(new Error("Invalid or expired token"));
      }

      socket.user = {
        id: decoded.userId,
        role: decoded.role,
      };
      return next();
    } catch (error) {
      return next(new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?.id;
    const role = socket.user?.role;

    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (role) {
      socket.join(`role:${role}`);
    }

    socket.on("complaint:subscribe", (complaintId) => {
      if (complaintId) {
        socket.join(`complaint:${complaintId}`);
      }
    });

    socket.on("complaint:unsubscribe", (complaintId) => {
      if (complaintId) {
        socket.leave(`complaint:${complaintId}`);
      }
    });
  });

  return io;
};

const getIO = () => io;

const emitComplaintAssigned = ({
  complaint,
  operator,
  assignmentMethod,
  triggeredBy,
}) => {
  if (!io || !complaint) return;

  const payload = buildComplaintPayload(complaint, {
    eventType: "complaint:assigned",
    assignmentMethod,
    triggeredBy: triggeredBy || null,
    assignedOperator: operator
      ? {
          id: operator.id,
          name: operator.name,
          email: operator.email,
        }
      : null,
  });

  emitToRoleAndUsers({
    event: "complaint:assigned",
    payload,
    userIds: [complaint.user_id, complaint.assigned_to],
  });

  io.to(`complaint:${complaint.id}`).emit("complaint:assigned", payload);
}

const emitComplaintStatusChanged = ({
  complaint,
  changedBy,
}) => {
  if (!io || !complaint) return;

  const payload = buildComplaintPayload(complaint, {
    eventType: "complaint:status-changed",
    changedBy: changedBy || null,
  });

  emitToRoleAndUsers({
    event: "complaint:status-changed",
    payload,
    userIds: [complaint.user_id, complaint.assigned_to],
  });

  io.to(`complaint:${complaint.id}`).emit("complaint:status-changed", payload);
};

module.exports = {
  initSocketServer,
  getIO,
  emitComplaintAssigned,
  emitComplaintStatusChanged,
};
