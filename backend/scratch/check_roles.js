
const { User, Role } = require('../src/models');
async function check() {
  const users = await User.findAll({ include: [Role] });
  users.forEach(u => {
    console.log(`User: ${u.email}, Role: ${u.Role ? u.Role.name : 'NONE'}`);
  });
  process.exit();
}
check();
