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
    allowNull: false,
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
  }
}, {
  tableName: 'vehicles',
  timestamps: true,
  underscored: true,
});

module.exports = Vehicle;
