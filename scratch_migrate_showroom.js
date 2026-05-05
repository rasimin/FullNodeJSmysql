require('dotenv').config({ path: './backend/.env' });
const { ShowroomSetting } = require('./backend/src/models');

async function migrate() {
  try {
    console.log('Starting migration for showroom_settings...');
    await ShowroomSetting.sync({ alter: true });
    console.log('Migration successful: table showroom_settings created/updated.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
