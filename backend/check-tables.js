const sequelize = require('./src/config/database');
const User = require('./src/models/User');

const checkTables = async () => {
    try {
        await sequelize.authenticate();
        console.log('Sequelize authenticated.');
        
        const [results] = await sequelize.query('SHOW TABLES');
        console.log('Tables in database:', results);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkTables();
