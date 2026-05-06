const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShowroomSetting = sequelize.define('ShowroomSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  head_office_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'offices',
      key: 'id'
    }
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  header_image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  theme_color: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'blue'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'Katalog Showroom'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'Temukan unit impian Anda dengan standar kualitas terbaik dan proses yang transparan.'
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  about_content: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: `
      <h1 style="text-align: center; margin-bottom: 24px;">Tentang Kami</h1>
      <p style="text-align: center; font-size: 1.1em; color: #6b7280; margin-bottom: 40px;">Dedikasi Kami dalam Menghadirkan Kendaraan Impian Anda</p>
      
      <p>Selamat datang di platform showroom kendaraan kami. Kami adalah mitra terpercaya Anda dalam menemukan kendaraan impian dengan standar kualitas terbaik. Dengan pengalaman bertahun-tahun di industri otomotif, kami berkomitmen untuk menghadirkan unit berkualitas tinggi yang telah melewati proses inspeksi menyeluruh.</p>
      
      <h3 style="margin-top: 32px;">Visi & Misi Kami</h3>
      <p>Visi kami adalah menjadi showroom pilihan utama yang mengedepankan transparansi dan kepuasan pelanggan. Kami percaya bahwa setiap transaksi bukan sekadar jual beli, melainkan awal dari hubungan jangka panjang yang berlandaskan kepercayaan.</p>
      
      <h3 style="margin-top: 32px;">Mengapa Memilih Kami?</h3>
      <ul>
        <li><strong>Kualitas Terjamin:</strong> Setiap unit dipastikan dalam kondisi prima dan siap pakai.</li>
        <li><strong>Proses Transparan:</strong> Informasi unit dan dokumen kendaraan disajikan secara jujur dan lengkap.</li>
        <li><strong>Layanan Profesional:</strong> Tim kami siap membantu Anda dari proses pemilihan hingga pengiriman unit ke rumah Anda.</li>
      </ul>
      
      <p style="margin-top: 32px;">Kunjungi lokasi kami atau hubungi agen penjualan kami untuk mendapatkan penawaran terbaik hari ini.</p>
    `
  },
  about_image_1: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  about_image_2: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  about_image_3: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  about_image_4: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  about_image_5: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'showroom_settings',
  timestamps: true,
  underscored: true
});

module.exports = ShowroomSetting;
