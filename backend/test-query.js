const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Vehicle, Office, Location, User, SalesAgent, VehicleImage } = require('./src/models');
const { Op } = require('sequelize');

async function testQuery() {
  try {
    const vehicles = await Vehicle.findAndCountAll({
      limit: 10,
      offset: 0,
      distinct: true,
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
                      model: Location, as: 'parent'
                    }
                  ]
                }
              ]
            }
          ]
        },
        { model: User, attributes: ['name'] },
        { model: SalesAgent, as: 'salesAgent', attributes: ['name', 'sales_code'] },
        { model: VehicleImage, as: 'images', attributes: ['id', 'image_url', 'is_primary'] }
      ]
    });
    console.log('Success! Found:', vehicles.count);
  } catch (error) {
    console.error('FAILED:', error);
  }
  process.exit();
}

testQuery();
