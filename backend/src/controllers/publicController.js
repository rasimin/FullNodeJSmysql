const { Vehicle, VehicleImage, Office, ShowroomSetting, Location, Promotion } = require('../models');
const { Op } = require('sequelize');

exports.getShowroomBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const setting = await ShowroomSetting.findOne({
      where: { slug, is_published: true },
      include: [{
        model: Office,
        as: 'office',
        include: [{ model: Location, as: 'location' }]
      }]
    });

    if (!setting) {
      return res.status(404).json({ message: 'Showroom tidak ditemukan atau belum dipublikasi.' });
    }

    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicVehicles = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 12, size, brand, type, minPrice, maxPrice, officeId, search } = req.query;
    const finalLimit = parseInt(size || limit);

    const setting = await ShowroomSetting.findOne({ where: { slug, is_published: true } });
    if (!setting) return res.status(404).json({ message: 'Showroom not found' });

    // Get all sub-offices (branches)
    const branches = await Office.findAll({ where: { parent_id: setting.head_office_id }, attributes: ['id'] });
    const officeIds = [setting.head_office_id, ...branches.map(b => b.id)];

    const where = {
      is_deleted: false,
      status: { [Op.in]: ['Available', 'Booked', 'Sold'] },
      office_id: officeId ? parseInt(officeId) : { [Op.in]: officeIds }
    };

    if (brand) where.brand = brand;
    if (type) where.type = type;
    if (minPrice) where.price = { [Op.gte]: parseInt(minPrice) };
    if (maxPrice) where.price = { ...where.price, [Op.lte]: parseInt(maxPrice) };
    
    if (search) {
      where[Op.or] = [
        { brand: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
        { unit_code: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Vehicle.findAndCountAll({
      where,
      include: [
        { model: VehicleImage, as: 'images' },
        { 
          model: Office, 
          include: [{ model: Location, as: 'location' }] 
        }
      ],
      order: [['created_at', 'DESC']],
      limit: finalLimit,
      offset: (parseInt(page) - 1) * finalLimit,
      distinct: true
    });

    res.json({
      items: rows,
      totalPages: Math.ceil(count / finalLimit),
      totalItems: count
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicVehicleDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findOne({
      where: { id, is_deleted: false, status: { [Op.in]: ['Available', 'Booked', 'Sold'] } },
      include: [
        { model: VehicleImage, as: 'images' },
        { model: Office, include: [{ model: Location, as: 'location' }] }
      ]
    });

    if (!vehicle) return res.status(404).json({ message: 'Unit tidak ditemukan' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicPromotions = async (req, res) => {
  try {
    const { slug } = req.params;
    const setting = await ShowroomSetting.findOne({ where: { slug, is_published: true } });
    if (!setting) return res.status(404).json({ message: 'Showroom not found' });

    const branches = await Office.findAll({ where: { parent_id: setting.head_office_id }, attributes: ['id'] });
    const officeIds = [setting.head_office_id, ...branches.map(b => b.id)];

    const promotions = await Promotion.findAll({
      where: {
        office_id: { [Op.in]: officeIds },
        is_active: true,
        start_date: { [Op.lte]: new Date() },
        end_date: { [Op.gte]: new Date() }
      },
      order: [['created_at', 'DESC']]
    });

    res.json(promotions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicOffices = async (req, res) => {
  try {
    const { slug } = req.params;
    const setting = await ShowroomSetting.findOne({ where: { slug, is_published: true } });
    if (!setting) return res.status(404).json({ message: 'Showroom not found' });

    const offices = await Office.findAll({
      where: {
        [Op.or]: [
          { id: setting.head_office_id },
          { parent_id: setting.head_office_id }
        ]
      },
      include: [{ model: Location, as: 'location' }],
      order: [['type', 'ASC'], ['name', 'ASC']]
    });

    res.json(offices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicSalesAgents = async (req, res) => {
  try {
    const { officeId } = req.query;
    if (!officeId) return res.status(400).json({ message: 'Office ID required' });

    const { SalesAgent } = require('../models');
    const agents = await SalesAgent.findAll({
      where: { office_id: officeId, is_active: true },
      order: [['name', 'ASC']]
    });

    res.json(agents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicFilterOptions = async (req, res) => {
  try {
    const { slug } = req.params;
    const setting = await ShowroomSetting.findOne({ where: { slug, is_published: true } });
    if (!setting) return res.status(404).json({ message: 'Showroom not found' });

    const branches = await Office.findAll({ where: { parent_id: setting.head_office_id }, attributes: ['id'] });
    const officeIds = [setting.head_office_id, ...branches.map(b => b.id)];

    const { sequelize } = require('../models');
    const brands = await Vehicle.findAll({
      where: { office_id: { [Op.in]: officeIds }, is_deleted: false },
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('brand')), 'brand']],
      raw: true
    });

    const years = await Vehicle.findAll({
      where: { office_id: { [Op.in]: officeIds }, is_deleted: false },
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('year')), 'year']],
      raw: true,
      order: [['year', 'DESC']]
    });

    res.json({
      brands: brands.map(b => b.brand),
      years: years.map(y => y.year)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicBrands = async (req, res) => {
  try {
    const { VehicleBrand } = require('../models');
    const brands = await VehicleBrand.findAll({ order: [['name', 'ASC']] });
    res.json(brands);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
