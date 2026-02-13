/**
 * ProviderService Model
 * Links a provider to a service with capacity/availability
 */

module.exports = (sequelize, DataTypes) => {
  const ProviderService = sequelize.define(
    "ProviderService",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      provider_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      service_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      price_per_unit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      capacity_total: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 },
      },
      capacity_available: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 },
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "PAUSED", "INACTIVE"),
        defaultValue: "ACTIVE",
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    {
      timestamps: true,
      indexes: [
        { fields: ["provider_id"] },
        { fields: ["service_id"] },
        { fields: ["status"] },
      ],
    },
  );

  return ProviderService;
};
