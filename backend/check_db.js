const { sequelize } = require('./src/models');

async function checkSchema() {
  try {
    const [results] = await sequelize.query("DESCRIBE vehicles");
    console.log("Columns in 'vehicles' table:");
    results.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
    process.exit(0);
  } catch (error) {
    console.error("Error describing table:", error);
    process.exit(1);
  }
}

checkSchema();
