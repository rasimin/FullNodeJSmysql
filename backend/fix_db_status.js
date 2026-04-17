const sequelize = require('./src/config/database');

async function fixStatuses() {
  try {
    console.log('Starting database status fix...');
    
    // 1. Manually update the ENUM column to include all possible values
    await sequelize.query(`
      ALTER TABLE bookings 
      MODIFY COLUMN status ENUM('Active', 'Converted', 'Cancelled', 'Expired', 'Sold') 
      DEFAULT 'Active'
    `);
    console.log('ENUM column updated successfully.');

    // 2. Fix any NULL or empty statuses to 'Active'
    await sequelize.query(`
      UPDATE bookings 
      SET status = 'Active' 
      WHERE status IS NULL OR status = ''
    `);
    console.log('Empty statuses fixed to "Active".');

    // 3. Fix any 'sold' or other case variations to 'Sold'
    await sequelize.query(`
      UPDATE bookings 
      SET status = 'Sold' 
      WHERE LOWER(status) = 'sold'
    `);
    console.log('Sold status case fixed.');

    console.log('Database fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
}

fixStatuses();
