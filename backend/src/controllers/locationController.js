const { Location, ActivityLog } = require('../models');
const https = require('https');

const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';

const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve([]); }
      });
    }).on('error', (err) => reject(err));
  });
};

const getAllLocations = async (req, res) => {
  try {
    // We can fetch roots (provinces) and include their children if requested,
    // or just fetch all and build the tree in frontend.
    // Here we fetch all but with parent info
    const locations = await Location.findAll({
      include: [{ model: Location, as: 'parent', attributes: ['name'] }],
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
    res.json(locations);
  } catch (error) {
    console.error('Get Locations Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createLocation = async (req, res) => {
  try {
    const { name, type, parent_id, postal_code } = req.body;
    
    const location = await Location.create({
      name,
      type,
      parent_id: parent_id || null,
      postal_code
    }, { userId: req.user.id });

    await ActivityLog.create({
      user_id: req.user.id,
      action: 'Create Location',
      details: { locationId: location.id, name, type },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.status(201).json(location);
  } catch (error) {
    console.error('Create Location Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, parent_id, postal_code } = req.body;
    
    const location = await Location.findByPk(id);
    if (!location) return res.status(404).json({ message: 'Location not found' });

    await location.update({
      name,
      type,
      parent_id: parent_id || null,
      postal_code
    }, { userId: req.user.id });

    await ActivityLog.create({
      user_id: req.user.id,
      action: 'Update Location',
      details: { locationId: id, name, type },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json(location);
  } catch (error) {
    console.error('Update Location Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findByPk(id);
    if (!location) return res.status(404).json({ message: 'Location not found' });

    await location.destroy({ userId: req.user.id });

    await ActivityLog.create({
      user_id: req.user.id,
      action: 'Delete Location',
      details: { locationId: id },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete Location Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const syncLocations = async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendProgress = (message, percent = 0) => {
    res.write(`data: ${JSON.stringify({ message, percent })}\n\n`);
  };

  try {
    sendProgress('Memulai sinkronisasi...', 5);
    
    // Clear existing data
    await Location.destroy({ where: {}, truncate: false, cascade: true });
    sendProgress('Data lama telah dikosongkan', 10);

    // 1. Provinces
    sendProgress('Mengambil data Provinsi...', 15);
    const apiProvinces = await fetchJson(`${BASE_URL}/provinces.json`);
    
    const provinceMap = {};
    for (const p of apiProvinces) {
      const created = await Location.create({ name: p.name, type: 'PROVINCE' });
      provinceMap[p.id] = created.id;
    }
    sendProgress(`Berhasil sinkronisasi ${apiProvinces.length} Provinsi`, 30);

    // 2. Cities (Limited to first few for speed in this demo, or all if you want)
    // To make it faster, we only process Cities & Districts, skipping Villages
    let count = 0;
    const total = apiProvinces.length;

    for (const [apiId, dbId] of Object.entries(provinceMap)) {
      count++;
      const provinceName = apiProvinces.find(p => p.id === apiId).name;
      const progress = 30 + Math.floor((count / total) * 60);
      
      sendProgress(`Memproses Kota di ${provinceName}...`, progress);
      
      const cities = await fetchJson(`${BASE_URL}/regencies/${apiId}.json`);
      const cityEntries = cities.map(c => ({
        name: c.name,
        type: 'CITY',
        parent_id: dbId
      }));
      
      const createdCities = await Location.bulkCreate(cityEntries);

      // Fetch Districts for each city
      for (let i = 0; i < cities.length; i++) {
        const districts = await fetchJson(`${BASE_URL}/districts/${cities[i].id}.json`);
        const districtEntries = districts.map(d => ({
          name: d.name,
          type: 'DISTRICT',
          parent_id: createdCities[i].id
        }));
        await Location.bulkCreate(districtEntries);
      }
    }

    sendProgress('Sinkronisasi selesai!', 100);
    res.end();
  } catch (error) {
    console.error('Sync Error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Gagal sinkronisasi data' })}\n\n`);
    res.end();
  }
};

module.exports = {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  syncLocations
};
