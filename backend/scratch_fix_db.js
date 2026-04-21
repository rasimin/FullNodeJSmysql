const sequelize = require('./src/config/database');

async function fix() {
  try {
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_photo VARCHAR(255) NULL;");
    console.log("Column delivery_photo added or already exists.");
    process.exit(0);
  } catch (err) {
    // MySQL 8+ doesn't support ADD COLUMN IF NOT EXISTS in ALTER TABLE directly sometimes or dialect specific
    // Let's try standard way and catch "duplicate column" error
    try {
      await sequelize.query("ALTER TABLE bookings ADD COLUMN delivery_photo VARCHAR(255) NULL;");
      console.log("Column delivery_photo added successfully.");
    } catch (innerErr) {
      if (innerErr.message.includes('Duplicate column name')) {
        console.log("Column delivery_photo already exists.");
      } else {
        console.error("Error adding column:", innerErr);
      }
    }
    process.exit(0);
  }
}

fix();
