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

    // 4. Create Vehicle Brands
    const { VehicleBrand, SalesAgent, Vehicle } = require('../models');
    await VehicleBrand.bulkCreate([
      { name: 'Toyota', for_car: true },
      { name: 'Honda', for_car: true, for_motorcycle: true },
      { name: 'Yamaha', for_motorcycle: true },
      { name: 'Mitsubishi', for_car: true },
      { name: 'Mercedes-Benz', for_car: true },
      { name: 'BMW', for_car: true }
    ]);

    // 5. Create Sales Agents
    const agents = await SalesAgent.bulkCreate([
      { name: 'Rendi Wijaya', office_id: headOffice.id, status: 'Active', sales_code: 'SA001' },
      { name: 'Siti Aminah', office_id: branchOffice.id, status: 'Active', sales_code: 'SA002' }
    ]);

    // 6. Create Dummy Vehicles
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    await Vehicle.bulkCreate([
      { 
        type: 'Mobil', brand: 'Toyota', model: 'Avanza Veloz', year: 2022, 
        plate_number: 'B 1234 ABC', price: 235000000, office_id: headOffice.id, 
        user_id: adminUser.id, status: 'Available', odometer: 15000, color: 'White'
      },
      { 
        type: 'Mobil', brand: 'Honda', model: 'CR-V Turbo', year: 2021, 
        plate_number: 'L 5678 XY', price: 450000000, office_id: branchOffice.id, 
        user_id: adminUser.id, status: 'Available', odometer: 25000, color: 'Black'
      },
      { 
        type: 'Motor', brand: 'Yamaha', model: 'NMAX 155', year: 2023, 
        plate_number: 'B 9999 ZZZ', price: 35000000, office_id: headOffice.id, 
        user_id: adminUser.id, status: 'Available', odometer: 2000, color: 'Matte Blue'
      }
    ]);

    // 7. Create System Settings (Security)
    const { SystemSetting } = require('../models');
    await SystemSetting.bulkCreate([
      { key: 'security_session_timeout', value: '30', group: 'Security', description: 'Session timeout in minutes', is_editable: true },
      { key: 'security_lockout_attempts', value: '5', group: 'Security', description: 'Maximum failed login attempts before lockout', is_editable: true },
      { key: 'security_lockout_duration', value: '15', group: 'Security', description: 'Lockout duration in minutes', is_editable: true },
      { key: 'security_password_strong', value: 'true', group: 'Security', description: 'Whether to require strong passwords', is_editable: true },
      { key: 'app_name', value: 'Admin Dashboard', group: 'General', description: 'Application Name', is_editable: true }
    ]);

    console.log('Database seeded successfully with test data and system settings!');
    console.log('Login with: admin@example.com / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
