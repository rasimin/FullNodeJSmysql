const sequelize = require('./src/config/database');
const { Vehicle } = require('./src/models');
const { Op } = require('sequelize');

const fixCategories = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Find all vehicles where type is not 'Mobil' and not 'Motor'
    // Map them to 'Mobil' because things like Coupe, SUV, etc. are cars.
    const [updatedCount] = await Vehicle.update(
      { type: 'Mobil' },
      {
        where: {
          type: {
            [Op.notIn]: ['Mobil', 'Motor']
          }
        }
      }
    );

    console.log(`Successfully updated ${updatedCount} vehicles to type 'Mobil'.`);
    process.exit(0);
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
};

fixCategories();
