const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('Mobil', 'Motor'),
    allowNull: false,
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  plate_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  purchase_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0
  },
  service_cost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0
  },
  entry_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('Available', 'Sold', 'Booked'),
    defaultValue: 'Available',
  },
  office_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sold_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  sales_agent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  odometer: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: true,
  }
}, {
  tableName: 'vehicles',
  timestamps: true,
  underscored: true,
});

module.exports = Vehicle;
