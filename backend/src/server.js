const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 5000;

console.log('Environment PORT:', process.env.PORT);
console.log('Resolved PORT:', PORT);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    
    // Sync models
    await sequelize.sync({ alter: true }); 
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();
