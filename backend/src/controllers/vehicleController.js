const { Vehicle, Office, User, VehicleBrand, SalesAgent, VehicleImage, Booking, Location, sequelize } = require('../models');
const { Op } = require('sequelize');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const { getPagination, getPagingData } = require('../utils/pagination');

const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByPk(id, {
      include: [
        { 
          model: Office, 
          attributes: ['id', 'name', 'parent_id', 'address', 'region_code'],
          include: [
            {
              model: Location, as: 'location',
              include: [
                {
                  model: Location, as: 'parent',
                  include: [
                    {
                      model: Location, as: 'parent',
                      include: [{ model: Location, as: 'parent' }]
                    }
                  ]
                }
              ]
            }
          ]
        },
        { model: User, attributes: ['name'] },
        { model: SalesAgent, as: 'salesAgent', attributes: ['name', 'sales_code'] },
        { 
          model: Booking, 
          limit: 1, 
          order: [['created_at', 'DESC']],
          attributes: ['id', 'status', 'cancellation_reason', 'notes', 'down_payment', 'customer_name']
        },
        { model: VehicleImage, as: 'images', attributes: ['id', 'image_url', 'is_primary'] }
      ]
    });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    console.error('Error in getVehicleById:', error);
    res.status(500).json({ message: error.message });
  }
};

const getVehicles = async (req, res) => {
  try {
    const { page, size, search, officeId: filterOfficeId, type, status, minPrice, maxPrice, locationId, brand, year } = req.query;
    const { limit, offset } = getPagination(page, size);
    const user = req.user;
    const isSuperAdmin = user.Role?.name === 'Super Admin';
    const currentOffice = await Office.findByPk(user.office_id);
    let officeIds = [];

    // Safety check for currentOffice
    if (!isSuperAdmin && !currentOffice) {
      return res.status(403).json({ message: 'User office not found' });
    }

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
    
    // --- Added: Hierarchical Location Filter ---
    let regionCodes = [];
    if (locationId) {
      const allResultIds = new Set([parseInt(locationId)]);
      let currentBatch = [parseInt(locationId)];
      while (currentBatch.length > 0) {
        const children = await Location.findAll({
          where: { parent_id: { [Op.in]: currentBatch } },
          attributes: ['id']
        });
        if (children.length === 0) break;
        const newIds = children.map(c => c.id);
        newIds.forEach(id => allResultIds.add(id));
        currentBatch = newIds;
      }
      
      const locations = await Location.findAll({
        where: { id: { [Op.in]: [...allResultIds] } },
        attributes: ['region_code']
      });
      regionCodes = locations.map(l => l.region_code).filter(Boolean);
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
    if (brand) condition.brand = brand;
    if (year) condition.year = year;

    if (minPrice || maxPrice) {
      condition.price = {};
      if (minPrice) condition.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) condition.price[Op.lte] = parseFloat(maxPrice);
    }

    const officeIncludeCondition = { 
      model: Office, 
      attributes: ['id', 'name', 'parent_id', 'address', 'region_code'],
      include: [
        {
          model: Location, as: 'location',
          include: [
            {
              model: Location, as: 'parent',
              include: [
                {
                  model: Location, as: 'parent',
                  include: [{ model: Location, as: 'parent' }]
                }
              ]
            }
          ]
        }
      ]
    };

    if (regionCodes.length > 0) {
      officeIncludeCondition.where = {
        region_code: { [Op.in]: regionCodes }
      };
    }

    const { count, rows: vehicles } = await Vehicle.findAndCountAll({
      where: condition,
      limit,
      offset,
      distinct: true,
      include: [
        officeIncludeCondition,
        { model: User, attributes: ['name'] },
        { 
          model: SalesAgent, as: 'salesAgent', attributes: ['name', 'sales_code'] 
        },
        { 
          model: Booking, 
          limit: 1, 
          order: [['created_at', 'DESC']],
          attributes: ['id', 'status', 'cancellation_reason', 'notes', 'down_payment', 'customer_name']
        },
        { model: VehicleImage, as: 'images', attributes: ['id', 'image_url', 'is_primary'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(getPagingData({ count, rows: vehicles }, page, limit));
  } catch (error) {
    console.error('Error in getVehicles:', error);
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

    // Sanitize empty strings to null for association fields
    ['sales_agent_id', 'office_id'].forEach(field => {
      if (req.body[field] === '') req.body[field] = null;
    });

    const vehicle = await Vehicle.create({
      ...req.body,
      user_id: user.id,
      office_id: targetOfficeId,
      purchase_price: req.body.purchase_price || 0,
      service_cost: req.body.service_cost || 0
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

    // Sanitize update data: ensure numeric fields are numbers/null and remove non-column keys
    const allowedFields = [
      'type', 'brand', 'model', 'year', 'plate_number', 'price', 'status',
      'purchase_price', 'service_cost', 'sold_date', 'entry_date',
      'description', 'office_id', 'sales_agent_id', 'color', 'odometer',
      'transmission', 'fuel_type'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        let val = req.body[field];
        // Handle empty strings for numeric/date fields
        if (val === '' || val === null) {
          if (['price', 'year', 'purchase_price', 'service_cost', 'odometer', 'office_id', 'sales_agent_id'].includes(field)) {
             val = (['price', 'year', 'office_id'].includes(field)) ? vehicle[field] : null; // Keep existing if required, else null
          } else {
             val = null;
          }
        }
        updateData[field] = val;
      }
    });
    
    // Auto-manage sold_date based on status change
    if (updateData.status === 'Sold' && vehicle.status !== 'Sold' && !updateData.sold_date) {
      updateData.sold_date = new Date().toISOString().split('T')[0];
    } else if (updateData.status && updateData.status !== 'Sold' && vehicle.status === 'Sold') {
      updateData.sold_date = null;
    }

    // Validate office_id if changing
    if (updateData.office_id && parseInt(updateData.office_id) !== vehicle.office_id) {
      const isSuperAdmin = user.Role?.name === 'Super Admin';
      const currentOffice = user.office_id ? await Office.findByPk(user.office_id) : null;

      if (isSuperAdmin) {
        // Skip validation for Super Admin
      } else if (currentOffice && currentOffice.parent_id) {
         // Branch user cannot change office_id of a vehicle
         if (parseInt(updateData.office_id) !== user.office_id) {
           return res.status(403).json({ message: 'Anda tidak memiliki akses untuk memindahkan unit ke kantor lain' });
         }
      } else if (currentOffice) {
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

    // Update cancellation reason in the latest booking if provided
    if (req.body.cancellation_reason !== undefined) {
      const lastBooking = await Booking.findOne({
        where: { vehicle_id: id },
        order: [['created_at', 'DESC']]
      });
      if (lastBooking) {
        await lastBooking.update({ cancellation_reason: req.body.cancellation_reason }, { userId: user.id });
      }
    }

    res.json({ message: 'Vehicle updated successfully' });
  } catch (error) {
    console.error('Update Vehicle Error:', error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      error: error
    });
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
    const { page, size, search } = req.query;
    const { limit, offset } = getPagination(page, size);

    const condition = {};
    if (search) {
      condition.name = { [Op.like]: `%${search}%` };
    }

    // If no page and no search, return simple list for dropdowns
    if (!page && !search) {
      const allBrands = await VehicleBrand.findAll({
        order: [['name', 'ASC']]
      });
      return res.json(allBrands);
    }

    const { count, rows } = await VehicleBrand.findAndCountAll({
      where: condition,
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    res.json(getPagingData({ count, rows }, page, limit));
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

const getTypeHistory = async (req, res) => {
  try {
    const types = await Vehicle.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('type')), 'type']],
      order: [['type', 'ASC']]
    });
    res.json(types.map(t => t.type));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getYearHistory = async (req, res) => {
  try {
    const years = await Vehicle.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('year')), 'year']],
      order: [['year', 'DESC']]
    });
    res.json(years.map(y => y.year));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFilterOptions = async (req, res) => {
  try {
    const brands = await Vehicle.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('brand')), 'brand']],
      order: [['brand', 'ASC']]
    });
    const years = await Vehicle.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('year')), 'year']],
      order: [['year', 'DESC']]
    });
    res.json({
      brands: brands.map(b => b.brand),
      years: years.map(y => y.year)
    });
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
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getVehicleSummary = async (req, res) => {
  try {
    const user = req.user;
    const isSuperAdmin = user.Role?.name === 'Super Admin';
    const currentOffice = await Office.findByPk(user.office_id);
    let officeIds = [];

    // Gunakan logika hierarki yang sama dengan getVehicles
    if (isSuperAdmin) {
      const allOffices = await Office.findAll({ attributes: ['id'] });
      officeIds = allOffices.map(o => o.id);
    } else if (currentOffice && !currentOffice.parent_id) {
       const allowedOffices = await Office.findAll({
         where: { [Op.or]: [{ id: user.office_id }, { parent_id: user.office_id }] },
         attributes: ['id']
       });
       officeIds = allowedOffices.map(o => o.id);
    } else {
       officeIds = [user.office_id];
    }

    const summary = await Vehicle.findAll({
      where: { office_id: officeIds },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const response = {
      available: 0,
      booking: 0,
      sold: 0,
      total: 0
    };

    summary.forEach(item => {
      const status = item.get('status');
      const count = parseInt(item.get('count'));
      if (status === 'Available') response.available = count;
      if (status === 'Booked') response.booking = count;
      if (status === 'Sold') response.sold = count;
      response.total += count;
    });

    res.json(response);
  } catch (error) {
    console.error('Summary Error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadVehicleImages,
  deleteVehicleImage,
  setPrimaryImage,
  getBrands,
  getModelHistory,
  getTypeHistory,
  createBrand,
  updateBrand,
  deleteBrand,
  getVehicleSummary,
  getYearHistory,
  getFilterOptions
};
