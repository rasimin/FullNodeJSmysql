const { DocumentType } = require('./src/models');

async function seed() {
  try {
    const types = [
      { name: 'KTP Customer', code: 'KTP_CUST', category: 'Booking', is_mandatory: true, description: 'Kartu Tanda Penduduk Pembeli' },
      { name: 'Kartu Keluarga', code: 'KK_CUST', category: 'Booking', is_mandatory: false, description: 'Kartu Keluarga Pembeli' },
      { name: 'Bukti Transfer / DP', code: 'PAYMENT_PROOF', category: 'Booking', is_mandatory: false, description: 'Bukti Pembayaran DP atau Pelunasan' }
    ];

    for (const t of types) {
      await DocumentType.findOrCreate({
        where: { code: t.code },
        defaults: t
      });
    }
    console.log('Booking Document Types seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
}

seed();
