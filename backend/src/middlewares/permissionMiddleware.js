const checkPermission = (menuKey, requiredAction = 'view') => {
  return (req, res, next) => {
    const userRole = req.user?.Role?.name;
    
    // Super Admin & Admin are bypassed by default
    if (userRole === 'Super Admin') {
      return next();
    }

    let permissions = req.user?.Role?.permissions;
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch (e) {
        permissions = null;
      }
    }
    if (!permissions) {
      return res.status(403).json({ message: 'Akses ditolak: Hak akses belum dikonfigurasi untuk role ini' });
    }

    const menuPermission = permissions[menuKey];
    if (!menuPermission || !menuPermission.access) {
      return res.status(403).json({ message: `Akses ditolak: Anda tidak memiliki akses ke menu ${menuKey}` });
    }

    // Check action if not view
    if (requiredAction !== 'view') {
      const actions = menuPermission.actions || [];
      if (!actions.includes(requiredAction)) {
        return res.status(403).json({ message: `Izin ditolak: Anda tidak memiliki izin untuk melakukan tindakan '${requiredAction}'` });
      }
    }

    next();
  };
};

module.exports = { checkPermission };
