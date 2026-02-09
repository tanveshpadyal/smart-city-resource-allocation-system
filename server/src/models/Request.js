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
      // Foreign keys
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "Citizen who made the request",
      },
      location_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "Zone where resource is needed",
      },
      // Request details
      resource_category: {
        type: DataTypes.ENUM(
          "WATER",
          "ELECTRICITY",
          "MEDICAL",
          "TRANSPORT",
          "OTHER",
        ),
        allowNull: false,
      },
      quantity_requested: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      quantity_fulfilled: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      // Priority determines allocation speed
      priority: {
        type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "EMERGENCY"),
        defaultValue: "MEDIUM",
      },
      // Request description
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Reason for request, specific needs, etc.",
      },
      // Status tracking
      status: {
        type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED", "FULFILLED"),
        defaultValue: "PENDING",
      },
      // Timestamps
      requested_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      fulfilled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejected_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Rejection details
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // SLA tracking
      target_completion_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Expected completion based on priority",
      },
      // Metadata
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
        { fields: ["status"] },
        { fields: ["priority"] },
        { fields: ["requested_at"] },
        { fields: ["user_id", "status"] },
        { fields: ["status", "priority"] },
      ],
    },
  );

  return Request;
};
