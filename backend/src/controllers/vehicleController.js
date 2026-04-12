const { Vehicle, Office, User, VehicleBrand, sequelize } = require('../models');
const { Op } = require('sequelize');

const { getPagination, getPagingData } = require('../utils/pagination');

const getVehicles = async (req, res) => {
  try {
    const { page, size, search, officeId: filterOfficeId, type, status } = req.query;
    const { limit, offset } = getPagination(page, size);
    const user = req.user;

    let officeIds = [user.office_id];
    const currentOffice = await Office.findByPk(user.office_id);
    
    // Logic Hierarki Kantor
    if (!currentOffice.parent_id) {
       if (filterOfficeId) {
         officeIds = [filterOfficeId]; // Head Office filter cabang tertentu
       } else {
         const allOffices = await Office.findAll({ attributes: ['id'] });
         officeIds = allOffices.map(o => o.id);
       }
    }

    const condition = {
      office_id: { [Op.in]: officeIds }
    };

    if (search) {
      condition[Op.or] = [
        { brand: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
        { plate_number: { [Op.like]: `%${search}%` } },
      ];
    }

    if (type) condition.type = type;
    if (status) condition.status = status;

    const { count, rows: vehicles } = await Vehicle.findAndCountAll({
      where: condition,
      limit,
      offset,
      include: [
        { model: Office, attributes: ['name'] },
        { model: User, attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(getPagingData({ count, rows: vehicles }, page, limit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    await vehicle.destroy({ userId: req.user.id });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create({
      ...req.body,
      user_id: req.user.id,
      office_id: req.user.office_id // Default ke kantor si pembuat
    }, { userId: req.user.id });

    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    await vehicle.update(req.body, { 
      userId: req.user.id,
      individualHooks: true 
    });

    res.json({ message: 'Vehicle updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBrands = async (req, res) => {
  try {
    const brands = await VehicleBrand.findAll({ order: [['name', 'ASC']] });
    res.json(brands);
  } catch (error) {
    console.error('getBrands Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getModelHistory = async (req, res) => {
  try {
    const models = await Vehicle.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('model')), 'model']],
      order: [['model', 'ASC']]
    });
    res.json(models.map(m => m.model));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBrand = async (req, res) => {
  try {
    const brand = await VehicleBrand.create(req.body, { userId: req.user.id });
    res.status(201).json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await VehicleBrand.findByPk(id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    await brand.update(req.body, { userId: req.user.id, individualHooks: true });
    res.json({ message: 'Brand updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await VehicleBrand.findByPk(id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    await brand.destroy({ userId: req.user.id });
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVehicles,
  createVehicle,
  updateVehicle,
  getBrands,
  getModelHistory,
  createBrand,
  updateBrand,
  deleteBrand,
  deleteVehicle
};
