
require('dotenv').config();
const { User, Role, Office } = require('../src/models');
const bcrypt = require('bcryptjs');

async function testControllerLogic() {
  try {
    const userId = 1;
    const newEmail = `manual_${Date.now()}@example.com`;
    
    console.log(`Testing update for user ${userId} to ${newEmail}`);
    
    // Simulating controller logic
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    
    console.log(`Current email: ${user.email}`);
    
    user.email = newEmail;
    user.name = 'Updated Name';
    
    await user.save({ 
        userId: userId,
        individualHooks: true 
    });
    
    const updatedUser = await User.findByPk(userId);
    console.log(`Updated email: ${updatedUser.email}`);
    
    if (updatedUser.email === newEmail) {
      console.log('SUCCESS: Controller logic worked!');
    } else {
      console.log('FAILURE: Email did not change!');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

testControllerLogic();
