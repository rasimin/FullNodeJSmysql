const { DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
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

    if (!tableInfo.sales_agent_id) {
      await queryInterface.addColumn('vehicles', 'sales_agent_id', {
        type: DataTypes.INTEGER,
        allowNull: true
      });
      console.log('Added sales_agent_id column to vehicles');
    }

    if (!tableInfo.is_deleted) {
      await queryInterface.addColumn('vehicles', 'is_deleted', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('Added is_deleted column to vehicles');
    }
    
    if (!tableInfo.deleted_at) {
      await queryInterface.addColumn('vehicles', 'deleted_at', {
        type: DataTypes.DATE,
        allowNull: true
      });
      console.log('Added deleted_at column to vehicles');
    }

    // Check sales_agents table
    const salesAgentsInfo = await queryInterface.describeTable('sales_agents');
    if (!salesAgentsInfo.avatar_url) {
      await queryInterface.addColumn('sales_agents', 'avatar_url', {
        type: DataTypes.STRING(255),
        allowNull: true
      });
      console.log('Added avatar_url column to sales_agents');
    }

    if (!salesAgentsInfo.sales_code) {
      await queryInterface.addColumn('sales_agents', 'sales_code', {
        type: DataTypes.STRING(10),
        allowNull: true,
        unique: true
      });
      console.log('Added sales_code column to sales_agents');
    }
    
    // Check offices table
    const officesInfo = await queryInterface.describeTable('offices');
    if (!officesInfo.region_code) {
      await queryInterface.addColumn('offices', 'region_code', {
        type: DataTypes.STRING(20),
        allowNull: true
      });
      console.log('Added region_code column to offices');
    }

    if (!officesInfo.postal_code) {
      await queryInterface.addColumn('offices', 'postal_code', {
        type: DataTypes.STRING(10),
        allowNull: true
      });
      console.log('Added postal_code column to offices');
    }

    // Backfill existing agents with empty sales_code
    console.log('Backfilling empty sales codes...');
    const { SalesAgent } = require('./src/models');
    const generateSalesCode = () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let code = '';
      for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
      for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
      return code;
    };

    const agentsWithoutCode = await SalesAgent.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { sales_code: null },
          { sales_code: '' }
        ]
      }
    });

    for (const agent of agentsWithoutCode) {
      let uniqueCode = generateSalesCode();
      // Simple loop to try and keep it unique (optional but good)
      await agent.update({ sales_code: uniqueCode });
      console.log(`Generated code ${uniqueCode} for agent: ${agent.name}`);
    }

    console.log('Database synchronized and backfilled.');

    console.log('Database synchronized.');
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
};

syncDb();
