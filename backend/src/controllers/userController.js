const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Role, Office, ActivityLog } = require('../models');
const { getPagination, getPagingData } = require('../utils/pagination');

// Create User
const createUser = async (req, res) => {
  try {
    const { name, email, password, role_id, office_id } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create(
      { name, email, password_hash, role_id, office_id },
      { userId: req.user.id }
    );

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Users (with Pagination, Search, Filter)
const getUsers = async (req, res) => {
  try {
    const { page, size, search, role_id, office_id } = req.query;
    const { limit, offset } = getPagination(page, size);

    // Build query conditions
    const condition = {};
    
    if (search) {
      condition.name = { [Op.like]: `%${search}%` };
    }
    
    if (role_id) {
      condition.role_id = role_id;
    }

    if (office_id) {
      condition.office_id = office_id;
    }

    const { count, rows } = await User.findAndCountAll({
      where: condition,
      limit,
      offset,
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Role, attributes: ['id', 'name'] },
        { model: Office, attributes: ['id', 'name', 'type'] }
      ],
      order: [['created_at', 'DESC']]
    });

    const response = getPagingData({ count, rows }, page, limit);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get User By ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Role },
        { model: Office }
      ]
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role_id, office_id, is_active } = req.body;
    
    // Log Attempt
    await ActivityLog.create({
      user_id: req.user.id,
      action: 'Admin Update User Attempt',
      details: { target_id: id, incoming_data: req.body },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updateData = {};
    if (name) updateData.name = name;
    if (role_id) updateData.role_id = role_id;
    if (office_id) updateData.office_id = office_id;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Email update logic (Robust comparison)
    if (email && email.trim() !== user.email) {
      const newEmail = email.trim();
      const emailExists = await User.findOne({ where: { email: newEmail } });
      
      // Gunakan toString() untuk perbandingan BIGINT yang aman
      if (emailExists && emailExists.id.toString() !== id.toString()) {
        return res.status(400).json({ message: 'Email address already in use' });
      }
      updateData.email = newEmail;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }

    if (Object.keys(updateData).length > 0) {
      await user.update(updateData, { 
        userId: req.user.id,
        individualHooks: true 
      });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('[Admin Update] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy({ userId: req.user.id });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
