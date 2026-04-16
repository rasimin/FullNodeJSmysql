const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize, Vehicle, Office, User } = require('../models');

async function seedManyVehicles() {
  try {
    await sequelize.authenticate();
    console.log('🚀 Connected to database...');

    const office = await Office.findOne();
    const user = await User.findOne();

    if (!office || !user) {
      console.error('❌ Please seed offices and users first!');
      process.exit(1);
    }

    console.log(`📦 Generating 500 dummy vehicles for Office: ${office.name}...`);

    const types = ['Sedan', 'SUV', 'MPV', 'Hatchback', 'Pickup', 'Coupe', 'Electric'];
    const brands = ['Toyota', 'Honda', 'Mitsubishi', 'Suzuki', 'Daihatsu', 'Mazda', 'Hyundai', 'Wuling'];
    const models = {
      'Toyota': ['Avanza', 'Innova', 'Fortuner', 'Alphard', 'Yaris', 'Raize'],
      'Honda': ['CR-V', 'HR-V', 'Civic', 'Brio', 'City', 'BR-V'],
      'Mitsubishi': ['Pajero Sport', 'Xpander', 'Triton', 'Outlander'],
      'Suzuki': ['Ertiga', 'XL7', 'Jimny', 'Baleno'],
      'Daihatsu': ['Xenia', 'Terios', 'Rocky', 'Ayla'],
      'Mazda': ['CX-5', 'CX-3', 'Mazda 2', 'Mazda 3'],
      'Hyundai': ['Stargazer', 'Creta', 'Ioniq 5', 'Palisade'],
      'Wuling': ['Almaz', 'Cortez', 'Confero', 'Air EV']
    };
    const colors = ['Hitam', 'Putih', 'Silver', 'Abu-abu', 'Merah', 'Biru', 'Cokelat'];
    const transmissions = ['Automatic', 'Manual'];
    const fuels = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];

    const vehicles = [];
    for (let i = 1; i <= 500; i++) {
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const modelList = models[brand] || ['Generic'];
      const modelName = modelList[Math.floor(Math.random() * modelList.length)];
      
      vehicles.push({
        type: types[Math.floor(Math.random() * types.length)],
        brand: brand,
        model: modelName,
        year: 2015 + Math.floor(Math.random() * 9),
        plate_number: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${1000 + i} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        price: 150000000 + Math.floor(Math.random() * 500000000),
        purchase_price: 100000000 + Math.floor(Math.random() * 400000000),
        service_cost: Math.floor(Math.random() * 5000000),
        entry_date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
        status: i % 10 === 0 ? 'Sold' : (i % 15 === 0 ? 'Booked' : 'Available'),
        office_id: office.id,
        user_id: user.id,
        description: `Kendaraan dummy nomor ${i} untuk pengujian performa dashboard. Kondisi sangat baik.`,
        odometer: Math.floor(Math.random() * 100000),
        color: colors[Math.floor(Math.random() * colors.length)],
        transmission: transmissions[Math.floor(Math.random() * transmissions.length)],
        fuel_type: fuels[Math.floor(Math.random() * fuels.length)],
      });
    }

    // Bulk insert for speed
    await Vehicle.bulkCreate(vehicles);

    console.log('✅ Successfully seeded 500 vehicles!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedManyVehicles();
