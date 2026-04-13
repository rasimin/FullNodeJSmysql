const { sequelize, Role, Office, User } = require('../models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // Careful: This drops tables! Use for dev only.

    // 1. Create Roles
    const roles = await Role.bulkCreate([
      { name: 'Super Admin', description: 'Full Access' },
      { name: 'Admin Pusat', description: 'Head Office Admin' },
      { name: 'Admin Cabang', description: 'Branch Office Admin' },
      { name: 'User Biasa', description: 'Regular User' },
    ]);

    // 2. Create Offices
    const headOffice = await Office.create({
      name: 'Kantor Pusat Jakarta',
      type: 'HEAD_OFFICE',
      address: 'Jl. Sudirman No. 1',
    });

    const branchOffice = await Office.create({
      name: 'Cabang Surabaya',
      type: 'BRANCH_OFFICE',
      address: 'Jl. Tunjungan No. 10',
      parent_id: headOffice.id,
    });

    // 3. Create Super Admin User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await User.create({
      name: 'Super Administrator',
      email: 'admin@example.com',
      username: 'admin',
      password_hash: passwordHash,
      role_id: roles[0].id, // Super Admin
      office_id: headOffice.id,
    });

    console.log('Database seeded successfully!');
    console.log('Login with: admin@example.com / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
