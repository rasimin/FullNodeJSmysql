const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'activity_logs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'created_at'],
    },
  ],
});

module.exports = ActivityLog;
