const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Role, Office, ActivityLog } = require('../models');
const { getPagination, getPagingData } = require('../utils/pagination');

// Create User
const createUser = async (req, res) => {
  try {
    const { name, email, username, password, role_id, office_id } = req.body;
    const currentUser = req.user;
    const currentOffice = await Office.findByPk(currentUser.office_id);

    if (!username) return res.status(400).json({ message: 'Username is required' });

    // Pengecekan Izin Berdasarkan Role & Hirarki
    if (currentUser.Role?.name !== 'Super Admin') {
      // 1. User cabang sama sekali tidak bisa buat user
      if (currentOffice.parent_id) {
        return res.status(403).json({ message: 'User kantor cabang tidak diperbolehkan menambah user baru' });
      }

      // 2. Admin Pusat hanya bisa buat user di hiarkinya (diri sendiri + cabang di bawahnya)
      const allowedOffices = await Office.findAll({
        where: {
          [Op.or]: [
            { id: currentUser.office_id },
            { parent_id: currentUser.office_id }
          ]
        },
        attributes: ['id']
      });
      const allowedIds = allowedOffices.map(o => o.id);
      if (!allowedIds.includes(parseInt(office_id))) {
        return res.status(403).json({ message: 'Anda hanya bisa membuat user untuk kantor di bawah naungan Anda' });
      }
    }

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

    const user = await User.create(
      { name, email: email || null, username, password_hash, role_id, office_id },
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
    const currentUser = req.user;
    const isSuperAdmin = currentUser.Role?.name === 'Super Admin';
    
    // Only fetch current office if NOT Super Admin (to determined hierarchy visibility)
    let currentOffice = null;
    if (!isSuperAdmin) {
      currentOffice = await Office.findByPk(currentUser.office_id);
    }

    console.log(`[getUsers] Fetching for: ${currentUser.username}${isSuperAdmin ? ' (SuperAdmin)' : ''}`);

    const condition = {};

    if (!isSuperAdmin) {
      if (currentOffice && currentOffice.parent_id) {
        condition.office_id = currentUser.office_id;
      } else {
        const allowedOffices = await Office.findAll({
          where: { [Op.or]: [{ id: currentUser.office_id }, { parent_id: currentUser.office_id }] },
          attributes: ['id']
        });
        const allowedIds = allowedOffices.map(o => o.id);
        if (office_id) {
           condition.office_id = allowedIds.includes(parseInt(office_id)) ? office_id : { [Op.in]: allowedIds };
        } else {
           condition.office_id = { [Op.in]: allowedIds };
        }
      }
    } else if (office_id) {
      condition.office_id = office_id;
    }
    
    if (search) {
      condition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (role_id) condition.role_id = role_id;

    const { count, rows } = await User.findAndCountAll({
      where: condition,
      limit,
      offset,
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Role, attributes: ['id', 'name'] },
        { model: Office, attributes: ['id', 'name', 'type'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(getPagingData({ count, rows }, page, limit));
  } catch (error) {
    console.error('[getUsers] Error:', error);
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
    const { name, email, username, password, role_id, office_id, is_active } = req.body;
    
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
    if (username) updateData.username = username;
    if (role_id) updateData.role_id = role_id;
    if (office_id) updateData.office_id = office_id;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Email update logic (Robust comparison)
    if (email !== undefined && email !== user.email) {
      const newEmail = email ? email.trim() : null;
      if (newEmail) {
        const emailExists = await User.findOne({ where: { email: newEmail } });
        if (emailExists && emailExists.id.toString() !== id.toString()) {
          return res.status(400).json({ message: 'Email address already in use' });
        }
      }
      updateData.email = newEmail;
    }

    // Username update logic
    if (username && username.trim() !== user.username) {
      const newUsername = username.trim();
      const usernameExists = await User.findOne({ where: { username: newUsername } });
      if (usernameExists && usernameExists.id.toString() !== id.toString()) {
        return res.status(400).json({ message: 'Username already in use' });
      }
      updateData.username = newUsername;
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
