const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { User, Role, Office, ActivityLog, UserSession, SystemSetting } = require('../models');
const { getSettings } = require('../utils/settings');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, role: user.Role.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, username, password, role_id, office_id } = req.body;

    if (!username) return res.status(400).json({ message: 'Username is required' });

    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          ...(email ? [{ email }] : []),
          { username }
        ]
      } 
    });
    
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(400).json({ message: `${field} already exists` });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email || null,
      username,
      password_hash,
      role_id,
      office_id,
    });
    
    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Fetch security settings
    const settings = await getSettings([
      'security_lockout_attempts', 
      'security_lockout_duration',
      'security_max_sessions',
      'security_single_session'
    ]);

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: email || '' },
          { username: email || '' }
        ]
      },
      include: [{ model: Role }, { model: Office }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    // Check Lockout
    if (user.locked_until && user.locked_until > new Date()) {
      const waitMins = Math.ceil((user.locked_until - new Date()) / 60000);
      return res.status(423).json({ 
        message: `Account is locked due to multiple failed attempts. Please try again in ${waitMins} minutes.` 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      // Increment failed attempts
      const newCount = (user.failed_login_count || 0) + 1;
      const maxAttempts = parseInt(settings.security_lockout_attempts || 5);
      
      let updateData = { failed_login_count: newCount };
      
      if (newCount >= maxAttempts) {
        const lockoutMins = parseInt(settings.security_lockout_duration || 30);
        updateData.locked_until = new Date(Date.now() + lockoutMins * 60000);
        updateData.failed_login_count = 0; // Reset for next cycle after lockout
      }
      
      await user.update(updateData);
      
      return res.status(401).json({ 
        message: isMatch ? 'Invalid credentials' : `Invalid credentials. ${maxAttempts - newCount} attempts remaining.` 
      });
    }

    // Login Success - Reset failed attempts
    await user.update({ failed_login_count: 0, locked_until: null });

    // Session Management
    const maxSessions = parseInt(settings.security_max_sessions || 3);
    const isSingleSession = settings.security_single_session === 'true';

    if (isSingleSession) {
      // Revoke all previous sessions
      await UserSession.update({ is_revoked: true }, { where: { user_id: user.id, is_revoked: false } });
    } else {
      // Check max sessions
      const activeSessionsCount = await UserSession.count({ where: { user_id: user.id, is_revoked: false } });
      if (activeSessionsCount >= maxSessions) {
        return res.status(403).json({ message: 'Maximum active devices reached. Please logout from other devices first.' });
      }
    }

    const token = generateToken(user);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Create Session
    await UserSession.create({
      user_id: user.id,
      token: token,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      expires_at: expiresAt
    });

    // Log Activity
    await ActivityLog.create({
      user_id: user.id,
      action: 'Login',
      details: { email: user.email, device: req.headers['user-agent'] },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.Role.name,
        office: user.Office ? user.Office.name : 'N/A',
        office_id: user.office_id,
        office_type: user.Office?.type,
        parent_office_id: user.Office?.parent_id,
        office_logo: user.Office?.logo,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Role }, { model: Office }]
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Catat Log SEGERA saat request masuk untuk tracing
    await ActivityLog.create({
      user_id: userId,
      action: 'Profile Update Attempt',
      details: { 
        received_body: req.body,
        has_file: !!req.file,
        timestamp: new Date().toISOString()
      },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    const { name, email, password } = req.body;
    console.log(`[Update Profile] Processing for User ID: ${userId}`);

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updateData = {};
    if (name) updateData.name = name;

    // Email update logic (Compare directly)
    if (email && email.trim() !== user.email) {
      const newEmail = email.trim();
      const emailExists = await User.findOne({ where: { email: newEmail } });
      if (emailExists && emailExists.id.toString() !== userId.toString()) {
        return res.status(400).json({ message: 'Email address is already in use' });
      }
      updateData.email = newEmail;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      updateData.avatar = `/uploads/${req.file.filename}`;
    }

    // Gunakan instance update agar lebih akurat
    if (Object.keys(updateData).length > 0) {
      await user.update(updateData, { 
        userId: userId, // Untuk Audit Trail
        individualHooks: true 
      });
    }

    // Refresh data untuk dikirim balik
    const updatedUser = await User.findByPk(userId, {
      include: [{ model: Role }, { model: Office }]
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        role: updatedUser.Role?.name,
        office: updatedUser.Office?.name,
        office_id: updatedUser.office_id,
        office_type: updatedUser.Office?.type,
        parent_office_id: updatedUser.Office?.parent_id
      }
    });
  } catch (error) {
    console.error('[Update Profile] Critical Error:', error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await UserSession.update({ is_revoked: true }, { where: { token } });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
};

const getSessions = async (req, res) => {
  try {
    const sessions = await UserSession.findAll({
      where: { user_id: req.user.id, is_revoked: false },
      order: [['createdAt', 'DESC']]
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
};

const revokeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await UserSession.findOne({ where: { id, user_id: req.user.id } });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    await session.update({ is_revoked: true });
    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to revoke session' });
  }
};

const revokeOtherSessions = async (req, res) => {
  try {
    const currentToken = req.headers.authorization?.split(' ')[1];
    await UserSession.update(
      { is_revoked: true },
      { 
        where: { 
          user_id: req.user.id, 
          is_revoked: false,
          token: { [Op.ne]: currentToken }
        } 
      }
    );
    res.json({ message: 'All other sessions revoked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to revoke other sessions' });
  }
};

const getUserSessions = async (req, res) => {
  try {
    const { id } = req.params;
    const sessions = await UserSession.findAll({
      where: { user_id: id, is_revoked: false },
      order: [['createdAt', 'DESC']]
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user sessions' });
  }
};

const revokeUserSession = async (req, res) => {
  try {
    const { id, sessionId } = req.params;
    const session = await UserSession.findOne({ where: { id: sessionId, user_id: id } });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    await session.update({ is_revoked: true });
    res.json({ message: 'User session revoked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to revoke user session' });
  }
};

const getAllActiveSessions = async (req, res) => {
  try {
    const sessions = await UserSession.findAll({
      where: { 
        is_revoked: false,
        expires_at: { [Op.gt]: new Date() }
      },
      include: [{ 
        model: User, 
        attributes: ['id', 'name', 'username', 'email', 'avatar'],
        include: [{ model: Role, attributes: ['name'] }, { model: Office, attributes: ['name'] }]
      }],
      order: [['createdAt', 'DESC']]
    });
    
    // Group sessions by user
    const usersWithSessions = {};
    sessions.forEach(s => {
      const u = s.User;
      if (!u) return;
      if (!usersWithSessions[u.id]) {
        usersWithSessions[u.id] = {
          user: u,
          sessions: []
        };
      }
      usersWithSessions[u.id].sessions.push(s);
    });
    
    res.json(Object.values(usersWithSessions));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch global sessions' });
  }
};

const revokeAnySession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await UserSession.findByPk(id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    await session.update({ is_revoked: true });
    res.json({ message: 'Session terminated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to terminate session' });
  }
};

module.exports = { 
  register, login, getMe, updateProfile, logout, 
  getSessions, revokeSession, revokeOtherSessions,
  getUserSessions, revokeUserSession,
  getAllActiveSessions, revokeAnySession
};
