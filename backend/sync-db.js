const { DataTypes } = require('sequelize');
const sequelize = require('./src/config/database');
const { Vehicle } = require('./src/models');

const syncDb = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    await sequelize.authenticate();
    console.log('Database connected.');
    
    // Manually add columns if they don't exist
    const tableInfo = await queryInterface.describeTable('vehicles');
    
    if (!tableInfo.purchase_price) {
      await queryInterface.addColumn('vehicles', 'purchase_price', {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0
      });
      console.log('Added purchase_price column');
    }
    
    if (!tableInfo.service_cost) {
      await queryInterface.addColumn('vehicles', 'service_cost', {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0
      });
      console.log('Added service_cost column');
    }

    if (!tableInfo.odometer) {
      await queryInterface.addColumn('vehicles', 'odometer', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
      console.log('Added odometer column');
    }

    if (!tableInfo.color) {
      await queryInterface.addColumn('vehicles', 'color', {
        type: DataTypes.STRING(50),
        allowNull: true
      });
      console.log('Added color column');
    }

    console.log('Database synchronized.');
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
};

syncDb();
