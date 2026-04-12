const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditTrail = sequelize.define('AuditTrail', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  table_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  record_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM('INSERT', 'UPDATE', 'DELETE'),
    allowNull: false,
  },
  old_values: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  new_values: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
}, {
  tableName: 'audit_trails',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['table_name', 'record_id'],
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['created_at'],
    },
  ],
});

module.exports = AuditTrail;
