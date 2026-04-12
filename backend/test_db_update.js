require('dotenv').config({ path: './.env' });
const { sequelize } = require('./src/models');

async function testUpdate() {
  try {
    console.log('Testing raw SQL update on user id 1...');
    // update email to a unique test address
    const newEmail = `test_${Date.now()}@example.com`;
    
    await sequelize.query(
      `UPDATE users SET email = '${newEmail}' WHERE id = 1`
    );
    console.log('Update query executed.');
    
    const [user] = await sequelize.query("SELECT email FROM users WHERE id = 1");
    console.log('Current email in DB for ID 1:', user[0].email);
    console.log('Target email was:', newEmail);
    
    if (user[0].email === newEmail) {
      console.log('SUCCESS: Raw SQL update worked!');
    } else {
      console.log('FAILURE: Raw SQL update did NOT change the email!');
    }
  } catch (err) {
    console.error('SQL Error:', err);
  } finally {
    process.exit();
  }
}

testUpdate();
