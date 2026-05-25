const sequelize = require('../config/database');

const updateSchema = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    
    // Execute query to add permissions column if it does not exist
    await sequelize.query('ALTER TABLE roles ADD COLUMN permissions JSON DEFAULT NULL');
    console.log('Column permissions successfully added to roles table!');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('Duplicate column') || error.message.includes('already exists')) {
      console.log('Column permissions already exists in roles table.');
      process.exit(0);
    } else {
      console.error('Error altering table:', error);
      process.exit(1);
    }
  }
};

updateSchema();
