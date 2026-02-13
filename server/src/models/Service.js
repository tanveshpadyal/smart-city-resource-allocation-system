/**
 * Service Model
 * Represents a service category (parking, water, fuel, medical, etc.)
 */

module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define(
    "Service",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      category: {
        type: DataTypes.ENUM(
          "WATER",
          "FOOD",
          "MEDICAL",
          "FUEL",
          "PARKING",
          "EQUIPMENT",
          "OTHER",
        ),
        allowNull: false,
      },
      unit_type: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "e.g., tanks, slots, liters, kits",
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

  return Service;
};
