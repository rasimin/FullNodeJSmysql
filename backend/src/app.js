const express = require('express');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

const authRoutes = require('./routes/authRoutes');
const roleRoutes = require('./routes/roleRoutes');
const officeRoutes = require('./routes/officeRoutes');
const userRoutes = require('./routes/userRoutes');
const logRoutes = require('./routes/logRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const exportRoutes = require('./routes/exportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const reportRoutes = require('./routes/reportRoutes');
const salesAgentRoutes = require('./routes/salesAgents');
const settingRoutes = require('./routes/settingRoutes');
const locationRoutes = require('./routes/locationRoutes');
const publicRoutes = require('./routes/publicRoutes');
const showroomSettingRoutes = require('./routes/showroomSettingRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sales-agents', salesAgentRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/promotions', require('./routes/promotionRoutes'));
app.use('/api/public', publicRoutes);
app.use('/api/showroom-settings', showroomSettingRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Admin Dashboard API' });
});

// Multer & General Error Handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File terlalu besar! Maksimal 50MB per file. Gambar akan dikompres otomatis oleh sistem.' });
    }
    return res.status(400).json({ message: `Gagal upload: ${err.message}` });
  }
  
  const status = err.status || 500;
  const message = err.message || 'Server Error';
  
  if (process.env.NODE_ENV === 'development') {
    console.error('Error detail:', err);
  }
  
  res.status(status).json({ message });
});

module.exports = app;
