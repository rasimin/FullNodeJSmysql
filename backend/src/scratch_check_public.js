require('dotenv').config({ path: '../.env' });
const { ShowroomSetting, Office, Vehicle } = require('./models');
const { Op } = require('sequelize');

async function check() {
  try {
    const slug = 'showroom-1';
    const setting = await ShowroomSetting.findOne({ 
      where: { slug },
      include: [{ model: Office, as: 'office' }]
    });

    if (!setting) {
      console.log('No setting found for slug:', slug);
      return;
    }

    console.log('Setting Found:', {
      id: setting.id,
      slug: setting.slug,
      head_office_id: setting.head_office_id,
      is_published: setting.is_published,
      office_name: setting.office?.name
    });

    const branches = await Office.findAll({ where: { parent_id: setting.head_office_id }, attributes: ['id', 'name'] });
    const officeIds = [setting.head_office_id, ...branches.map(b => b.id)];
    console.log('Target Office IDs:', officeIds);

    const vehicleCount = await Vehicle.count({
      where: {
        is_deleted: false,
        status: { [Op.in]: ['Available', 'Booked', 'Sold'] },
        office_id: { [Op.in]: officeIds }
      }
    });

    console.log('Total Public Vehicles found:', vehicleCount);
    
    const sampleVehicles = await Vehicle.findAll({
        where: { office_id: { [Op.in]: officeIds } },
        limit: 5
    });
    console.log('Sample Vehicles Statuses:', sampleVehicles.map(v => v.status));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
