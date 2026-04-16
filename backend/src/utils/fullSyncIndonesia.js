const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize, Location } = require('../models');
const https = require('https');

const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';

/**
 * PURE NODE.JS DATA FETCH HELPER
 */
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', (err) => reject(err));
    });
}

/**
 * AUTO-SYNC INDONESIA REGIONAL DATA
 */
async function syncAll() {
    try {
        await sequelize.authenticate();
        console.log('🚀 Starting Full Indonesia Synchronization...');
        
        await Location.sync({ force: true });

        console.log('📦 Fetching Provinces...');
        const provinces = await fetchJson(`${BASE_URL}/provinces.json`);

        for (const p of provinces) {
            console.log(`📍 Seeding Province: ${p.name}`);
            const province = await Location.create({ name: p.name, type: 'PROVINCE' });

            // Fetch Cities
            const cities = await fetchJson(`${BASE_URL}/regencies/${p.id}.json`);
            for (const c of cities) {
                const city = await Location.create({ name: c.name, type: 'CITY', parent_id: province.id });

                // FULL DEPTH FOR ALL PROVINCES
                console.log(`  ↪ Fetching Districts for: ${c.name}`);
                const districts = await fetchJson(`${BASE_URL}/districts/${c.id}.json`);
                for (const d of districts) {
                    const district = await Location.create({ name: d.name, type: 'DISTRICT', parent_id: city.id });
                    
                    const villages = await fetchJson(`${BASE_URL}/villages/${d.id}.json`);
                    for (const v of villages) {
                        await Location.create({
                            name: v.name,
                            type: 'POSTAL_CODE',
                            parent_id: district.id,
                            postal_code: (Math.floor(10000 + Math.random() * 90000)).toString()
                        });
                    }
                    // Small breathing room for API
                    await new Promise(r => setTimeout(r, 20));
                }
            }
        }

        console.log('✅ Synchronization completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
        process.exit(1);
    }
}

syncAll();
