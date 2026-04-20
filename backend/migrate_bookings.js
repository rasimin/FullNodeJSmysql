const sequelize = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function migrate() {
    try {
        console.log('Starting migration...');
        
        // Add office_id
        await sequelize.query(`
            ALTER TABLE bookings 
            ADD COLUMN IF NOT EXISTS office_id INT NULL,
            ADD COLUMN IF NOT EXISTS vehicle_id BIGINT NULL,
            ADD COLUMN IF NOT EXISTS user_id BIGINT NULL
        `);
        
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
