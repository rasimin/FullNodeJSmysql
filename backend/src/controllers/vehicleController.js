const { Vehicle, Office, User, VehicleBrand, VehicleImage, sequelize } = require('../models');
const { Op } = require('sequelize');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const { getPagination, getPagingData } = require('../utils/pagination');

const getVehicles = async (req, res) => {
  try {
    const { page, size, search, officeId: filterOfficeId, type, status } = req.query;
    const { limit, offset } = getPagination(page, size);
    const user = req.user;
    const isSuperAdmin = user.Role?.name === 'Super Admin';
    const currentOffice = await Office.findByPk(user.office_id);
    let officeIds = [];

    // Logic Hierarki Kantor: Filter sesuai mapping
    if (isSuperAdmin) {
      // Super Admin: Bisa lihat semua unit atau berdasarkan filter spesifik
      if (filterOfficeId) {
        officeIds = [filterOfficeId];
      } else {
        const allOffices = await Office.findAll({ attributes: ['id'] });
        officeIds = allOffices.map(o => o.id);
      }
    } else if (!currentOffice.parent_id) {
       // Kantor Pusat: Bisa lihat dirinya sendiri + cabang-cabang di bawahnya
       const allowedOffices = await Office.findAll({
         where: {
           [Op.or]: [
             { id: user.office_id },
             { parent_id: user.office_id }
           ]
         },
         attributes: ['id']
       });
       const allowedIds = allowedOffices.map(o => o.id);

       if (filterOfficeId) {
         // Validasi apakah filterOfficeId masuk dalam mapping yang diizinkan
         if (allowedIds.includes(parseInt(filterOfficeId))) {
           officeIds = [filterOfficeId];
         } else {
           // Jika tidak punya akses ke cabang tersebut, default ke mapping miliknya
           officeIds = allowedIds;
         }
       } else {
         officeIds = allowedIds;
       }
    } else {
      // Kantor Cabang: Hanya bisa melihat datanya sendiri
      officeIds = [user.office_id];
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
        { model: User, attributes: ['name'] },
        { model: VehicleImage, as: 'images', attributes: ['id', 'image_url', 'is_primary'] }
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
    const user = req.user;
    let targetOfficeId = user.office_id;

    // Jika user kantor pusat, mereka bisa memilih office_id dari mapping mereka
    const currentOffice = await Office.findByPk(user.office_id);
    const isSuperAdmin = user.Role?.name === 'Super Admin';

    if (isSuperAdmin) {
      if (req.body.office_id) targetOfficeId = req.body.office_id;
    } else if (!currentOffice.parent_id) {
      if (req.body.office_id) {
        const allowedOffices = await Office.findAll({
          where: {
            [Op.or]: [{ id: user.office_id }, { parent_id: user.office_id }]
          },
          attributes: ['id']
        });
        const allowedIds = allowedOffices.map(o => o.id);
        
        if (allowedIds.includes(parseInt(req.body.office_id))) {
          targetOfficeId = req.body.office_id;
        } else {
          return res.status(403).json({ message: 'Anda tidak memiliki akses untuk input ke kantor ini' });
        }
      }
    }

    const vehicle = await Vehicle.create({
      ...req.body,
      user_id: user.id,
      office_id: targetOfficeId
    }, { userId: user.id });

    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const updateData = { ...req.body };
    
    // Auto-manage sold_date based on status change
    if (updateData.status === 'Sold' && vehicle.status !== 'Sold' && !updateData.sold_date) {
      updateData.sold_date = new Date().toISOString().split('T')[0];
    } else if (updateData.status && updateData.status !== 'Sold' && vehicle.status === 'Sold') {
      updateData.sold_date = null;
    }

    // Validate office_id if changing
    if (updateData.office_id && updateData.office_id !== vehicle.office_id) {
      const isSuperAdmin = user.Role?.name === 'Super Admin';
      const currentOffice = await Office.findByPk(user.office_id);

      if (isSuperAdmin) {
        // Skip validation for Super Admin
      } else if (currentOffice.parent_id) {
         // Branch user cannot change office_id of a vehicle (or only to their own which is redundant)
         if (updateData.office_id !== user.office_id) {
           return res.status(403).json({ message: 'Anda tidak memiliki akses untuk memindahkan unit ke kantor lain' });
         }
      } else {
        // Head office user validation
        const allowedOffices = await Office.findAll({
          where: {
            [Op.or]: [{ id: user.office_id }, { parent_id: user.office_id }]
          },
          attributes: ['id']
        });
        const allowedIds = allowedOffices.map(o => o.id);
        if (!allowedIds.includes(parseInt(updateData.office_id))) {
          return res.status(403).json({ message: 'Kantor tujuan tidak dalam mapping Anda' });
        }
      }
    }

    await vehicle.update(updateData, { 
      userId: user.id,
      individualHooks: true 
    });

    res.json({ message: 'Vehicle updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadVehicleImages = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByPk(id);
    
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

    // Cek batas total gambar 10
    const currentImagesCount = await VehicleImage.count({ where: { vehicle_id: id } });
    if (currentImagesCount + req.files.length > 10) {
      return res.status(400).json({ message: `Max 10 images allowed. You can only upload ${10 - currentImagesCount} more.` });
    }

    const uploadDir = path.join(__dirname, '../../uploads/vehicles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uploadedImages = [];
    
    for (const [index, file] of req.files.entries()) {
      const filename = `vehicle-${id}-${Date.now()}-${index}.webp`;
      const filepath = path.join(uploadDir, filename);

      // Resize, kompres jadi WebP agar hemat tempat  
      await sharp(file.buffer)
        .resize({ width: 800, height: 600, fit: 'inside' })
        .webp({ quality: 80 })
        .toFile(filepath);

      // Simpan path ke db
      const is_primary = currentImagesCount === 0 && index === 0; // yg pertama otomatis jadi primary jika kosong
      const vehicleImage = await VehicleImage.create({
        vehicle_id: id,
        image_url: `/uploads/vehicles/${filename}`,
        is_primary
      });
      uploadedImages.push(vehicleImage);
    }

    res.json({ message: 'Images uploaded successfully', images: uploadedImages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteVehicleImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const image = await VehicleImage.findOne({ where: { id: imageId, vehicle_id: id } });
    
    if (!image) return res.status(404).json({ message: 'Image not found' });

    // Hapus fisik
    const filepath = path.join(__dirname, '../..', image.image_url);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    await image.destroy();
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setPrimaryImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    
    // Reset semua primary jadi false
    await VehicleImage.update({ is_primary: false }, { where: { vehicle_id: id } });
    
    // Set yang dipilih jadi true
    await VehicleImage.update({ is_primary: true }, { where: { id: imageId, vehicle_id: id } });
    
    res.json({ message: 'Primary image updated' });
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
  uploadVehicleImages,
  deleteVehicleImage,
  setPrimaryImage,
  getBrands,
  getModelHistory,
  createBrand,
  updateBrand,
  deleteBrand,
  deleteVehicle
};
