const { Role } = require('../models');

// Create Role
const createRole = async (req, res) => {
  try {
    const { name, description } = req.body;
    const role = await Role.create(
      { name, description },
      { userId: req.user.id } // For Audit Log
    );
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Roles
const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Role
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const role = await Role.findByPk(id);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    await role.update(
      { name, description },
      { userId: req.user.id } // For Audit Log
    );
    
    res.json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Role
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    
    if (!role) return res.status(404).json({ message: 'Role not found' });

    await role.destroy({ userId: req.user.id }); // For Audit Log
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRole,
  getRoles,
  updateRole,
  deleteRole,
};
