const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { User, Role, Office, ActivityLog, SalesAgent, Vehicle } = require('../models');
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

const exportSalesAgents = async (req, res) => {
  try {
    const { search, office_id } = req.query;

    const condition = {};
    if (search) {
      condition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sales_code: { [Op.like]: `%${search}%` } }
      ];
    }
    if (office_id) condition.office_id = office_id;

    const agents = await SalesAgent.findAll({
      where: condition,
      include: [
        { model: Office, attributes: ['name', 'type'] }
      ],
      order: [['created_at', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('SalesAgents');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Sales Code', key: 'sales_code', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Office', key: 'office', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Joined At', key: 'created_at', width: 20 },
    ];

    agents.forEach((agent) => {
      worksheet.addRow({
        id: agent.id,
        sales_code: agent.sales_code,
        name: agent.name,
        email: agent.email || '-',
        phone: agent.phone || '-',
        office: agent.Office ? agent.Office.name : 'N/A',
        status: agent.status,
        created_at: agent.createdAt,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'sales_agents.xlsx'
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

const exportVehicles = async (req, res) => {
  try {
    const { search, officeId: filterOfficeId, type, status } = req.query;
    const user = req.user;
    const isSuperAdmin = user.Role?.name === 'Super Admin';
    const currentOffice = await Office.findByPk(user.office_id);
    let officeIds = [];

    // Logika Hierarki Kantor (Sama dengan vehicleController.getVehicles)
    if (isSuperAdmin) {
      if (filterOfficeId) {
        officeIds = [filterOfficeId];
      } else {
        const allOffices = await Office.findAll({ attributes: ['id'] });
        officeIds = allOffices.map(o => o.id);
      }
    } else if (currentOffice && !currentOffice.parent_id) {
       const allowedOffices = await Office.findAll({
         where: { [Op.or]: [{ id: user.office_id }, { parent_id: user.office_id }] },
         attributes: ['id']
       });
       const allowedIds = allowedOffices.map(o => o.id);
       officeIds = (filterOfficeId && allowedIds.includes(parseInt(filterOfficeId))) ? [filterOfficeId] : allowedIds;
    } else {
      officeIds = [user.office_id];
    }

    const condition = { office_id: { [Op.in]: officeIds } };

    if (search) {
      condition[Op.or] = [
        { brand: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
        { plate_number: { [Op.like]: `%${search}%` } },
      ];
    }
    if (type) condition.type = type;
    if (status) condition.status = status;

    const vehicles = await Vehicle.findAll({
      where: condition,
      include: [
        { model: Office, attributes: ['name'] },
        { model: SalesAgent, as: 'salesAgent', attributes: ['name', 'sales_code'] }
      ],
      order: [['created_at', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vehicles');

    // All fields as requested
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Brand', key: 'brand', width: 15 },
      { header: 'Model', key: 'model', width: 25 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Plate Number', key: 'plate_number', width: 15 },
      { header: 'Color', key: 'color', width: 12 },
      { header: 'Transmission', key: 'transmission', width: 15 },
      { header: 'Fuel Type', key: 'fuel_type', width: 15 },
      { header: 'Odometer (KM)', key: 'odometer', width: 15 },
      { header: 'Sales Price', key: 'price', width: 15 },
      { header: 'Purchase Price', key: 'purchase_price', width: 15 },
      { header: 'Service Cost', key: 'service_cost', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Entry Date', key: 'entry_date', width: 15 },
      { header: 'Sold Date', key: 'sold_date', width: 15 },
      { header: 'Branch Office', key: 'office', width: 25 },
      { header: 'Sales Agent', key: 'agent', width: 25 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Created At', key: 'created_at', width: 20 },
    ];

    vehicles.forEach((v) => {
      worksheet.addRow({
        id: v.id,
        type: v.type,
        brand: v.brand,
        model: v.model,
        year: v.year,
        plate_number: v.plate_number,
        color: v.color || '-',
        transmission: v.transmission || '-',
        fuel_type: v.fuel_type || '-',
        odometer: v.odometer || 0,
        price: parseFloat(v.price),
        purchase_price: parseFloat(v.purchase_price || 0),
        service_cost: parseFloat(v.service_cost || 0),
        status: v.status,
        entry_date: v.entry_date,
        sold_date: v.sold_date || '-',
        office: v.Office ? v.Office.name : 'N/A',
        agent: v.salesAgent ? `${v.salesAgent.name} (${v.salesAgent.sales_code})` : '-',
        description: v.description || '-',
        created_at: v.createdAt,
      });
    });

    // Formatting currency columns
    ['K', 'L', 'M'].forEach(col => {
      worksheet.getColumn(col).numFmt = '#,##0.00';
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'vehicles_inventory.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Vehicles Error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  exportUsers,
  exportSalesAgents,
  exportVehicles,
  exportDashboardPdf
};
