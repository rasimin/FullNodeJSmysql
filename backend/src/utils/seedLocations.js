const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize, Location } = require('../models');

const locationData = [
  {
    name: "DKI JAKARTA",
    type: "PROVINCE",
    children: [
      {
        name: "JAKARTA SELATAN",
        type: "CITY",
        children: [
          {
            name: "TEBET",
            type: "DISTRICT",
            children: [
              { name: "TEBET BARAT", type: "POSTAL_CODE", postal_code: "12810" },
              { name: "TEBET TIMUR", type: "POSTAL_CODE", postal_code: "12820" }
            ]
          },
          {
            name: "KEBAYORAN BARU",
            type: "DISTRICT",
            children: [
              { name: "SENAYAN", type: "POSTAL_CODE", postal_code: "12190" }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "JAWA TIMUR",
    type: "PROVINCE",
    children: [
      {
        name: "SURABAYA",
        type: "CITY",
        children: [
          {
            name: "GUBENG",
            type: "DISTRICT",
            children: [
              { name: "AIRLANGGA", type: "POSTAL_CODE", postal_code: "60286" }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "BALI",
    type: "PROVINCE",
    children: [
      {
        name: "DENPASAR",
        type: "CITY",
        children: [
          {
            name: "DENPASAR TIMUR",
            type: "DISTRICT",
            children: [
              { name: "SUMERTA", type: "POSTAL_CODE", postal_code: "80235" }
            ]
          }
        ]
      }
    ]
  }
];

const seedBranch = async (data, parentId = null) => {
  for (const item of data) {
    const created = await Location.create({
      name: item.name,
      type: item.type,
      parent_id: parentId,
      postal_code: item.postal_code || null
    });
    if (item.children) {
      await seedBranch(item.children, created.id);
    }
  }
};

const seedFullIndonesia = async () => {
  try {
    await sequelize.authenticate();
    console.log('🔄 Re-syncing database and seeding hierarchical data...');
    
    // Force set the table to empty
    await Location.sync({ force: true });

    await seedBranch(locationData);

    console.log('✅ Seeding completed with example hierarchies!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedFullIndonesia();
