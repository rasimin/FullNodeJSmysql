
const sequelize = require('../src/config/database');
async function checkSchema() {
  try {
    const [res] = await sequelize.query('SHOW CREATE TABLE users');
    console.log(res[0]['Create Table']);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
checkSchema();
