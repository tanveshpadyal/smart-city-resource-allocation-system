/**
 * Resource Model
 * Represents available resources in the system
 * Tracks inventory and allocation status
 */

module.exports = (sequelize, DataTypes) => {
  const Resource = sequelize.define(
    "Resource",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      // Resource identification
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        comment: "Unique identifier like RES001, RES002",
      },
      category: {
        type: DataTypes.ENUM(
          "WATER",
          "ELECTRICITY",
          "MEDICAL",
          "TRANSPORT",
          "OTHER",
        ),
        allowNull: false,
      },
      // Location (geographic coordinates)
      location_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Preferred zone for this resource",
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false,
        validate: { min: -90, max: 90 },
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false,
        validate: { min: -180, max: 180 },
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Inventory tracking
      quantity_total: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 },
      },
      quantity_available: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 },
        comment: "Total - (used + allocated)",
      },
      quantity_used: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Units currently in use",
      },
      quantity_reserved: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Units allocated but not yet delivered",
      },
      // Resource status
      status: {
        type: DataTypes.ENUM("ACTIVE", "MAINTENANCE", "DECOMMISSIONED"),
        defaultValue: "ACTIVE",
      },
      /// Maintenance tracking
      maintenance_start: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      maintenance_end: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      maintenance_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Resource specifications
      unit_type: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "liters, units, beds, vehicles, etc.",
      },
      // Allocation constraints
      max_distance_km: {
        type: DataTypes.DECIMAL(8, 2),
        defaultValue: 50,
        comment: "Maximum distance for allocation",
      },
      allocation_priority: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        comment: "Higher = chosen first when multiple resources available",
      },
      // Metadata
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: "Specifications, capacity, special attributes",
      },
    },
    {
      timestamps: true,
      indexes: [
        { fields: ["category"] },
        { fields: ["status"] },
        { fields: ["location_id"] },
        { fields: ["category", "status"] },
      ],
    },
  );

  return Resource;
};
