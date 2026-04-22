const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookingDocument = sequelize.define('BookingDocument', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  document_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  mime_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  uploaded_by: {
    type: DataTypes.BIGINT,
    allowNull: true
  }
}, {
  tableName: 'booking_documents',
  timestamps: true,
  underscored: true
});

module.exports = BookingDocument;
