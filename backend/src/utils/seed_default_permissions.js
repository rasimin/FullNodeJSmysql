const { Role } = require('../models');
const sequelize = require('../config/database');

const seedDefaultPermissions = async () => {
  try {
    await sequelize.authenticate();
    const roles = await Role.findAll();
    
    for (const role of roles) {
      if (role.name === 'Super Admin') {
        const fullPerms = {};
        const MENU_KEYS = [
          'dashboard', 'sales_report', 'finance_report', 'brands', 'vehicles', 
          'transactions', 'offices', 'sales_agents', 'locations', 'promotions', 
          'showroom_settings', 'recycle_bin', 'user_management', 'role_management', 
          'security_settings', 'admin_sessions', 'query_runner', 'ui_gallery', 
          'activities', 'audit_trails'
        ];
        MENU_KEYS.forEach(k => {
          fullPerms[k] = {
            access: true,
            scope: ['dashboard', 'vehicles', 'transactions', 'recycle_bin'].includes(k) ? 'all' : undefined,
            actions: ['dashboard', 'sales_report', 'finance_report', 'activities', 'audit_trails'].includes(k) ? undefined : ['create', 'edit', 'delete']
          };
        });
        await role.update({ permissions: fullPerms });
        console.log(`Updated permissions for ${role.name}`);
      } else if (role.name === 'Admin Pusat') {
        const fullPerms = {};
        const MENU_KEYS = [
          'dashboard', 'sales_report', 'finance_report', 'brands', 'vehicles', 
          'transactions', 'offices', 'sales_agents', 'locations', 'promotions', 
          'showroom_settings', 'recycle_bin', 'user_management', 'role_management', 
          'security_settings', 'admin_sessions', 'query_runner', 'ui_gallery', 
          'activities', 'audit_trails'
        ];
        const superAdminOnlyKeys = [
          'brands', 'locations', 'recycle_bin', 'security_settings', 'admin_sessions', 
          'role_management', 'query_runner', 'ui_gallery', 'activities', 'audit_trails', 
          'showroom_settings'
        ];
        MENU_KEYS.forEach(k => {
          const isRestricted = superAdminOnlyKeys.includes(k);
          fullPerms[k] = {
            access: !isRestricted,
            scope: ['dashboard', 'vehicles', 'transactions', 'recycle_bin'].includes(k) ? 'all' : undefined,
            actions: ['dashboard', 'sales_report', 'finance_report', 'activities', 'audit_trails'].includes(k) ? undefined : ['create', 'edit', 'delete']
          };
        });
        await role.update({ permissions: fullPerms });
        console.log(`Updated permissions for ${role.name}`);
      } else if (role.name === 'Admin Cabang') {
        const branchPerms = {
          dashboard: { access: true, scope: 'branch' },
          vehicles: { access: true, scope: 'branch', actions: ['create', 'edit'] },
          transactions: { access: true, scope: 'branch', actions: ['create', 'edit'] },
          brands: { access: true, actions: [] },
          promotions: { access: true, actions: ['create', 'edit'] },
          activities: { access: true }
        };
        await role.update({ permissions: branchPerms });
        console.log(`Updated permissions for ${role.name}`);
      } else if (role.name === 'User Biasa') {
        const userPerms = {
          dashboard: { access: true, scope: 'own' },
          vehicles: { access: true, scope: 'own', actions: [] },
          transactions: { access: true, scope: 'own', actions: [] },
          activities: { access: true }
        };
        await role.update({ permissions: userPerms });
        console.log(`Updated permissions for ${role.name}`);
      }
    }
    console.log('Seeding default permissions completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding permissions:', error);
    process.exit(1);
  }
};

seedDefaultPermissions();
