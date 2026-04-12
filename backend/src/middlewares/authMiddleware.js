const jwt = require('jsonwebtoken');
const { User, Role, ActivityLog } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log(`[Auth] Blocked: No Authorization header for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Log setiap akses yang berhasil ter-otentikasi ke database agar user bisa lihat di System Log
    // (Kami buat ringan saja)
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role }],
    });

    if (!user || !user.is_active) {
      console.log(`[Auth] Blocked: User not found or inactive (ID: ${decoded.id})`);
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.Role?.name;
    if (!req.user || !userRole || !allowedRoles.includes(userRole)) {
      console.log(`[Auth] Forbidden: User ${req.user?.id} (${userRole}) tried to access ${req.originalUrl}. Allowed: ${allowedRoles}`);
      
      // Catat percobaan akses ilegal ke Activity Log agar user bisa tracing
      ActivityLog.create({
        user_id: req.user?.id || 0,
        action: 'Access Denied',
        details: { url: req.originalUrl, method: req.method, required_roles: allowedRoles, user_role: userRole },
        ip_address: req.ip
      }).catch(console.error);

      return res.status(403).json({ message: 'Forbidden: Insufficient Permissions' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
