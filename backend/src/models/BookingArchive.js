const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookingArchive = sequelize.define('BookingArchive', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  original_booking_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  customer_name: DataTypes.STRING,
  customer_phone: DataTypes.STRING,
  vehicle_id: DataTypes.BIGINT, // Match Vehicle.id type
  status: DataTypes.STRING,
  down_payment: DataTypes.DECIMAL(15, 2),
  booking_date: DataTypes.DATEONLY,
  deleted_by_user_id: DataTypes.BIGINT, // Match User.id type
  archive_reason: DataTypes.TEXT,
  raw_data: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'booking_archives',
  timestamps: true,
  underscored: true
});

module.exports = BookingArchive;
