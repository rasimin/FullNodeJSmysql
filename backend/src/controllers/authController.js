const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Role, Office, ActivityLog } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.Role.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password, role_id, office_id } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
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

    const user = await User.findOne({
      where: { email },
      include: [{ model: Role }, { model: Office }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    // Log Activity
    await ActivityLog.create({
      user_id: user.id,
      action: 'Login',
      details: { email: user.email },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.Role.name,
        office: user.Office ? user.Office.name : 'N/A'
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
        avatar: updatedUser.avatar,
        role: updatedUser.Role?.name,
        office: updatedUser.Office?.name
      }
    });
  } catch (error) {
    console.error('[Update Profile] Critical Error:', error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
};

module.exports = { register, login, getMe, updateProfile };
