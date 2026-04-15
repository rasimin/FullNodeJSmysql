const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { User, Role, Office, ActivityLog } = require('../models');
const { Op } = require('sequelize');

const exportUsers = async (req, res) => {
  try {
    const { search, role_id, office_id } = req.query;

    const condition = {};
    if (search) condition.name = { [Op.like]: `%${search}%` };
    if (role_id) condition.role_id = role_id;
    if (office_id) condition.office_id = office_id;

    const users = await User.findAll({
      where: condition,
      include: [
        { model: Role, attributes: ['name'] },
        { model: Office, attributes: ['name', 'type'] }
      ],
      order: [['created_at', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 20 },
      { header: 'Office', key: 'office', width: 25 },
      { header: 'Office Type', key: 'office_type', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created At', key: 'created_at', width: 20 },
    ];

    users.forEach((user) => {
      worksheet.addRow({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.Role ? user.Role.name : 'N/A',
        office: user.Office ? user.Office.name : 'N/A',
        office_type: user.Office ? user.Office.type : 'N/A',
        status: user.is_active ? 'Active' : 'Inactive',
        created_at: user.createdAt,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'users.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportDashboardPdf = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalRoles = await Role.count();
    const totalOffices = await Office.count();

    const recentActivities = await ActivityLog.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [{ model: User, attributes: ['name'] }]
    });

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="dashboard_report.pdf"');
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Dashboard Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });
    doc.moveDown(2);

    // Stats
    doc.fontSize(16).text('System Statistics', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total Users: ${totalUsers}`);
    doc.text(`Total Roles: ${totalRoles}`);
    doc.text(`Total Offices: ${totalOffices}`);
    doc.moveDown(2);

    // Activities
    doc.fontSize(16).text('Recent Activities (Last 10)', { underline: true });
    doc.moveDown(0.5);

    recentActivities.forEach((activity, index) => {
      const userName = activity.User ? activity.User.name : 'Unknown';
      const date = activity.created_at ? new Date(activity.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID');
      doc.fontSize(10).text(`${index + 1}. [${date}] ${userName} - ${activity.action}`);
    });

    doc.end();

  } catch (error) {
    console.error('PDF Export Error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  exportUsers,
  exportDashboardPdf
};
