const mysql = require('mysql2/promise');
require('dotenv').config();

const testConnection = async () => {
    console.log('Testing connection with:');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });
        console.log('SUCCESS: Connected to MySQL successfully!');
        await connection.end();
    } catch (error) {
        console.error('FAILURE: Could not connect to MySQL.');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
    }
};

testConnection();
