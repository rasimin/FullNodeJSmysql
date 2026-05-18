const sequelize = require('../config/database');

async function migrate() {
  try {
    const [results] = await sequelize.query(`
      SHOW COLUMNS FROM showroom_settings LIKE 'layout_template'
    `);
    if (results.length === 0) {
      await sequelize.query(`
        ALTER TABLE showroom_settings ADD COLUMN layout_template VARCHAR(50) DEFAULT 'classic';
      `);
      console.log('Added layout_template column successfully.');
    } else {
      console.log('layout_template column already exists.');
    }
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
