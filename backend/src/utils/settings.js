const { SystemSetting } = require('../models');

/**
 * Get a single system setting value by key
 * @param {string} key 
 * @param {any} defaultValue 
 * @returns {Promise<string>}
 */
const getSetting = async (key, defaultValue = null) => {
  try {
    const setting = await SystemSetting.findOne({ where: { key } });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Get multiple settings as an object
 * @param {string[]} keys 
 * @returns {Promise<object>}
 */
const getSettings = async (keys) => {
  try {
    const settings = await SystemSetting.findAll({ where: { key: keys } });
    const config = {};
    settings.forEach(s => { config[s.key] = s.value; });
    return config;
  } catch (error) {
    console.error(`Error fetching settings:`, error);
    return {};
  }
};

module.exports = { getSetting, getSettings };
