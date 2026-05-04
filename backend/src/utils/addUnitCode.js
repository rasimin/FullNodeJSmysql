const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

async function addUnitCode() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('vehicles');
    
    if (!tableInfo.unit_code) {
      await queryInterface.addColumn('vehicles', 'unit_code', {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
      });
      console.log('✅ Column unit_code added successfully');
    } else {
      console.log('ℹ️ Column unit_code already exists');
    }

    // Function to generate unit code (same logic as we'll use in hooks)
    const generateUnitCode = (vehicle) => {
      const brand = (vehicle.brand || 'UNK').substring(0, 3).toUpperCase();
      const year = vehicle.year ? vehicle.year.toString().slice(-2) : '00';
      const shortId = vehicle.id.toString(36).toUpperCase().padStart(3, '0');
      return `${brand}${year}-${shortId}`;
    };

    // Backfill existing data
    const [vehicles] = await sequelize.query('SELECT id, brand, year FROM vehicles WHERE unit_code IS NULL');
    console.log(`🔄 Backfilling ${vehicles.length} vehicles...`);

    for (const v of vehicles) {
      const code = generateUnitCode(v);
      await sequelize.query('UPDATE vehicles SET unit_code = ? WHERE id = ?', {
        replacements: [code, v.id]
      });
    }

    console.log('✅ Backfill complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addUnitCode();
