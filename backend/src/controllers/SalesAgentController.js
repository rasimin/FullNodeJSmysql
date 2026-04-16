const { SalesAgent, Office, Vehicle, sequelize } = require('../models');
const { Op } = require('sequelize');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { getPagination, getPagingData } = require('../utils/pagination');

const generateSalesCode = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let code = '';
  for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  return code;
};

const getSalesAgents = async (req, res) => {
  try {
    const { page, size, search, officeId: filterOfficeId } = req.query;
    const { limit, offset } = getPagination(page, size);
    const user = req.user;
    const isSuperAdmin = user.Role?.name === 'Super Admin';
    const currentOffice = await Office.findByPk(user.office_id);
    let officeIds = [];

    // Mapping Hierarki Kantor
    if (isSuperAdmin) {
      if (filterOfficeId) {
        officeIds = [filterOfficeId];
      } else {
        const allOffices = await Office.findAll({ attributes: ['id'] });
        officeIds = allOffices.map(o => o.id);
      }
    } else if (!currentOffice.parent_id) {
      // Pusat: Bisa lihat unit di mapping pusat + cabang
      const allowedOffices = await Office.findAll({
        where: { [Op.or]: [{ id: user.office_id }, { parent_id: user.office_id }] },
        attributes: ['id']
      });
      const allowedIds = allowedOffices.map(o => o.id);
      officeIds = filterOfficeId && allowedIds.includes(parseInt(filterOfficeId)) ? [filterOfficeId] : allowedIds;
    } else {
      // Cabang: Hanya data sendiri
      officeIds = [user.office_id];
    }

    const condition = { office_id: { [Op.in]: officeIds } };
    if (search) {
      condition.name = { [Op.like]: `%${search}%` };
    }

    const { count, rows: agents } = await SalesAgent.findAndCountAll({
      where: condition,
      limit,
      offset,
      include: [{ model: Office, attributes: ['name'] }],
      order: [['name', 'ASC']]
    });

    res.json(getPagingData({ count, rows: agents }, page, limit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSalesAgent = async (req, res) => {
  try {
    const user = req.user;
    const isSuperAdmin = user.Role?.name === 'Super Admin';
    const currentOffice = await Office.findByPk(user.office_id);
    let targetOfficeId = user.office_id;

    if (req.body.office_id) {
      if (isSuperAdmin) {
        targetOfficeId = req.body.office_id;
      } else if (!currentOffice.parent_id) {
        const allowedOffices = await Office.findAll({
          where: { [Op.or]: [{ id: user.office_id }, { parent_id: user.office_id }] },
          attributes: ['id']
        });
        const allowedIds = allowedOffices.map(o => o.id);
        if (allowedIds.includes(parseInt(req.body.office_id))) {
          targetOfficeId = req.body.office_id;
        } else {
          return res.status(403).json({ message: 'Akses ditolak ke kantor tersebut' });
        }
      } else {
        targetOfficeId = user.office_id;
      }
    }

    let avatar_url = null;
    if (req.file) {
      const uploadDir = path.join(__dirname, '../../uploads/sales-agents');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filename = `avatar-${Date.now()}.webp`;
      const filepath = path.join(uploadDir, filename);

      await sharp(req.file.buffer)
        .resize(300, 300)
        .webp({ quality: 80 })
        .toFile(filepath);

      avatar_url = `/uploads/sales-agents/${filename}`;
    }

    const agent = await SalesAgent.create({
      ...req.body,
      office_id: targetOfficeId,
      avatar_url,
      sales_code: generateSalesCode()
    }, { userId: user.id });

    res.status(201).json(agent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSalesAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await SalesAgent.findByPk(id);
    if (!agent) return res.status(404).json({ message: 'Sales Agent not found' });

    const updateData = { ...req.body };

    if (req.file) {
      const uploadDir = path.join(__dirname, '../../uploads/sales-agents');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Hapus foto lama jika ada
      if (agent.avatar_url) {
        const oldPath = path.join(__dirname, '../..', agent.avatar_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      const filename = `avatar-${id}-${Date.now()}.webp`;
      const filepath = path.join(uploadDir, filename);

      await sharp(req.file.buffer)
        .resize(300, 300)
        .webp({ quality: 80 })
        .toFile(filepath);

      updateData.avatar_url = `/uploads/sales-agents/${filename}`;
    }
    
    await agent.update(updateData, { userId: req.user.id, individualHooks: true });
    res.json({ message: 'Sales Agent updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSalesAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await SalesAgent.findByPk(id);
    if (!agent) return res.status(404).json({ message: 'Sales Agent not found' });

    // Cek apakah agent sudah menjual barang
    const salesCount = await Vehicle.count({ where: { sales_agent_id: id } });
    if (salesCount > 0) {
      return res.status(400).json({ message: 'Cannot delete sales agent with existing sales records' });
    }

    await agent.destroy({ userId: req.user.id });
    res.json({ message: 'Sales Agent deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper untuk dropdown sales di frontend
const getActiveSalesAgents = async (req, res) => {
  try {
    const { officeId } = req.query;
    const condition = { status: 'Active' };
    
    if (officeId) {
      let headOfficeId = null;
      let current = await Office.findByPk(officeId);
      
      // Find the root (Head Office) of this branch's hierarchy
      while (current && current.parent_id) {
        current = await Office.findByPk(current.parent_id);
      }
      
      if (current && current.type === 'HEAD_OFFICE') {
        headOfficeId = current.id;
      }

      const officeIds = [parseInt(officeId)];
      if (headOfficeId && headOfficeId !== parseInt(officeId)) {
        officeIds.push(headOfficeId);
      }
      
      condition.office_id = { [Op.in]: officeIds };
    }

    const agents = await SalesAgent.findAll({
      where: condition,
      attributes: ['id', 'name', 'office_id', 'sales_code', 'phone', 'avatar_url'],
      include: [{ model: Office, attributes: ['name', 'parent_id'] }],
      order: [['name', 'ASC']]
    });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSalesAgents,
  createSalesAgent,
  updateSalesAgent,
  deleteSalesAgent,
  getActiveSalesAgents
};
