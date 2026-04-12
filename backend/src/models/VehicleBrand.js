const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VehicleBrand = sequelize.define('VehicleBrand', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  for_car: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  for_motorcycle: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'vehicle_brands',
  timestamps: true,
  underscored: true,
});

module.exports = VehicleBrand;
