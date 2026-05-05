require('dotenv').config({ path: '../.env' });
const { Office } = require('./models');

async function check() {
  try {
    const ho = await Office.findByPk(1);
    console.log('HO Type:', ho ? ho.type : 'Not Found');
    
    const branches = await Office.findAll({ where: { parent_id: 1 } });
    console.log('Branches found:', branches.map(b => ({ id: b.id, name: b.name, type: b.type })));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
