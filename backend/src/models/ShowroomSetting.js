const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShowroomSetting = sequelize.define('ShowroomSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  head_office_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'offices',
      key: 'id'
    }
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'Katalog Showroom'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'Temukan unit impian Anda dengan standar kualitas terbaik dan proses yang transparan.'
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'showroom_settings',
  timestamps: true,
  underscored: true
});

module.exports = ShowroomSetting;
