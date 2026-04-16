const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('PROVINCE', 'CITY', 'DISTRICT', 'POSTAL_CODE'),
    allowNull: false
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'locations',
      key: 'id'
    }
  },
  postal_code: {
    type: DataTypes.STRING(10),
    allowNull: true
  }
}, {
  tableName: 'locations',
  timestamps: true
});

module.exports = Location;
