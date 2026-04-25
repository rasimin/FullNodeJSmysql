const { ActivityLog, AuditTrail, User, sequelize } = require('../models');
const { Op } = require('sequelize');
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
    const { page, size, table_name, action, user_id, record_id } = req.query;
    const { limit, offset } = getPagination(page, size);

    const condition = {};
    if (table_name) condition.table_name = table_name;
    if (action) condition.action = action;
    if (user_id) condition.user_id = user_id;
    if (record_id) condition.record_id = record_id;

    const { vehicle_id } = req.query;
    if (vehicle_id) {
      // Use sequelize.literal() to avoid Sequelize's automatic JSON escaping on LIKE patterns.
      // Sequelize over-escapes quotes when the column type is JSON, making LIKE unusable.
      const vid = parseInt(vehicle_id); // sanitize to prevent SQL injection
      if (isNaN(vid)) return res.status(400).json({ message: 'Invalid vehicle_id' });

      condition[Op.or] = [
        { [Op.and]: [{ table_name: 'vehicles' }, { record_id: String(vid) }] },
        { 
          [Op.and]: [
            { table_name: { [Op.in]: ['vehicle_documents', 'vehicle_images', 'bookings'] } },
            sequelize.literal(`(
              old_values LIKE '%"vehicle_id":${vid}%' OR
              old_values LIKE '%"vehicle_id": ${vid}%' OR
              old_values LIKE '%"vehicle_id":"${vid}"%' OR
              old_values LIKE '%"vehicle_id": "${vid}"%' OR
              new_values LIKE '%"vehicle_id":${vid}%' OR
              new_values LIKE '%"vehicle_id": ${vid}%' OR
              new_values LIKE '%"vehicle_id":"${vid}"%' OR
              new_values LIKE '%"vehicle_id": "${vid}"%'
            )`)
          ]
        }
      ];
    }

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
