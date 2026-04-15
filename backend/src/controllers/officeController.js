const { Office } = require('../models');
const { Op } = require('sequelize');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const createOffice = async (req, res) => {
  try {
    const { name, type, address, parent_id, phone } = req.body;
    
    // Validate hierarchy
    if (type === 'BRANCH_OFFICE' && !parent_id) {
      return res.status(400).json({ message: 'Branch Office must have a Parent Office (Head Office)' });
    }

    const officeData = { name, type, address, parent_id, phone };
    
    // Normalize parent_id
    if (!officeData.parent_id || officeData.parent_id === 'null' || officeData.parent_id === '') {
      officeData.parent_id = null;
    }

    if (req.file) {
      console.log('[OfficeCreate] File received:', req.file.filename);
      // Fallback: use raw file first
      officeData.logo = `/uploads/${req.file.filename}`;

      try {
        const fileName = `logo-${Date.now()}.webp`;
        const outputPath = path.join(__dirname, '../../uploads', fileName);
        
        await sharp(req.file.path)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outputPath);

        // Remove original file
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        
        officeData.logo = `/uploads/${fileName}`;
        console.log('[OfficeCreate] Sharp processing success:', fileName);
      } catch (sharpError) {
        console.error('[OfficeCreate] Sharp Image Processing Error:', sharpError);
      }
    } else {
      console.log('[OfficeCreate] No file received');
    }

    const office = await Office.create(
      officeData,
      { userId: req.user.id }
    );
    res.status(201).json(office);
  } catch (error) {
    console.error('Create Office Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getOffices = async (req, res) => {
  try {
    const user = req.user;
    const currentOffice = await Office.findByPk(user.office_id);

    let condition = {};
    const isSuperAdmin = user.Role?.name === 'Super Admin';

    if (isSuperAdmin) {
      // Super Admin: Can see everything
      condition = {};
    } else if (currentOffice.parent_id) {
      // Branch user: only their own office
      condition = { id: user.office_id };
    } else {
      // Head office user: their office + branches
      condition = {
        [Op.or]: [
          { id: user.office_id },
          { parent_id: user.office_id }
        ]
      };
    }

    const offices = await Office.findAll({
      where: condition,
      include: [
        {
          model: Office,
          as: 'parent',
          attributes: ['id', 'name']
        },
        {
          model: Office,
          as: 'branches',
          attributes: ['id', 'name']
        }
      ]
    });
    res.json(offices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const office = await Office.findByPk(id);

    if (!office) return res.status(404).json({ message: 'Office not found' });

    const { name, type, address, parent_id, phone } = req.body;
    const updateData = { name, type, address, parent_id, phone };
    
    // Convert empty parent_id to null
    if (updateData.parent_id === '' || updateData.parent_id === 'null' || !updateData.parent_id) {
      updateData.parent_id = null;
    }

    if (req.file) {
      console.log('[OfficeUpdate] File received:', req.file.filename);
      // Fallback: use raw file first
      updateData.logo = `/uploads/${req.file.filename}`;
      
      try {
        const fileName = `logo-${Date.now()}.webp`;
        const outputPath = path.join(__dirname, '../../uploads', fileName);
        
        await sharp(req.file.path)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outputPath);

        // Remove original file
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        
        // Delete old logo if exists
        if (office.logo) {
          const relativePath = office.logo.startsWith('/') ? office.logo.slice(1) : office.logo;
          const oldLogoPath = path.join(__dirname, '../../', relativePath);
          if (fs.existsSync(oldLogoPath)) fs.unlinkSync(oldLogoPath);
        }

        updateData.logo = `/uploads/${fileName}`;
        console.log('[OfficeUpdate] Sharp processing success:', fileName);
      } catch (sharpError) {
        console.error('[OfficeUpdate] Sharp Processing Error:', sharpError);
        // We keep the raw upload path if sharp fails
      }
    } else {
      console.log('[OfficeUpdate] No file received in request');
    }

    await office.update(updateData, { userId: req.user.id });
    res.json(office);
  } catch (error) {
    console.error('Update Office Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const office = await Office.findByPk(id);

    if (!office) return res.status(404).json({ message: 'Office not found' });

    // Prevent deletion if it has branches or users attached (though FK constraints might handle this, it's good to be explicit)
    const branches = await Office.count({ where: { parent_id: id } });
    if (branches > 0) {
      return res.status(400).json({ message: 'Cannot delete Office with existing branches' });
    }

    await office.destroy({ userId: req.user.id });
    res.json({ message: 'Office deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOffice,
  getOffices,
  updateOffice,
  deleteOffice
};
