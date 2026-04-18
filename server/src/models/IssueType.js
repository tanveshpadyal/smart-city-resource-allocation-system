module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "IssueType",
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
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      category: {
        type: DataTypes.ENUM("ROAD", "GARBAGE", "WATER", "LIGHT", "OTHER"),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
      indexes: [
        { unique: true, fields: ["slug"] },
        { fields: ["category", "is_active"] },
      ],
    },
  );
};
