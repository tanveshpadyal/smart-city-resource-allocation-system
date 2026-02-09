/**
 * ResourceAllocation Model
 * Tracks the allocation of resources to requests
 * Maintains history and transaction details
 */

module.exports = (sequelize, DataTypes) => {
  const ResourceAllocation = sequelize.define(
    "ResourceAllocation",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      // Foreign keys
      request_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "Link to the user request",
      },
      resource_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "Link to the resource",
      },
      allocated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "User ID of operator who allocated (null if auto-allocated)",
      },
      // Allocation details
      quantity_allocated: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      allocation_mode: {
        type: DataTypes.ENUM("AUTO", "MANUAL", "SYSTEM"),
        defaultValue: "AUTO",
        comment:
          "AUTO: system auto-allocated, MANUAL: operator manually allocated",
      },
      // Distance metrics (for audit trail)
      distance_km: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        comment: "Distance between resource and request in kilometers",
      },
      travel_time_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Estimated travel time from resource to request",
      },
      // Status tracking
      status: {
        type: DataTypes.ENUM(
          "ALLOCATED",
          "IN_TRANSIT",
          "DELIVERED",
          "PARTIALLY_DELIVERED",
          "CANCELLED",
        ),
        defaultValue: "ALLOCATED",
      },
      // Timestamps
      allocated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Cancellation reason
      cancellation_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Metadata
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: "Additional data like route, conditions, etc.",
      },
    },
    {
      timestamps: true,
      indexes: [
        { fields: ["request_id"] },
        { fields: ["resource_id"] },
        { fields: ["status"] },
        { fields: ["allocated_at"] },
        { fields: ["request_id", "status"] },
      ],
    },
  );

  return ResourceAllocation;
};
