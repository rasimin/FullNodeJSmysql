const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

exports.executeQuery = async (req, res) => {
  const { sql } = req.body;

  if (!sql) {
    return res.status(400).json({ message: 'Query SQL tidak boleh kosong' });
  }

  try {
    const startTime = Date.now();
    
    // Check if it's a SELECT query to use SELECT type, otherwise let sequelize handle it
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('SHOW') || sql.trim().toUpperCase().startsWith('DESCRIBE');
    
    const results = await sequelize.query(sql, {
      type: isSelect ? QueryTypes.SELECT : undefined
    });

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Query berhasil dieksekusi',
      results: isSelect ? results : { affectedRows: results[1]?.affectedRows || results[0]?.affectedRows || 0 },
      executionTime: `${executionTime}ms`
    });
  } catch (error) {
    console.error('SQL Execution Error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengeksekusi query',
      error: error.message
    });
  }
};
