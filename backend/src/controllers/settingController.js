const { SystemSetting, ActivityLog } = require('../models');

const getSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll({
      order: [['group', 'ASC'], ['key', 'ASC']]
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    const setting = await SystemSetting.findOne({ where: { key } });
    
    if (!setting) return res.status(404).json({ message: 'Setting not found' });
    if (!setting.is_editable) return res.status(403).json({ message: 'Setting is not editable' });

    const oldValue = setting.value;
    await setting.update({ value }, { userId: req.user.id });

    // Log the change
    await ActivityLog.create({
      user_id: req.user.id,
      action: 'Update Setting',
      details: { key, old_value: oldValue, new_value: value },
      ip_address: req.ip
    });

    res.json({ message: 'Setting updated successfully', setting });
  } catch (error) {
    res.status(500).json({ message: 'Error updating setting' });
  }
};

module.exports = { getSettings, updateSetting };
