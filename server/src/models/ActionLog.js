module.exports = (sequelize, DataTypes) => {
  return sequelize.define("ActionLog", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    entity_type: DataTypes.STRING,
    entity_id: DataTypes.UUID,

    action: DataTypes.STRING,

    metadata: DataTypes.JSONB,
  });
};
