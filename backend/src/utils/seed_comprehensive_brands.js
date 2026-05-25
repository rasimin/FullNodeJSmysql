const { VehicleBrand } = require('../models');

const comprehensiveBrands = [
  // Japanese Cars & Motorcycles
  { name: 'Toyota', for_car: true, for_motorcycle: false },
  { name: 'Honda', for_car: true, for_motorcycle: true },
  { name: 'Suzuki', for_car: true, for_motorcycle: true },
  { name: 'Yamaha', for_car: false, for_motorcycle: true },
  { name: 'Kawasaki', for_car: false, for_motorcycle: true },
  { name: 'Mitsubishi', for_car: true, for_motorcycle: false },
  { name: 'Nissan', for_car: true, for_motorcycle: false },
  { name: 'Mazda', for_car: true, for_motorcycle: false },
  { name: 'Subaru', for_car: true, for_motorcycle: false },
  { name: 'Daihatsu', for_car: true, for_motorcycle: false },
  { name: 'Lexus', for_car: true, for_motorcycle: false },
  { name: 'Infiniti', for_car: true, for_motorcycle: false },
  { name: 'Acura', for_car: true, for_motorcycle: false },
  { name: 'Isuzu', for_car: true, for_motorcycle: false },
  { name: 'Mitsuoka', for_car: true, for_motorcycle: false },

  // European Cars
  { name: 'BMW', for_car: true, for_motorcycle: true },
  { name: 'Mercedes-Benz', for_car: true, for_motorcycle: false },
  { name: 'Audi', for_car: true, for_motorcycle: false },
  { name: 'Volkswagen', for_car: true, for_motorcycle: false },
  { name: 'Porsche', for_car: true, for_motorcycle: false },
  { name: 'Opel', for_car: true, for_motorcycle: false },
  { name: 'Volvo', for_car: true, for_motorcycle: false },
  { name: 'Polestar', for_car: true, for_motorcycle: false },
  { name: 'Peugeot', for_car: true, for_motorcycle: true },
  { name: 'Citroen', for_car: true, for_motorcycle: false },
  { name: 'Renault', for_car: true, for_motorcycle: false },
  { name: 'Bugatti', for_car: true, for_motorcycle: false },
  { name: 'Alpine', for_car: true, for_motorcycle: false },
  { name: 'Fiat', for_car: true, for_motorcycle: false },
  { name: 'Alfa Romeo', for_car: true, for_motorcycle: false },
  { name: 'Maserati', for_car: true, for_motorcycle: false },
  { name: 'Ferrari', for_car: true, for_motorcycle: false },
  { name: 'Lamborghini', for_car: true, for_motorcycle: false },
  { name: 'Lancia', for_car: true, for_motorcycle: false },
  { name: 'Pagani', for_car: true, for_motorcycle: false },
  { name: 'Abarth', for_car: true, for_motorcycle: false },
  { name: 'Aston Martin', for_car: true, for_motorcycle: false },
  { name: 'Bentley', for_car: true, for_motorcycle: false },
  { name: 'Rolls-Royce', for_car: true, for_motorcycle: false },
  { name: 'Jaguar', for_car: true, for_motorcycle: false },
  { name: 'Land Rover', for_car: true, for_motorcycle: false },
  { name: 'McLaren', for_car: true, for_motorcycle: false },
  { name: 'Mini', for_car: true, for_motorcycle: false },
  { name: 'Lotus', for_car: true, for_motorcycle: false },
  { name: 'Koenigsegg', for_car: true, for_motorcycle: false },
  { name: 'Skoda', for_car: true, for_motorcycle: false },
  { name: 'Seat', for_car: true, for_motorcycle: false },
  { name: 'Cupra', for_car: true, for_motorcycle: false },
  { name: 'Dacia', for_car: true, for_motorcycle: false },

  // American Cars
  { name: 'Ford', for_car: true, for_motorcycle: false },
  { name: 'Chevrolet', for_car: true, for_motorcycle: false },
  { name: 'Dodge', for_car: true, for_motorcycle: false },
  { name: 'Jeep', for_car: true, for_motorcycle: false },
  { name: 'Tesla', for_car: true, for_motorcycle: false },
  { name: 'Cadillac', for_car: true, for_motorcycle: false },
  { name: 'GMC', for_car: true, for_motorcycle: false },
  { name: 'Buick', for_car: true, for_motorcycle: false },
  { name: 'Chrysler', for_car: true, for_motorcycle: false },
  { name: 'Lincoln', for_car: true, for_motorcycle: false },
  { name: 'Ram', for_car: true, for_motorcycle: false },
  { name: 'Rivian', for_car: true, for_motorcycle: false },
  { name: 'Lucid', for_car: true, for_motorcycle: false },

  // Korean Cars
  { name: 'Hyundai', for_car: true, for_motorcycle: false },
  { name: 'Kia', for_car: true, for_motorcycle: false },
  { name: 'Genesis', for_car: true, for_motorcycle: false },
  { name: 'SsangYong', for_car: true, for_motorcycle: false },
  { name: 'KG Mobility', for_car: true, for_motorcycle: false },

  // Chinese Cars & Motorcycles
  { name: 'BYD', for_car: true, for_motorcycle: false },
  { name: 'Geely', for_car: true, for_motorcycle: false },
  { name: 'Chery', for_car: true, for_motorcycle: false },
  { name: 'Wuling', for_car: true, for_motorcycle: false },
  { name: 'Changan', for_car: true, for_motorcycle: false },
  { name: 'GAC', for_car: true, for_motorcycle: false },
  { name: 'Great Wall Motor', for_car: true, for_motorcycle: false },
  { name: 'GWM', for_car: true, for_motorcycle: false },
  { name: 'Nio', for_car: true, for_motorcycle: false },
  { name: 'Xpeng', for_car: true, for_motorcycle: false },
  { name: 'Li Auto', for_car: true, for_motorcycle: false },
  { name: 'Zeekr', for_car: true, for_motorcycle: false },
  { name: 'Lynk & Co', for_car: true, for_motorcycle: false },
  { name: 'Baojun', for_car: true, for_motorcycle: false },
  { name: 'Haval', for_car: true, for_motorcycle: false },
  { name: 'Dongfeng', for_car: true, for_motorcycle: false },
  { name: 'SAIC', for_car: true, for_motorcycle: false },
  { name: 'FAW', for_car: true, for_motorcycle: false },
  { name: 'Hongqi', for_car: true, for_motorcycle: false },
  { name: 'CFMoto', for_car: true, for_motorcycle: true },

  // Indian Cars & Motorcycles
  { name: 'Tata', for_car: true, for_motorcycle: false },
  { name: 'Mahindra', for_car: true, for_motorcycle: false },
  { name: 'Force', for_car: true, for_motorcycle: false },
  { name: 'Royal Enfield', for_car: false, for_motorcycle: true },
  { name: 'TVS', for_car: false, for_motorcycle: true },
  { name: 'Bajaj', for_car: false, for_motorcycle: true },

  // Motorcycle Brands (American & European & Taiwanese)
  { name: 'Harley-Davidson', for_car: false, for_motorcycle: true },
  { name: 'Ducati', for_car: false, for_motorcycle: true },
  { name: 'Triumph', for_car: false, for_motorcycle: true },
  { name: 'KTM', for_car: false, for_motorcycle: true },
  { name: 'Vespa', for_car: false, for_motorcycle: true },
  { name: 'Aprilia', for_car: false, for_motorcycle: true },
  { name: 'Husqvarna', for_car: false, for_motorcycle: true },
  { name: 'Moto Guzzi', for_car: false, for_motorcycle: true },
  { name: 'MV Agusta', for_car: false, for_motorcycle: true },
  { name: 'Benelli', for_car: false, for_motorcycle: true },
  { name: 'Piaggio', for_car: false, for_motorcycle: true },
  { name: 'Indian Motorcycle', for_car: false, for_motorcycle: true },
  { name: 'Zero', for_car: false, for_motorcycle: true },
  { name: 'Norton', for_car: false, for_motorcycle: true },
  { name: 'SYM', for_car: false, for_motorcycle: true },
  { name: 'Kymco', for_car: false, for_motorcycle: true },
  { name: 'Gogoro', for_car: false, for_motorcycle: true },
  { name: 'Hyosung', for_car: false, for_motorcycle: true },
  { name: 'Keeway', for_car: false, for_motorcycle: true },

  // Indonesian / Local Brands
  { name: 'Esemka', for_car: true, for_motorcycle: false },
  { name: 'Fin Komodo', for_car: true, for_motorcycle: false },
  { name: 'Viar', for_car: false, for_motorcycle: true },
  { name: 'Gesits', for_car: false, for_motorcycle: true },
  { name: 'Selis', for_car: false, for_motorcycle: true },
  { name: 'Polytron', for_car: false, for_motorcycle: true },
  { name: 'Alva', for_car: false, for_motorcycle: true },
  { name: 'United', for_car: false, for_motorcycle: true },
  { name: 'SM Sport', for_car: false, for_motorcycle: true },

  // Additional Southeast Asian & Global Cars
  { name: 'VinFast', for_car: true, for_motorcycle: false },
  { name: 'Proton', for_car: true, for_motorcycle: false },
  { name: 'Perodua', for_car: true, for_motorcycle: false },
  { name: 'Holden', for_car: true, for_motorcycle: false },
  { name: 'MG', for_car: true, for_motorcycle: false },
  
  // Additional Chinese Cars & Electric (Active in Indonesia)
  { name: 'DFSK', for_car: true, for_motorcycle: false },
  { name: 'Seres', for_car: true, for_motorcycle: false },
  { name: 'BAIC', for_car: true, for_motorcycle: false },
  { name: 'Jetour', for_car: true, for_motorcycle: false },
  { name: 'GAC Aion', for_car: true, for_motorcycle: false },
  { name: 'Jaecoo', for_car: true, for_motorcycle: false },
  { name: 'Denza', for_car: true, for_motorcycle: false },
  { name: 'Maxus', for_car: true, for_motorcycle: false },

  // Commercial Vehicles & Trucks (Very common in Indonesia)
  { name: 'Hino', for_car: true, for_motorcycle: false },
  { name: 'Fuso', for_car: true, for_motorcycle: false },
  { name: 'UD Trucks', for_car: true, for_motorcycle: false },
  { name: 'Datsun', for_car: true, for_motorcycle: false },

  // Additional Motorcycle Brands (Scooter & Retro)
  { name: 'Lambretta', for_car: false, for_motorcycle: true },
  { name: 'Italjet', for_car: false, for_motorcycle: true },
  { name: 'Royal Alloy', for_car: false, for_motorcycle: true },
  { name: 'Scomadi', for_car: false, for_motorcycle: true },
  { name: 'BSA', for_car: false, for_motorcycle: true },
  { name: 'GasGas', for_car: false, for_motorcycle: true },
  { name: 'Beta', for_car: false, for_motorcycle: true },
  { name: 'Sherco', for_car: false, for_motorcycle: true },
  { name: 'Bimota', for_car: false, for_motorcycle: true },
  { name: 'Cagiva', for_car: false, for_motorcycle: true },
  { name: 'Cleveland CycleWerks', for_car: false, for_motorcycle: true },

  // Additional Electric Motorcycle Brands (Active in Indonesia)
  { name: 'Yadea', for_car: false, for_motorcycle: true },
  { name: 'Niu', for_car: false, for_motorcycle: true },
  { name: 'Segway', for_car: false, for_motorcycle: true },
  { name: 'Smoot', for_car: false, for_motorcycle: true },
  { name: 'Volta', for_car: false, for_motorcycle: true },
  { name: 'Davigo', for_car: false, for_motorcycle: true },
  { name: 'Charged', for_car: false, for_motorcycle: true },
  { name: 'Quest Motors', for_car: false, for_motorcycle: true }
];

async function seed() {
  console.log('Starting comprehensive brand seeding...');
  let addedCount = 0;
  let updatedCount = 0;

  for (const brand of comprehensiveBrands) {
    const existing = await VehicleBrand.findOne({ where: { name: brand.name } });
    if (existing) {
      // Update if properties changed (e.g. adding motorcycle support)
      let changed = false;
      if (brand.for_car && !existing.for_car) {
        existing.for_car = true;
        changed = true;
      }
      if (brand.for_motorcycle && !existing.for_motorcycle) {
        existing.for_motorcycle = true;
        changed = true;
      }
      if (changed) {
        await existing.save();
        updatedCount++;
      }
    } else {
      await VehicleBrand.create(brand);
      addedCount++;
    }
  }

  console.log(`Finished seeding. Added: ${addedCount}, Updated: ${updatedCount} brands.`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Failed to seed brands:', err);
  process.exit(1);
});
