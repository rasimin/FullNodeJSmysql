const { ActivityLog, AuditTrail, User } = require('../models');
const { getPagination, getPagingData } = require('../utils/pagination');

// Get Activity Logs
const getActivityLogs = async (req, res) => {
  try {
    const { page, size, user_id } = req.query;
    const { limit, offset } = getPagination(page, size);

    const condition = {};
    if (user_id) condition.user_id = user_id;

    const { count, rows } = await ActivityLog.findAndCountAll({
      where: condition,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [{ model: User, attributes: ['id', 'name'] }]
    });

    const response = getPagingData({ count, rows }, page, limit);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Audit Trails
const getAuditTrails = async (req, res) => {
  try {
    const { page, size, table_name, action, user_id } = req.query;
    const { limit, offset } = getPagination(page, size);

    const condition = {};
    if (table_name) condition.table_name = table_name;
    if (action) condition.action = action;
    if (user_id) condition.user_id = user_id;

    const { count, rows } = await AuditTrail.findAndCountAll({
      where: condition,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [{ model: User, attributes: ['id', 'name'] }]
    });

    const response = getPagingData({ count, rows }, page, limit);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getActivityLogs,
  getAuditTrails
};
