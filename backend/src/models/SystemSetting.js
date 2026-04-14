const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemSetting = sequelize.define('SystemSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  group: {
    type: DataTypes.STRING,
    defaultValue: 'General',
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_editable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  tableName: 'system_settings',
  timestamps: true,
});

module.exports = SystemSetting;
