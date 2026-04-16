const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 5000;

console.log('Environment PORT:', process.env.PORT);
console.log('Resolved PORT:', PORT);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    
    // Sync models - using standard sync to avoid ALTER errors on tables with too many legacy indexes
    await sequelize.sync(); 
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();
