const sequelize = require('../config/database');
const Role = require('./Role');
const Office = require('./Office');
const User = require('./User');
const AuditTrail = require('./AuditTrail');
const ActivityLog = require('./ActivityLog');
const Vehicle = require('./Vehicle');
const VehicleBrand = require('./VehicleBrand');
const Booking = require('./Booking');
const VehicleImage = require('./VehicleImage');
const SalesAgent = require('./SalesAgent');
const SystemSetting = require('./SystemSetting');
const UserSession = require('./UserSession');

// User Relationships
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

User.belongsTo(Office, { foreignKey: 'office_id' });
Office.hasMany(User, { foreignKey: 'office_id' });

// User Sessions
UserSession.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(UserSession, { foreignKey: 'user_id' });

// Sales Agent Relationships
SalesAgent.belongsTo(Office, { foreignKey: 'office_id' });
Office.hasMany(SalesAgent, { foreignKey: 'office_id', as: 'salesAgents' });

// Office Hierarchy
Office.belongsTo(Office, { as: 'parent', foreignKey: 'parent_id' });
Office.hasMany(Office, { as: 'branches', foreignKey: 'parent_id' });

// Activity Log Relationship
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(ActivityLog, { foreignKey: 'user_id' });

// Vehicle Relationships
Vehicle.belongsTo(Office, { foreignKey: 'office_id' });
Vehicle.belongsTo(User, { foreignKey: 'user_id' });
Office.hasMany(Vehicle, { foreignKey: 'office_id', as: 'vehicles' });
User.hasMany(Vehicle, { foreignKey: 'user_id', as: 'vehicles' });

Vehicle.belongsTo(SalesAgent, { foreignKey: 'sales_agent_id', as: 'salesAgent' });
SalesAgent.hasMany(Vehicle, { foreignKey: 'sales_agent_id', as: 'soldVehicles' });

Vehicle.hasMany(VehicleImage, { foreignKey: 'vehicle_id', as: 'images' });
VehicleImage.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

// Booking Relationships
Booking.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });
Vehicle.hasMany(Booking, { foreignKey: 'vehicle_id' });

Booking.belongsTo(Office, { foreignKey: 'office_id' });
Office.hasMany(Booking, { foreignKey: 'office_id' });

Booking.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Booking, { foreignKey: 'user_id' });

Booking.belongsTo(SalesAgent, { foreignKey: 'sales_agent_id', as: 'salesAgent' });
Booking.belongsTo(SalesAgent, { foreignKey: 'booked_by_agent_id', as: 'bookedByAgent' });
SalesAgent.hasMany(Booking, { foreignKey: 'sales_agent_id', as: 'bookings' });

// Audit Trail Relationship
AuditTrail.belongsTo(User, { foreignKey: 'user_id' });

// Global Hook for Audit Trails
const createAuditLog = async (options) => {
  const { model, action, instance, options: queryOptions } = options;
  const userId = queryOptions.userId;

  if (!userId) return; 

  try {
    await AuditTrail.create({
      table_name: model.tableName,
      record_id: instance.id,
      action: action,
      old_values: action === 'UPDATE' ? instance._previousDataValues : null,
      new_values: action === 'DELETE' ? null : instance.dataValues,
      user_id: userId,
      ip_address: queryOptions.ipAddress || null,
    });
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
};

const setupHooks = (model) => {
  model.afterCreate(async (instance, options) => {
    await createAuditLog({ model, action: 'INSERT', instance, options });
  });

  model.afterUpdate(async (instance, options) => {
    if (instance.changed()) {
      await createAuditLog({ model, action: 'UPDATE', instance, options });
    }
  });

  model.afterDestroy(async (instance, options) => {
    await createAuditLog({ model, action: 'DELETE', instance, options });
  });
};

// Apply hooks to critical models
setupHooks(User);
setupHooks(Role);
setupHooks(Office);
setupHooks(Vehicle);
setupHooks(VehicleBrand);
setupHooks(Booking);
setupHooks(VehicleImage);
setupHooks(SalesAgent);
setupHooks(SystemSetting);

module.exports = {
  sequelize,
  Role,
  Office,
  User,
  AuditTrail,
  ActivityLog,
  Vehicle,
  VehicleBrand,
  Booking,
  VehicleImage,
  SalesAgent,
  SystemSetting,
  UserSession
};
