const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customer_phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  id_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  booking_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  down_payment: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('Active', 'Converted', 'Cancelled', 'Expired', 'Sold'),
    defaultValue: 'Active'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sales_agent_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  booked_by_agent_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  underscored: true
});

module.exports = Booking;
