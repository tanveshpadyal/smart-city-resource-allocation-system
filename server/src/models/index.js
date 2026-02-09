const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

const User = require("./User")(sequelize, DataTypes);
const Resource = require("./Resource")(sequelize, DataTypes);
const Request = require("./Request")(sequelize, DataTypes);
const ActionLog = require("./ActionLog")(sequelize, DataTypes);
const Location = require("./Location")(sequelize, DataTypes);
const ResourceAllocation = require("./ResourceAllocation")(
  sequelize,
  DataTypes,
);

// ============================================
// USER ASSOCIATIONS
// ============================================
User.hasMany(Request, { foreignKey: "user_id" });
Request.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(ActionLog, { foreignKey: "actor_id" });
ActionLog.belongsTo(User, { foreignKey: "actor_id" });

User.hasMany(ResourceAllocation, { foreignKey: "allocated_by" });
ResourceAllocation.belongsTo(User, {
  foreignKey: "allocated_by",
  as: "allocator",
});

// ============================================
// REQUEST ASSOCIATIONS
// ============================================
Request.hasMany(ResourceAllocation, { foreignKey: "request_id" });
ResourceAllocation.belongsTo(Request, { foreignKey: "request_id" });

Request.belongsTo(Location, { foreignKey: "location_id" });
Location.hasMany(Request);

// ============================================
// RESOURCE ASSOCIATIONS
// ============================================
Resource.hasMany(ResourceAllocation, { foreignKey: "resource_id" });
ResourceAllocation.belongsTo(Resource, { foreignKey: "resource_id" });

Resource.belongsTo(Location, {
  foreignKey: "location_id",
  as: "preferredZone",
});

module.exports = {
  sequelize,
  User,
  Resource,
  Request,
  ActionLog,
  Location,
  ResourceAllocation,
};
