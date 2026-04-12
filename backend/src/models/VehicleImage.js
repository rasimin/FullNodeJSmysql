const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VehicleImage = sequelize.define('VehicleImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vehicle_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'vehicles',
      key: 'id'
    }
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'vehicle_images',
  timestamps: true
});

module.exports = VehicleImage;
