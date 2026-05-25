const { Office } = require('../models');
const { Op } = require('sequelize');

const resolveDataScope = async (user, menuKey) => {
  const isSuperAdmin = user.Role?.name === 'Super Admin';
  
  // Default scopes:
  // If Super Admin, default is 'all'
  // If Head Office (no parent_id), default is 'branch' (they can see head office + all sub-branches)
  // If Branch Office, default is 'branch' (only see their own branch)
  let scope = 'branch'; // default
  
  if (isSuperAdmin) {
    scope = 'all';
  } else {
    const userPermissions = user.Role?.permissions;
    if (userPermissions && userPermissions[menuKey] && userPermissions[menuKey].access) {
      scope = userPermissions[menuKey].scope || 'branch';
    }
  }

  let officeIds = [];
  let userIdFilter = null;

  if (scope === 'all') {
    // Can see all offices
    const allOffices = await Office.findAll({ attributes: ['id'] });
    officeIds = allOffices.map(o => o.id);
  } else if (scope === 'branch') {
    // Can see their own office + branches under it (if they are head office)
    const currentOffice = await Office.findByPk(user.office_id);
    if (!currentOffice) {
      officeIds = [user.office_id];
    } else if (!currentOffice.parent_id) {
      // Head Office: see itself and all branches under it
      const allowedOffices = await Office.findAll({
        where: {
          [Op.or]: [
            { id: user.office_id },
            { parent_id: user.office_id }
          ]
        },
        attributes: ['id']
      });
      officeIds = allowedOffices.map(o => o.id);
    } else {
      // Branch Office: only see their own office
      officeIds = [user.office_id];
    }
  } else if (scope === 'own') {
    // Only see their own office AND data created by themselves
    officeIds = [user.office_id];
    userIdFilter = user.id;
  }

  return { officeIds, userIdFilter, scope };
};

module.exports = { resolveDataScope };
