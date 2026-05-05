require('dotenv').config({ path: '../.env' });
const { ShowroomSetting, Office, Location, Promotion } = require('./models');
const { Op } = require('sequelize');

async function test() {
  const slug = 'showroom-1';
  try {
    console.log('Testing ShowroomSetting...');
    const setting = await ShowroomSetting.findOne({ where: { slug, is_published: true } });
    if (!setting) {
        console.log('Showroom not found or not published');
        return;
    }
    console.log('Setting:', setting.id, 'HO ID:', setting.head_office_id);

    console.log('Testing Office.findAll...');
    const offices = await Office.findAll({
      where: {
        is_deleted: false,
        [Op.or]: [
          { id: setting.head_office_id },
          { parent_id: setting.head_office_id }
        ]
      },
      include: [{ model: Location, as: 'location' }],
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
    console.log('Offices found:', offices.length);

  } catch (err) {
    console.error('CRASHED:', err.message);
    console.error(err);
  } finally {
    process.exit();
  }
}

test();
