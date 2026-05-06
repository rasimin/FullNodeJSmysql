const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  console.log('Migrating ShowroomSettings table to support 5 images...');

  try {
    // Add columns about_image_4 and about_image_5
    await connection.query(`
      ALTER TABLE showroom_settings 
      ADD COLUMN IF NOT EXISTS about_image_4 VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS about_image_5 VARCHAR(255) DEFAULT NULL
    `);
    
    console.log('Successfully added about_image_4 and about_image_5 columns.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrate();
