const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

const User = require("./User")(sequelize, DataTypes);
const Resource = require("./Resource")(sequelize, DataTypes);
const Request = require("./Request")(sequelize, DataTypes);
const ActionLog = require("./ActionLog")(sequelize, DataTypes);
const AdminActivityLog = require("./AdminActivityLog")(sequelize, DataTypes);
const Location = require("./Location")(sequelize, DataTypes);
const ResourceAllocation = require("./ResourceAllocation")(
  sequelize,
  DataTypes,
);
const Provider = require("./Provider")(sequelize, DataTypes);
const Service = require("./Service")(sequelize, DataTypes);
const ProviderService = require("./ProviderService")(sequelize, DataTypes);

// ============================================
// USER ASSOCIATIONS
// ============================================
User.hasMany(Request, { foreignKey: "user_id" });
Request.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(ActionLog, { foreignKey: "actor_id" });
ActionLog.belongsTo(User, { foreignKey: "actor_id" });

User.hasMany(AdminActivityLog, { foreignKey: "admin_id" });
AdminActivityLog.belongsTo(User, { foreignKey: "admin_id", as: "admin" });

User.hasMany(ResourceAllocation, { foreignKey: "allocated_by" });
ResourceAllocation.belongsTo(User, {
  foreignKey: "allocated_by",
  as: "allocator",
});

User.hasOne(Provider, { foreignKey: "user_id" });
Provider.belongsTo(User, { foreignKey: "user_id" });

// ============================================
// REQUEST ASSOCIATIONS
// ============================================
Request.hasMany(ResourceAllocation, { foreignKey: "request_id" });
ResourceAllocation.belongsTo(Request, { foreignKey: "request_id" });

Request.belongsTo(Location, { foreignKey: "location_id" });
Location.hasMany(Request);

Request.belongsTo(ProviderService, { foreignKey: "provider_service_id" });
ProviderService.hasMany(Request, { foreignKey: "provider_service_id" });

// Operator assignment - Request can be assigned to an operator (User)
Request.belongsTo(User, {
  foreignKey: "assigned_to",
  as: "assignedOperator",
});
User.hasMany(Request, {
  foreignKey: "assigned_to",
  as: "assignedComplaints",
});

// ============================================
// RESOURCE ASSOCIATIONS
// ============================================
Resource.hasMany(ResourceAllocation, { foreignKey: "resource_id" });
ResourceAllocation.belongsTo(Resource, { foreignKey: "resource_id" });

Resource.belongsTo(Location, {
  foreignKey: "location_id",
  as: "preferredZone",
});

// ============================================
// PROVIDER ASSOCIATIONS
// ============================================
Provider.hasMany(ProviderService, { foreignKey: "provider_id" });
ProviderService.belongsTo(Provider, { foreignKey: "provider_id" });

Service.hasMany(ProviderService, { foreignKey: "service_id" });
ProviderService.belongsTo(Service, { foreignKey: "service_id" });

module.exports = {
  sequelize,
  User,
  Resource,
  Request,
  ActionLog,
  AdminActivityLog,
  Location,
  ResourceAllocation,
  Provider,
  Service,
  ProviderService,
};
