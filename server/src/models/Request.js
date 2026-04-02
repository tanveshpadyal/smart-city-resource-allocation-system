/**
 * Request Model
 * Represents a resource request from a citizen
 */

module.exports = (sequelize, DataTypes) => {
  const Request = sequelize.define(
    "Request",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "Citizen who made the request",
      },
      location_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Zone where resource is needed",
      },
      location_data: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: "Inline location object for complaint",
      },
      complaint_category: {
        type: DataTypes.ENUM("ROAD", "GARBAGE", "WATER", "LIGHT", "OTHER"),
        allowNull: false,
      },
      assigned_to: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Operator assigned to this complaint",
      },
      quantity_requested: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 1 },
      },
      quantity_fulfilled: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      priority: {
        type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "EMERGENCY"),
        defaultValue: "MEDIUM",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Reason for request, specific needs, etc.",
      },
      status: {
        type: DataTypes.ENUM("PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED"),
        defaultValue: "PENDING",
      },
      assignment_strategy: {
        type: DataTypes.ENUM("AUTO", "MANUAL", "ESCALATED"),
        allowNull: false,
        defaultValue: "AUTO",
      },
      assignment_score: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      assignment_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      location_bucket: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      parent_complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      reassignment_cooldown_until: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      operator_remark: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Operator's notes/remarks about the issue resolution",
      },
      requested_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      assigned_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "When operator was assigned",
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "When operator started working on it",
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "When complaint was resolved",
      },
      slaBreached: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether complaint exceeded SLA window before resolution",
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "URL or base64 of complaint image",
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    {
      timestamps: true,
      indexes: [
        { fields: ["user_id"] },
        { fields: ["location_id"] },
        { fields: ["assigned_to"] },
        { fields: ["assignment_strategy"] },
        { fields: ["location_bucket"] },
        { fields: ["parent_complaint_id"] },
        { fields: ["status"] },
        { fields: ["slaBreached"] },
        { fields: ["requested_at"] },
        { fields: ["user_id", "status"] },
        { fields: ["status", "complaint_category", "requested_at"] },
        { fields: ["assigned_to", "status", "requested_at"] },
      ],
    },
  );

  Request.associate = function (models) {
    Request.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "Citizen",
    });

    Request.belongsTo(models.User, {
      foreignKey: "assigned_to",
      as: "AssignedOperator",
    });

    Request.belongsTo(models.Location, {
      foreignKey: "location_id",
    });

    Request.belongsTo(models.Request, {
      foreignKey: "parent_complaint_id",
      as: "ParentComplaint",
    });
  };

  Request.beforeUpdate((request) => {
    if (!request.changed("status")) return;

    const previousStatus = request.previous("status");
    const nextStatus = request.get("status");

    if (!previousStatus || previousStatus === nextStatus) return;

    const allowedTransitions = {
      PENDING: ["ASSIGNED"],
      ASSIGNED: ["IN_PROGRESS"],
      IN_PROGRESS: ["RESOLVED"],
      RESOLVED: [],
    };

    if (!allowedTransitions[previousStatus]?.includes(nextStatus)) {
      throw new Error(
        `Invalid complaint status transition: ${previousStatus} -> ${nextStatus}`,
      );
    }
  });

  return Request;
};
