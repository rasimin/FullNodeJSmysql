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
    const { search, parent_id, type } = req.query;
    const { Op } = require('sequelize');

    if (search) {
      // 1. Cari data yang cocok (limit 50 match utama)
      const matches = await Location.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { region_code: { [Op.like]: `%${search}%` } },
            { postal_code: { [Op.like]: `%${search}%` } }
          ]
        },
        limit: 50
      });

      if (matches.length === 0) return res.json([]);

      // 2. Cari semua leluhur (ancestors) untuk membangun struktur pohon
      const allResultIds = new Set();
      let nodesToReturn = [];

      // Masukkan matches utama
      matches.forEach(m => {
        if (!allResultIds.has(m.id)) {
          allResultIds.add(m.id);
          nodesToReturn.push(m);
        }
      });

      // Cari orang tua secara rekursif di memory (lebih cepat untuk paket kecil)
      let currentBatch = [...matches];
      while (currentBatch.length > 0) {
        const parentIds = [...new Set(currentBatch.map(m => m.parent_id).filter(pid => pid && !allResultIds.has(pid)))];
        if (parentIds.length === 0) break;

        const parents = await Location.findAll({ where: { id: parentIds } });
        parents.forEach(p => {
          allResultIds.add(p.id);
          nodesToReturn.push(p);
        });
        currentBatch = parents;
      }

      return res.json(nodesToReturn);
    } 

    // Jika bukan pencarian, gunakan Lazy Loading standar
    const locations = await Location.findAll({
      where: { parent_id: parent_id || null },
      order: [['name', 'ASC']]
    });
    
    res.json(locations);
  } catch (error) {
    console.error('Get Locations Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createLocation = async (req, res) => {
  try {
    const { name, type, parent_id, postal_code, region_code } = req.body;
    
    const location = await Location.create({
      name,
      type,
      parent_id: parent_id || null,
      postal_code,
      region_code
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
    const { name, type, parent_id, postal_code, region_code } = req.body;
    
    const location = await Location.findByPk(id);
    if (!location) return res.status(404).json({ message: 'Location not found' });

    await location.update({
      name,
      type,
      parent_id: parent_id || null,
      postal_code,
      region_code
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

  let isAborted = false;
  req.on('close', () => {
    isAborted = true;
    console.log('[Sync] Client disconnected. Aborting process...');
  });

  const sendProgress = (message, percent = 0) => {
    if (!isAborted) {
      res.write(`data: ${JSON.stringify({ message, percent })}\n\n`);
    }
  };

  try {
    sendProgress('Memulai sinkronisasi cerdas (Upsert)...', 2);
    
    // Cache untuk memetakan region_code -> database_id (untuk relasi parent_id)
    const codeToIdMap = {};
    const existingLocations = await Location.findAll({ attributes: ['id', 'region_code'] });
    existingLocations.forEach(l => { if (l.region_code) codeToIdMap[l.region_code] = l.id; });

    // 1. PROVINCES
    sendProgress('Sinkronisasi Provinsi...', 5);
    const apiProvinces = await fetchJson(`${BASE_URL}/provinces.json`);
    
    for (const p of apiProvinces) {
      if (isAborted) break;
      const [loc] = await Location.upsert({
        region_code: p.id,
        name: p.name,
        type: 'PROVINCE',
        parent_id: null
      });
      // Ambil ID yang baru dibuat/diupdate untuk digunakan oleh level bawahnya
      const updatedLoc = await Location.findOne({ where: { region_code: p.id }, attributes: ['id'] });
      codeToIdMap[p.id] = updatedLoc.id;
    }

    // 2. CITIES, DISTRICTS, VILLAGES
    let processedProv = 0;
    const totalProv = apiProvinces.length;

    for (const p of apiProvinces) {
      if (isAborted) break;
      processedProv++;
      const currentPercent = 10 + Math.floor((processedProv / totalProv) * 85);
      sendProgress(`Memproses wilayah ${p.name}...`, currentPercent);

      // Get Cities for this Province
      const apiCities = await fetchJson(`${BASE_URL}/regencies/${p.id}.json`);
      for (const c of apiCities) {
        if (isAborted) break;
        const [cityLoc] = await Location.upsert({
          region_code: c.id,
          name: c.name,
          type: 'CITY',
          parent_id: codeToIdMap[p.id]
        });
        const updatedCity = await Location.findOne({ where: { region_code: c.id }, attributes: ['id'] });
        codeToIdMap[c.id] = updatedCity.id;

        // Get Districts for this City
        const apiDistricts = await fetchJson(`${BASE_URL}/districts/${c.id}.json`);
        for (const d of apiDistricts) {
          if (isAborted) break;
          const [distLoc] = await Location.upsert({
            region_code: d.id,
            name: d.name,
            type: 'DISTRICT',
            parent_id: codeToIdMap[c.id]
          });
          const updatedDist = await Location.findOne({ where: { region_code: d.id }, attributes: ['id'] });
          codeToIdMap[d.id] = updatedDist.id;

          // Get Villages (Kelurahan) for this District
          const apiVillages = await fetchJson(`${BASE_URL}/villages/${d.id}.json`);
          if (apiVillages.length > 0) {
            const villageEntries = apiVillages.map(v => ({
              region_code: v.id,
              name: v.name,
              type: 'POSTAL_CODE',
              parent_id: codeToIdMap[d.id]
            }));

            // Menggunakan bulkCreate dengan updateOnDuplicate untuk performa maksimal pada data kelurahan yang banyak
            await Location.bulkCreate(villageEntries, {
              updateOnDuplicate: ['name', 'parent_id', 'type']
            });
          }
        }
      }
    }

    sendProgress('Sinkronisasi selesai! Seluruh data wilayah Indonesia telah diperbarui.', 100);
    res.end();
  } catch (error) {
    console.error('Sync Error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Terjadi kesalahan sistem: ' + error.message })}\n\n`);
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
