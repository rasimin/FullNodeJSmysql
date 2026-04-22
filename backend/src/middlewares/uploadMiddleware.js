const multer = require('multer');

// Gunakan memory storage agar bisa diproses dengan `sharp` sebelum disimpan ke disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPG, PNG) atau PDF yang diperbolehkan!'), false);
  }
};


const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // Batasan 50MB maksimal (akan dikompres otomatis oleh backend)
  },
  fileFilter: fileFilter
});

module.exports = upload;
