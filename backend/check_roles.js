const { Role } = require('./src/models');

async function checkRoles() {
  try {
    const roles = await Role.findAll();
    console.log("Roles in database:");
    roles.forEach(r => console.log(`- ${r.name}`));
    process.exit(0);
  } catch (error) {
    console.error("Error fetching roles:", error);
    process.exit(1);
  }
}

checkRoles();
