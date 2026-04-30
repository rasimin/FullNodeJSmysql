const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Promotion = sequelize.define('Promotion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image_path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  placement: {
    type: DataTypes.ENUM('Slider', 'Popup', 'Banner'),
    defaultValue: 'Slider'
  },
  target_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  office_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Null means all branches if is_all_branches is true'
  },
  is_all_branches: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_by: {
    type: DataTypes.BIGINT,
    allowNull: false
  }
}, {
  tableName: 'promotions',
  timestamps: true,
  underscored: true
});

module.exports = Promotion;
