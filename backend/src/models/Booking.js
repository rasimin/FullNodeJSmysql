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
    allowNullable: false
  },
  customer_phone: {
    type: DataTypes.STRING,
    allowNullable: false
  },
  id_number: {
    type: DataTypes.STRING,
    allowNullable: true
  },
  booking_date: {
    type: DataTypes.DATEONLY,
    allowNullable: false
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNullable: true
  },
  down_payment: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('Active', 'Converted', 'Cancelled', 'Expired'),
    defaultValue: 'Active'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNullable: true
  },
  sales_agent_id: {
    type: DataTypes.INTEGER,
    allowNullable: true
  },
  booked_by_agent_id: {
    type: DataTypes.INTEGER,
    allowNullable: true
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  underscored: true
});

module.exports = Booking;
