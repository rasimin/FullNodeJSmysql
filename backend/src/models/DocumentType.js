const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentType = sequelize.define('DocumentType', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  category: {
    type: DataTypes.ENUM('Vehicle', 'Booking', 'All'),
    allowNull: false,
    defaultValue: 'All'
  },
  is_mandatory: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'document_types',
  timestamps: true,
  underscored: true
});

module.exports = DocumentType;
