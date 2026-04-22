const { sequelize, DocumentType } = require('./src/models');

const seedDocumentTypes = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    // Sync individual tables to avoid dropping everything
    await DocumentType.sync({ alter: true });
    const { VehicleDocument, BookingDocument } = require('./src/models');
    await VehicleDocument.sync({ alter: true });
    await BookingDocument.sync({ alter: true });

    const types = [
      // Vehicle Documents
      { name: 'STNK (Surat Tanda Nomor Kendaraan)', code: 'STNK', category: 'Vehicle', is_mandatory: true },
      { name: 'BPKB (Buku Pemilik Kendaraan Bermotor)', code: 'BPKB', category: 'Vehicle', is_mandatory: true },
      { name: 'Faktur Kendaraan', code: 'FAKTUR', category: 'Vehicle', is_mandatory: false },
      { name: 'Sertifikat NIK', code: 'NIK_CERT', category: 'Vehicle', is_mandatory: false },
      
      // Booking Documents
      { name: 'KTP Pembeli', code: 'KTP', category: 'Booking', is_mandatory: true },
      { name: 'Kartu Keluarga (KK)', code: 'KK', category: 'Booking', is_mandatory: false },
      { name: 'Kwitansi Pelunasan', code: 'KWITANSI', category: 'Booking', is_mandatory: false },
      { name: 'BAST (Berita Acara Serah Terima)', code: 'BAST', category: 'Booking', is_mandatory: true },
      { name: 'Bukti Transfer / DP', code: 'PAYMENT_PROOF', category: 'Booking', is_mandatory: true }
    ];

    for (const type of types) {
      await DocumentType.findOrCreate({
        where: { code: type.code },
        defaults: type
      });
    }

    console.log('Document types seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding document types:', err);
    process.exit(1);
  }
};

seedDocumentTypes();
