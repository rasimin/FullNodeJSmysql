const { Promotion, Office, User, Location } = require('../models');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

exports.getPromotions = async (req, res) => {
  try {
    const { office_id, status, placement } = req.query;
    const user = req.user || null;
    const isSuperAdmin = user?.Role?.name === 'Super Admin';
    const userOfficeId = user?.office_id;
    const userParentId = user?.Office?.parent_id;

    const where = {};
    
    if (user && !isSuperAdmin) {
      // Logic Hirarki Tertutup + Global Nasional:
      where[Op.or] = [
        { office_id: userOfficeId }, // Milik kantor sendiri
        { office_id: null },         // Promo Nasional (dari Super Admin)
        { 
          // Promo global dari Atasan (HO) saya
          [Op.and]: [
            { is_all_branches: true },
            { office_id: userParentId || -1 }
          ]
        },
        {
          // HO bisa melihat semua promo milik cabangnya (dengan filter join)
          '$Office.parent_id$': userOfficeId
        }
      ];

      // Jika melakukan filter ke kantor spesifik (misal dari Katalog)
      if (office_id) {
        // Kita perlu tahu parent_id dari kantor yang di-filter untuk menarik promo HO-nya
        const targetOffice = await Office.findByPk(office_id);
        const targetParentId = targetOffice?.parent_id;

        where[Op.or] = [
          { office_id: office_id }, // Promo cabang itu
          { office_id: null },      // Promo Nasional
          {
            // Promo global dari HO kantor tersebut
            [Op.and]: [
              { is_all_branches: true },
              { office_id: targetParentId || -1 }
            ]
          }
        ];
      }
    } else if (isSuperAdmin) {
      if (office_id) {
        const targetOffice = await Office.findByPk(office_id);
        const targetParentId = targetOffice?.parent_id;
        
        where[Op.or] = [
          { office_id: office_id },
          { office_id: null },
          {
            [Op.and]: [
              { is_all_branches: true },
              { office_id: targetParentId || -1 }
            ]
          }
        ];
      }
    } else {
      // AKSES PUBLIK (Tanpa Login)
      if (office_id) {
        const targetOffice = await Office.findByPk(office_id);
        const targetParentId = targetOffice?.parent_id;

        where[Op.or] = [
          { office_id: office_id }, 
          { office_id: null },      
          {
            [Op.and]: [
              { is_all_branches: true },
              { office_id: targetParentId || -1 }
            ]
          }
        ];
      } else {
        // Default: Hanya promo Nasional
        where.office_id = null;
      }
    }

    if (status !== undefined && status !== '') {
      where.is_active = status === 'true';
    }

    if (placement) {
      where.placement = placement;
    }

    const promotions = await Promotion.findAll({
      where,
      include: [
        { 
          model: Office, 
          include: [{ model: Location, as: 'location' }] 
        },
        { model: User, as: 'creator', attributes: ['name'] }
      ],
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    res.json(promotions);
  } catch (err) {
    console.error('Get Promotions Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.createPromotion = async (req, res) => {
  try {
    const { title, description, placement, target_url, start_date, end_date, priority, is_all_branches, office_id } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Promotion image is required' });
    }

    const uploadDir = path.join(__dirname, '../../uploads/promotions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname);
    const filename = `promo-${Date.now()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, req.file.buffer);

    const promotion = await Promotion.create({
      title,
      description,
      placement,
      target_url,
      start_date,
      end_date,
      priority: parseInt(priority) || 0,
      is_all_branches: is_all_branches === 'true',
      office_id: (req.user.Role?.name === 'Super Admin' && is_all_branches === 'true') ? null : (office_id || req.user.office_id),
      image_path: `/uploads/promotions/${filename}`,
      created_by: req.user.id
    }, { userId: req.user.id });

    res.status(201).json(promotion);
  } catch (err) {
    console.error('Create Promotion Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, placement, target_url, start_date, end_date, priority, is_active, is_all_branches, office_id } = req.body;
    
    const promotion = await Promotion.findByPk(id);
    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });

    const updateData = {
      title,
      description,
      placement,
      target_url,
      start_date,
      end_date,
      priority: parseInt(priority) || 0,
      is_active: is_active === 'true',
      is_all_branches: is_all_branches === 'true',
      office_id: (req.user.Role?.name === 'Super Admin' && is_all_branches === 'true') ? null : (office_id || promotion.office_id)
    };

    if (req.file) {
      const uploadDir = path.join(__dirname, '../../uploads/promotions');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const ext = path.extname(req.file.originalname);
      const filename = `promo-${Date.now()}${ext}`;
      const filepath = path.join(uploadDir, filename);

      fs.writeFileSync(filepath, req.file.buffer);

      // Delete old image
      const oldPath = path.join(__dirname, '../..', promotion.image_path);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

      updateData.image_path = `/uploads/promotions/${filename}`;
    }

    await promotion.update(updateData, { userId: req.user.id });
    res.json(promotion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await Promotion.findByPk(id);
    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });

    // Delete image file
    const absolutePath = path.join(__dirname, '../..', promotion.image_path);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await promotion.destroy({ userId: req.user.id });
    res.json({ message: 'Promotion deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await Promotion.findByPk(id);
    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });

    await promotion.update({ is_active: !promotion.is_active }, { userId: req.user.id });
    res.json(promotion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPromotionDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await Promotion.findByPk(id, {
      include: [
        {
          model: Office,
          include: [{ model: Location, as: 'location' }]
        },
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    if (!promotion) {
      return res.status(404).json({ message: 'Promo tidak ditemukan' });
    }

    res.json(promotion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
