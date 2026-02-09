/**
 * Location Model
 * Represents geographic zones/areas in the city
 * Used for distance-based resource allocation
 */

module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define(
    "Location",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      zone_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: "e.g., Downtown, North District, West Zone",
      },
      zone_code: {
        type: DataTypes.STRING,
        unique: true,
        comment: "e.g., DT001, ND001, WZ001",
      },
      // Geographic coordinates (center of zone)
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false,
        validate: {
          min: -90,
          max: 90,
        },
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false,
        validate: {
          min: -180,
          max: 180,
        },
      },
      // Geofence boundary (for more accurate distance calculation)
      boundary_polygon: {
        type: DataTypes.GEOMETRY("POLYGON"),
        allowNull: true,
        comment: "GeoJSON polygon representing zone boundary",
      },
      // Zone metadata
      population_estimate: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      city_region: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Larger region (e.g., Region A, Region B)",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
    },
  );

  return Location;
};
