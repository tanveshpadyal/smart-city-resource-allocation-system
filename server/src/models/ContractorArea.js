module.exports = (sequelize, DataTypes) => {
  const ContractorArea = sequelize.define(
    "ContractorArea",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      contractor_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      area_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      weight: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      tableName: "ContractorAreas",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["contractor_id", "area_id"] },
        { fields: ["area_id"] },
        { fields: ["contractor_id"] },
      ],
    },
  );

  return ContractorArea;
};

