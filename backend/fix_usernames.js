const { User, sequelize } = require('./src/models');
require('dotenv').config();

const fixUsernames = async () => {
  try {
    await sequelize.authenticate();
    const users = await User.findAll();
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
      if (!user.username || user.username === '') {
        let newUsername = '';
        if (user.email) {
          newUsername = user.email.split('@')[0];
        } else {
          newUsername = 'user' + user.id;
        }
        
        const exists = await User.findOne({ where: { username: newUsername } });
        if (exists) {
            newUsername = newUsername + user.id;
        }

        console.log(`Updating user ${user.id} (${user.name}) with username: ${newUsername}`);
        await user.update({ username: newUsername });
      }
    }
    console.log('Fix complete.');
    process.exit(0);
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  }
};

fixUsernames();
