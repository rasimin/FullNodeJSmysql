const { User, Role, Office, ActivityLog } = require('../models');

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalRoles = await Role.count();
    const totalOffices = await Office.count();
    
    // Recent activities (last 5)
    const recentActivities = await ActivityLog.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: User, attributes: ['name', 'avatar'] }]
    });

    res.json({
      totalUsers,
      totalRoles,
      totalOffices,
      recentActivities
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDashboardStats };
