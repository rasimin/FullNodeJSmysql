const { DocumentType, VehicleDocument, BookingDocument, Vehicle, Booking } = require('../models');
const path = require('path');
const fs = require('fs');

exports.getDocumentTypes = async (req, res) => {
  try {
    const { category } = req.query;
    const where = {};
    if (category) {
      where.category = [category, 'All'];
    }
    const types = await DocumentType.findAll({ where, order: [['id', 'ASC']] });
    res.json(types);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadVehicleDocument = async (req, res) => {
  try {
    const { id } = req.params; // vehicle_id
    const { document_type_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const uploadDir = path.join(__dirname, '../../uploads/documents/vehicles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname);
    const filename = `doc-v-${id}-${Date.now()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Save buffer to file
    fs.writeFileSync(filepath, req.file.buffer);

    const doc = await VehicleDocument.create({
      vehicle_id: id,
      document_type_id,
      file_path: `/uploads/documents/vehicles/${filename}`,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_by: req.user.id
    });

    const fullDoc = await VehicleDocument.findByPk(doc.id, {
      include: [{ model: DocumentType, as: 'type' }]
    });

    res.status(201).json(fullDoc);
  } catch (err) {
    console.error('Upload Vehicle Doc Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.uploadBookingDocument = async (req, res) => {
  try {
    const { id } = req.params; // booking_id
    const { document_type_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const uploadDir = path.join(__dirname, '../../uploads/documents/bookings');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname);
    const filename = `doc-b-${id}-${Date.now()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Save buffer to file
    fs.writeFileSync(filepath, req.file.buffer);

    const doc = await BookingDocument.create({
      booking_id: id,
      document_type_id,
      file_path: `/uploads/documents/bookings/${filename}`,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_by: req.user.id
    });

    const fullDoc = await BookingDocument.findByPk(doc.id, {
      include: [{ model: DocumentType, as: 'type' }]
    });

    res.status(201).json(fullDoc);
  } catch (err) {
    console.error('Upload Booking Doc Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteVehicleDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await VehicleDocument.findByPk(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Delete file
    const absolutePath = path.join(__dirname, '../..', doc.file_path);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await doc.destroy();
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBookingDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await BookingDocument.findByPk(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Delete file
    const absolutePath = path.join(__dirname, '../..', doc.file_path);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await doc.destroy();
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getVehicleDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const docs = await VehicleDocument.findAll({
      where: { vehicle_id: id },
      include: [{ model: DocumentType, as: 'type' }]
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBookingDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const docs = await BookingDocument.findAll({
      where: { booking_id: id },
      include: [{ model: DocumentType, as: 'type' }]
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
