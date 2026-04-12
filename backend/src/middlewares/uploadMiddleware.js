const multer = require('multer');

// Gunakan memory storage agar bisa diproses dengan `sharp` sebelum disimpan ke disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Batasan 5MB maksimal
  },
  fileFilter: fileFilter
});

module.exports = upload;
