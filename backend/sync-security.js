const { DataTypes } = require('sequelize');
const sequelize = require('./src/config/database');
const { SystemSetting } = require('./src/models');

const syncSecurity = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    await sequelize.authenticate();
    console.log('Database connected.');

    // 1. Sync new tables (SystemSettings & UserSessions)
    // We use force: false to avoid deleting data
    await sequelize.sync({ force: false });
    console.log('New tables synchronized.');

    // 2. Add security columns to users table if they don't exist
    const userInfo = await queryInterface.describeTable('users');
    
    if (!userInfo.failed_login_count) {
      await queryInterface.addColumn('users', 'failed_login_count', {
        type: DataTypes.INTEGER,
        defaultValue: 0
      });
      console.log('Added failed_login_count column');
    }

    if (!userInfo.locked_until) {
      await queryInterface.addColumn('users', 'locked_until', {
        type: DataTypes.DATE,
        allowNull: true
      });
      console.log('Added locked_until column');
    }

    // 3. Seed default security settings if empty
    const defaultSettings = [
      { key: 'security_inactivity_timeout', value: '15', group: 'Security', description: 'Inactivity logout time in minutes' },
      { key: 'security_max_sessions', value: '3', group: 'Security', description: 'Maximum active devices per user' },
      { key: 'security_lockout_attempts', value: '5', group: 'Security', description: 'Failed login attempts before lockout' },
      { key: 'security_lockout_duration', value: '30', group: 'Security', description: 'Lockout duration in minutes' },
      { key: 'security_single_session', value: 'false', group: 'Security', description: 'Kick old sessions upon new login (true/false)' }
    ];

    for (const setting of defaultSettings) {
      const [record, created] = await SystemSetting.findOrCreate({
        where: { key: setting.key },
        defaults: setting
      });
      if (created) console.log(`Seeded default setting: ${setting.key}`);
    }

    console.log('Security synchronization complete.');
    process.exit(0);
  } catch (err) {
    console.error('Security sync failed:', err);
    process.exit(1);
  }
};

syncSecurity();
