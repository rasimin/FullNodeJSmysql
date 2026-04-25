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
const Location = require('./Location');
const BookingArchive = require('./BookingArchive');
const DocumentType = require('./DocumentType');
const VehicleDocument = require('./VehicleDocument');
const BookingDocument = require('./BookingDocument');

// User Relationships
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

User.belongsTo(Office, { foreignKey: 'office_id' });
Office.hasMany(User, { foreignKey: 'office_id' });

// User Sessions
UserSession.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(UserSession, { foreignKey: 'user_id', onDelete: 'CASCADE' });

// Sales Agent Relationships
SalesAgent.belongsTo(Office, { foreignKey: 'office_id' });
Office.hasMany(SalesAgent, { foreignKey: 'office_id', as: 'salesAgents' });

// Office Hierarchy
Office.belongsTo(Office, { as: 'parent', foreignKey: 'parent_id' });
Office.hasMany(Office, { as: 'branches', foreignKey: 'parent_id' });
Office.belongsTo(Location, { foreignKey: 'region_code', targetKey: 'region_code', as: 'location' });

// Activity Log Relationship
ActivityLog.belongsTo(User, { foreignKey: 'user_id', onDelete: 'SET NULL' });
User.hasMany(ActivityLog, { foreignKey: 'user_id', onDelete: 'SET NULL' });

// Vehicle Relationships
Vehicle.belongsTo(Office, { foreignKey: 'office_id' });
Vehicle.belongsTo(User, { foreignKey: 'user_id', onDelete: 'SET NULL' });
Office.hasMany(Vehicle, { foreignKey: 'office_id', as: 'vehicles' });
User.hasMany(Vehicle, { foreignKey: 'user_id', as: 'vehicles', onDelete: 'SET NULL' });

Vehicle.belongsTo(SalesAgent, { foreignKey: 'sales_agent_id', as: 'salesAgent' });
SalesAgent.hasMany(Vehicle, { foreignKey: 'sales_agent_id', as: 'soldVehicles' });

Vehicle.hasMany(VehicleImage, { foreignKey: 'vehicle_id', as: 'images' });
VehicleImage.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

// Vehicle Documents
Vehicle.hasMany(VehicleDocument, { foreignKey: 'vehicle_id', as: 'documents' });
VehicleDocument.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });
VehicleDocument.belongsTo(DocumentType, { foreignKey: 'document_type_id', as: 'type' });

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
BookingArchive.belongsTo(User, { foreignKey: 'deleted_by_user_id', as: 'deletedBy' });

// Booking Documents
Booking.hasMany(BookingDocument, { foreignKey: 'booking_id', as: 'documents' });
BookingDocument.belongsTo(Booking, { foreignKey: 'booking_id' });
BookingDocument.belongsTo(DocumentType, { foreignKey: 'document_type_id', as: 'type' });

// Location Hierarchy
Location.belongsTo(Location, { as: 'parent', foreignKey: 'parent_id' });
Location.belongsTo(Location, { as: 'district', foreignKey: 'parent_id' });
Location.belongsTo(Location, { as: 'city', foreignKey: 'parent_id' });
Location.belongsTo(Location, { as: 'province', foreignKey: 'parent_id' });
Location.hasMany(Location, { as: 'children', foreignKey: 'parent_id' });

// Audit Trail Relationship
AuditTrail.belongsTo(User, { foreignKey: 'user_id', onDelete: 'SET NULL' });

// Global Hook for Audit Trails
const createAuditLog = async (options) => {
  const { model, action, instance, options: queryOptions } = options;
  const userId = queryOptions.userId;

  if (!userId) return; 

  try {
    const oldValues = (action === 'UPDATE' || action === 'DELETE') ? (action === 'DELETE' ? instance.get({ plain: true }) : instance.previous()) : null;
    const newValues = action === 'DELETE' ? null : instance.get({ plain: true });

    await AuditTrail.create({
      table_name: model.tableName,
      record_id: instance.id,
      action: action,
      old_values: oldValues,
      new_values: newValues,
      user_id: userId,
      ip_address: queryOptions.ipAddress || null,
    });
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
};

const setupHooks = (model) => {
  model.afterCreate(async (instance, options) => {
    createAuditLog({ model, action: 'INSERT', instance, options }).catch(err => console.error('Audit Hook Create:', err));
  });

  model.afterUpdate(async (instance, options) => {
    if (instance.changed()) {
      createAuditLog({ model, action: 'UPDATE', instance, options }).catch(err => console.error('Audit Hook Update:', err));
    }
  });

  model.afterDestroy(async (instance, options) => {
    createAuditLog({ model, action: 'DELETE', instance, options }).catch(err => console.error('Audit Hook Destroy:', err));
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
setupHooks(Location);
setupHooks(VehicleDocument);
setupHooks(BookingDocument);

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
  UserSession,
  Location,
  BookingArchive,
  DocumentType,
  VehicleDocument,
  BookingDocument
};

