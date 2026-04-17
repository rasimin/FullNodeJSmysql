const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { User, Role, Office, ActivityLog, SalesAgent, Vehicle, Booking } = require('../models');
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
        status: user.is_active ? 'Active' : 'Inactive',
        created_at: user.createdAt,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
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
      include: [{ model: Office, attributes: ['name'] }],
      order: [['created_at', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('SalesAgents');
    worksheet.columns = [
      { header: 'Sales Code', key: 'sales_code', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Office', key: 'office', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    agents.forEach((agent) => {
      worksheet.addRow({
        sales_code: agent.sales_code,
        name: agent.name,
        office: agent.Office ? agent.Office.name : 'N/A',
        status: agent.status,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_agents.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
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

    if (isSuperAdmin) {
      if (filterOfficeId) officeIds = [filterOfficeId];
      else {
        const all = await Office.findAll({ attributes: ['id'] });
        officeIds = all.map(o => o.id);
      }
    } else if (currentOffice && !currentOffice.parent_id) {
      const allowed = await Office.findAll({
        where: { [Op.or]: [{ id: user.office_id }, { parent_id: user.office_id }] },
        attributes: ['id']
      });
      const allowedIds = allowed.map(o => o.id);
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
    worksheet.columns = [
      { header: 'Brand', key: 'brand', width: 15 },
      { header: 'Model', key: 'model', width: 25 },
      { header: 'Plate', key: 'plate', width: 15 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Office', key: 'office', width: 25 },
    ];

    vehicles.forEach(v => {
      worksheet.addRow({
        brand: v.brand,
        model: v.model,
        plate: v.plate_number,
        price: parseFloat(v.price),
        status: v.status,
        office: v.Office ? v.Office.name : 'N/A'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=vehicles.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportBookingPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const booking = await Booking.findByPk(id, {
      include: [{ model: Vehicle }, { model: Office }, { model: SalesAgent, as: 'salesAgent' }]
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    const isInvoice = type === 'dp-invoice';
    const title = isInvoice ? 'FINAL SETTLEMENT INVOICE' : 'VEHICLE DOWN PAYMENT RECEIPT';
    const subTitle = isInvoice ? 'Payment Request for Remaining Vehicle Balance' : 'Official Vehicle Down Payment & Security Deposit Statement';

    // Header
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e40af').text(title, { align: 'right' });
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Document ID: REF-${booking.id.split('-')[0].toUpperCase()}`, { align: 'right' });
    doc.moveDown(1.5);

    // Business Info
    doc.fillColor('#000').fontSize(14).font('Helvetica-Bold').text(booking.Office?.name || 'Showroom Management System');
    doc.fontSize(10).font('Helvetica').text(subTitle);
    doc.moveDown(2);

    // Client & Vehicle Grid
    const startY = doc.y;
    doc.fontSize(11).font('Helvetica-Bold').text('PURCHASER INFORMATION', 50, startY);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Full Name: ${booking.customer_name}`, 50, startY + 15);
    doc.text(`NIK (ID): ${booking.nik || '-'}`, 50, startY + 30);
    doc.text(`Phone No: ${booking.customer_phone}`, 50, startY + 45);

    doc.fontSize(11).font('Helvetica-Bold').text('VEHICLE SPECIFICATIONS', 320, startY);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Unit: ${booking.Vehicle?.brand} ${booking.Vehicle?.model}`, 320, startY + 15);
    doc.text(`Year: ${booking.Vehicle?.year || '-'}`, 320, startY + 30);
    doc.text(`Plate Number: ${booking.Vehicle?.plate_number}`, 320, startY + 45);

    doc.moveDown(4);

    // Payment Section
    const tableTop = doc.y;
    doc.rect(50, tableTop, 500, 25).fill('#f8fafc');
    doc.fillColor('#1e293b').font('Helvetica-Bold').text('TRANSACTION SUMMARY', 60, tableTop + 8);
    doc.text('AMOUNT', 450, tableTop + 8);
    
    if (isInvoice) {
      const price = parseFloat(booking.Vehicle?.price || 0);
      const dp = parseFloat(booking.down_payment || 0);
      const total = price - dp;

      doc.font('Helvetica').fillColor('#000').text('Vehicle Agreed Selling Price', 60, tableTop + 40);
      doc.text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price), 400, tableTop + 40, { align: 'right', width: 140 });

      doc.text('Less: Down Payment (Paid)', 60, tableTop + 60);
      doc.text(`- ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(dp)}`, 400, tableTop + 60, { align: 'right', width: 140 });

      doc.rect(350, tableTop + 80, 200, 1).fill('#cbd5e1');
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#b91c1c').text('REMAINING BALANCE PAYABLE', 180, tableTop + 90);
      doc.text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total), 400, tableTop + 90, { align: 'right', width: 140 });
    } else {
      doc.font('Helvetica').fillColor('#000').text('Security Deposit / Vehicle Down Payment', 60, tableTop + 40);
      doc.fontSize(12).font('Helvetica-Bold').text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(booking.down_payment), 400, tableTop + 40, { align: 'right', width: 140 });
    }

    doc.moveDown(8);
    const note = isInvoice 
      ? 'Note: This invoice is for the final settlement of the vehicle purchase. Please ensure payment is made before the delivery date.'
      : 'Note: This document serves as a formal acknowledgement of the reservation payment. The unit is reserved for the client pending final settlement.';
    
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b').text(note, 50, doc.y, { align: 'center', width: 500 });

    doc.moveDown(4);
    doc.fillColor('#000').fontSize(10).font('Helvetica').text('Issued by Dealer Representative,', 350, doc.y);
    doc.moveDown(3);
    doc.font('Helvetica-Bold').text(`(${booking.salesAgent?.name || 'Authorized Admin'})`, 350);

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportSaleInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { isProof } = req.query;
    const booking = await Booking.findByPk(id, {
      include: [{ model: Vehicle }, { model: Office }, { model: SalesAgent, as: 'salesAgent' }]
    });

    if (!booking) return res.status(404).json({ message: 'Record not found' });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    const title = isProof === 'true' ? 'OFFICIAL BILL OF SALE' : 'FINAL SETTLEMENT INVOICE';
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e40af').text(title, { align: 'right' });
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Invoice Number: INV-${new Date().getFullYear()}-${booking.id.split('-')[0].toUpperCase()}`, { align: 'right' });
    doc.moveDown(1.5);

    doc.fillColor('#000').fontSize(14).font('Helvetica-Bold').text(booking.Office?.name || 'Showroom Management System');
    doc.fontSize(10).font('Helvetica').text('Vehicle Ownership Transfer & Payment Settlement');
    doc.moveDown(2);

    // Client Info
    const startY = doc.y;
    doc.fontSize(11).font('Helvetica-Bold').text('BILL TO (PURCHASER)', 50, startY);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Full Name: ${booking.customer_name}`, 50, startY + 15);
    doc.text(`Phone No: ${booking.customer_phone}`, 50, startY + 30);

    doc.fontSize(11).font('Helvetica-Bold').text('VEHICLE DESCRIPTION', 320, startY);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Unit: ${booking.Vehicle?.brand} ${booking.Vehicle?.model}`, 320, startY + 15);
    doc.text(`Plate No: ${booking.Vehicle?.plate_number}`, 320, startY + 30);
    doc.text(`Odometer: ${booking.Vehicle?.odometer || 0} KM`, 320, startY + 45);

    doc.moveDown(5);

    // Financial breakdown
    const price = parseFloat(booking.Vehicle?.price || 0);
    const dp = parseFloat(booking.down_payment || 0);
    const total = price - dp;

    const tableY = doc.y;
    doc.rect(50, tableY, 500, 2).fill('#1e293b');
    doc.moveDown(0.5);
    
    doc.fillColor('#000').fontSize(10).font('Helvetica').text('Vehicle Agreed Selling Price', 50, tableY + 15);
    doc.text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price), 400, tableY + 15, { align: 'right', width: 140 });

    doc.text('Less: Down Payment', 50, tableY + 35);
    doc.text(`- ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(dp)}`, 400, tableY + 35, { align: 'right', width: 140 });

    doc.rect(350, tableY + 55, 200, 1).fill('#cbd5e1');
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#b91c1c').text('REMAINING BALANCE PAYABLE', 180, tableY + 65);
    doc.text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total), 400, tableY + 65, { align: 'right', width: 140 });

    if (isProof === 'true') {
      doc.moveDown(3);
      doc.rect(50, doc.y, 500, 40).fill('#f0fdf4');
      doc.fillColor('#16a34a').fontSize(14).font('Helvetica-Bold').text('TRANSACTION STATUS: PAID & CLOSED', 50, doc.y - 30, { align: 'center' });
    } else {
      doc.moveDown(4);
    }

    doc.moveDown(4);
    doc.fillColor('#000').fontSize(10).font('Helvetica').text('Authorized Dealer Representative,', 350, doc.y);
    doc.moveDown(3);
    doc.font('Helvetica-Bold').text(`(${booking.salesAgent?.name || 'Administrator'})`, 350);

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportDashboardPdf = async (req, res) => {
  try {
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    doc.text('Official Dashboard Report');
    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  exportUsers,
  exportSalesAgents,
  exportVehicles,
  exportBookingPdf,
  exportSaleInvoicePdf,
  exportDashboardPdf
};
