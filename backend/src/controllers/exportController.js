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
    
    // Error handling for the PDF stream to prevent server crash
    doc.on('error', err => {
      console.error('PDF Stream Error:', err);
      if (!res.headersSent) res.status(500).send('Error generating PDF');
    });

    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    const isInvoice = type === 'dp-invoice';
    const title = isInvoice ? 'FINAL SETTLEMENT INVOICE' : 'VEHICLE DOWN PAYMENT RECEIPT';
    const subTitle = isInvoice ? 'Payment Request for Remaining Vehicle Balance' : 'Official Vehicle Down Payment & Security Deposit Statement';
    const shortId = booking.id ? String(booking.id).split('-')[0].toUpperCase() : 'N/A';

    // Header: Modern Centered Design
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e40af').text(title, { align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`Document ID: REF-${shortId}`, { align: 'center' });
    doc.moveDown(0.5);
    
    // Header Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(1);

    // Business & Document Subtitle
    doc.fillColor('#000').fontSize(14).font('Helvetica-Bold').text(booking.Office?.name || 'Showroom Management System', { align: 'left' });
    if (booking.Office?.address) {
      doc.fontSize(8).font('Helvetica').fillColor('#4b5563').text(booking.Office.address, { align: 'left', width: 250 });
    }
    if (booking.Office?.phone) {
      doc.fontSize(8).font('Helvetica').fillColor('#4b5563').text(`Phone: ${booking.Office.phone}`, { align: 'left' });
    }
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica').fillColor('#4b5563').text(subTitle, { align: 'left' });
    doc.moveDown(2);

    // Info Grid (Purchaser & Vehicle)
    const startY = doc.y;
    
    // Left Column: Purchaser
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af').text('PURCHASER INFORMATION', 50, startY);
    doc.rect(50, startY + 12, 40, 2).fill('#1e40af'); // Underline accent
    doc.font('Helvetica').fontSize(10).fillColor('#000');
    
    const labelX = 50;
    const valueX = 125;
    const rowHeight = 18; // Increased from 15 to prevent overlap
    
    doc.text(`Name`, labelX, startY + 25);
    doc.text(`:`, valueX - 10, startY + 25);
    doc.font('Helvetica-Bold').text(booking.customer_name || '-', valueX, startY + 25);
    
    doc.font('Helvetica').text(`NIK (ID)`, labelX, startY + 25 + rowHeight);
    doc.text(`:`, valueX - 10, startY + 25 + rowHeight);
    doc.text(booking.nik || '-', valueX, startY + 25 + rowHeight);
    
    doc.font('Helvetica').text(`Phone`, labelX, startY + 25 + (rowHeight * 2));
    doc.text(`:`, valueX - 10, startY + 25 + (rowHeight * 2));
    doc.text(booking.customer_phone || '-', valueX, startY + 25 + (rowHeight * 2));
    
    doc.font('Helvetica').text(`Booking`, labelX, startY + 25 + (rowHeight * 3));
    doc.text(`:`, valueX - 10, startY + 25 + (rowHeight * 3));
    doc.text(new Date(booking.booking_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }), valueX, startY + 25 + (rowHeight * 3));

    // Right Column: Vehicle
    const rightLabelX = 320;
    const rightValueX = 390;
    const rightColWidth = 160; // Constraint width for value wrapping
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af').text('VEHICLE SPECIFICATIONS', rightLabelX, startY);
    doc.rect(320, startY + 12, 40, 2).fill('#1e40af'); // Underline accent
    doc.font('Helvetica').fontSize(10).fillColor('#000');
    
    doc.text(`Unit`, rightLabelX, startY + 25);
    doc.text(`:`, rightValueX - 10, startY + 25);
    doc.font('Helvetica-Bold').text(`${booking.Vehicle?.brand || ''} ${booking.Vehicle?.model || ''}`, rightValueX, startY + 25, { width: rightColWidth });
    
    // We calculate next Y based on potential wrapping of Unit name
    const unitTextHeight = doc.heightOfString(`${booking.Vehicle?.brand || ''} ${booking.Vehicle?.model || ''}`, { width: rightColWidth });
    const nextY = startY + 25 + Math.max(unitTextHeight + 5, rowHeight + 5);

    doc.font('Helvetica').text(`Year`, rightLabelX, nextY);
    doc.text(`:`, rightValueX - 10, nextY);
    doc.text(booking.Vehicle?.year || '-', rightValueX, nextY);
    
    doc.text(`Plate`, rightLabelX, nextY + rowHeight);
    doc.text(`:`, rightValueX - 10, nextY + rowHeight);
    doc.text(booking.Vehicle?.plate_number || '-', rightValueX, nextY + rowHeight);

    doc.moveDown(5);

    // Transaction Table Section
    const tableTop = doc.y;
    doc.rect(50, tableTop, 500, 22).fill('#1e40af');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text('TRANSACTION DESCRIPTION', 65, tableTop + 7);
    doc.text('AMOUNT (IDR)', 430, tableTop + 7);
    
    doc.fillColor('#000').font('Helvetica').fontSize(10);
    if (isInvoice) {
      const price = parseFloat(booking.Vehicle?.price || 0);
      const dp = parseFloat(booking.down_payment || 0);
      const total = price - dp;

      doc.text('Vehicle Agreed Selling Price', 65, tableTop + 35);
      doc.font('Helvetica-Bold').text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price), 350, tableTop + 35, { align: 'right', width: 190 });

      doc.font('Helvetica').text('Less: Down Payment (Already Paid)', 65, tableTop + 55);
      doc.text(`- ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(dp)}`, 350, tableTop + 55, { align: 'right', width: 190 });

      doc.moveTo(350, tableTop + 75).lineTo(540, tableTop + 75).strokeColor('#cbd5e1').stroke();
      
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#b91c1c').text('REMAINING BALANCE PAYABLE', 65, tableTop + 85);
      doc.text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total), 350, tableTop + 85, { align: 'right', width: 190 });
    } else {
      doc.text('Vehicle Down Payment / Booking Fee Reservation', 65, tableTop + 35);
      doc.fontSize(12).font('Helvetica-Bold').text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(booking.down_payment || 0), 350, tableTop + 35, { align: 'right', width: 190 });
    }

    doc.moveDown(7);

    // Remarks Section (If exists)
    if (booking.notes) {
      const currentY = doc.y;
      doc.rect(50, currentY, 500, 40).dash(5, { space: 2 }).strokeColor('#e2e8f0').stroke();
      doc.undash();
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text('REMARKS / ADDITIONAL NOTES:', 60, currentY + 10);
      doc.fontSize(9).font('Helvetica').fillColor('#1e293b').text(booking.notes, 60, currentY + 22, { width: 480 });
      doc.moveDown(4);
    }

    // Disclaimer Note
    const disclaimer = isInvoice 
      ? 'This invoice is for the final settlement of the vehicle purchase. Please ensure payment is made before the delivery date.'
      : 'This document serves as a formal acknowledgement of the reservation payment. The unit is reserved for the client pending final settlement.';
    
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8').text(disclaimer, 50, doc.y, { align: 'center', width: 500 });

    // Footer Signature
    doc.moveDown(4);
    const footerY = doc.y;
    
    // Standard Date and Sign area
    doc.fillColor('#4b5563').fontSize(10).font('Helvetica').text(`Issued Date: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, footerY);
    
    doc.fillColor('#000').font('Helvetica-Bold').text('Authorized Signature,', 380, footerY);
    doc.moveDown(4);
    doc.text(`( ${booking.salesAgent?.name || 'Authorized Representative'} )`, 380);
    doc.fontSize(8).font('Helvetica').text('Dealer Sales Representative', 380);

    doc.end();
  } catch (error) {
    console.error('Export PDF Error:', error);
    if (!res.headersSent) res.status(500).json({ message: error.message });
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

    doc.on('error', err => {
      console.error('Sale PDF Stream Error:', err);
      if (!res.headersSent) res.status(500).send('Error generating PDF');
    });

    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    const title = isProof === 'true' ? 'OFFICIAL BILL OF SALE' : 'FINAL SETTLEMENT INVOICE';
    const shortId = booking.id ? String(booking.id).split('-')[0].toUpperCase() : 'N/A';

    // Header: Modern Centered Design
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e40af').text(title, { align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`Invoice Number: INV-${new Date().getFullYear()}-${shortId}`, { align: 'center' });
    doc.moveDown(0.5);
    
    // Header Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(1);

    // Business & Document Subtitle
    doc.fillColor('#000').fontSize(14).font('Helvetica-Bold').text(booking.Office?.name || 'Showroom Management System', { align: 'left' });
    if (booking.Office?.address) {
      doc.fontSize(8).font('Helvetica').fillColor('#4b5563').text(booking.Office.address, { align: 'left', width: 250 });
    }
    if (booking.Office?.phone) {
      doc.fontSize(8).font('Helvetica').fillColor('#4b5563').text(`Phone: ${booking.Office.phone}`, { align: 'left' });
    }
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica').fillColor('#4b5563').text('Vehicle Ownership Transfer & Payment Settlement', { align: 'left' });
    doc.moveDown(2);

    // Info Grid (Purchaser & Vehicle)
    const startY = doc.y;
    
    // Left Column: Bill To
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af').text('BILL TO (PURCHASER)', 50, startY);
    doc.rect(50, startY + 12, 40, 2).fill('#1e40af'); // Underline accent
    doc.font('Helvetica').fontSize(10).fillColor('#000');
    
    const labelX = 50;
    const valueX = 125;
    const rowHeight = 18;
    
    doc.text(`Name`, labelX, startY + 25);
    doc.text(`:`, valueX - 10, startY + 25);
    doc.font('Helvetica-Bold').text(booking.customer_name || '-', valueX, startY + 25);
    
    doc.font('Helvetica').text(`NIK (ID)`, labelX, startY + 25 + rowHeight);
    doc.text(`:`, valueX - 10, startY + 25 + rowHeight);
    doc.text(booking.nik || '-', valueX, startY + 25 + rowHeight);
    
    doc.font('Helvetica').text(`Phone`, labelX, startY + 25 + (rowHeight * 2));
    doc.text(`:`, valueX - 10, startY + 25 + (rowHeight * 2));
    doc.text(booking.customer_phone || '-', valueX, startY + 25 + (rowHeight * 2));
    
    doc.font('Helvetica').text(`Booking`, labelX, startY + 25 + (rowHeight * 3));
    doc.text(`:`, valueX - 10, startY + 25 + (rowHeight * 3));
    doc.text(new Date(booking.booking_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }), valueX, startY + 25 + (rowHeight * 3));

    // Right Column: Vehicle Description
    const rightLabelX = 320;
    const rightValueX = 390;
    const rightColWidth = 160;
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af').text('VEHICLE DESCRIPTION', rightLabelX, startY);
    doc.rect(320, startY + 12, 40, 2).fill('#1e40af'); // Underline accent
    doc.font('Helvetica').fontSize(10).fillColor('#000');
    
    doc.text(`Unit`, rightLabelX, startY + 25);
    doc.text(`:`, rightValueX - 10, startY + 25);
    doc.font('Helvetica-Bold').text(`${booking.Vehicle?.brand || ''} ${booking.Vehicle?.model || ''}`, rightValueX, startY + 25, { width: rightColWidth });
    
    const unitTextHeight = doc.heightOfString(`${booking.Vehicle?.brand || ''} ${booking.Vehicle?.model || ''}`, { width: rightColWidth });
    let nextY = startY + 25 + Math.max(unitTextHeight + 5, rowHeight + 5);

    doc.text(`Plate`, rightLabelX, nextY);
    doc.text(`:`, rightValueX - 10, nextY);
    doc.text(booking.Vehicle?.plate_number || '-', rightValueX, nextY);
    
    nextY += rowHeight;
    doc.text(`Odo`, rightLabelX, nextY);
    doc.text(`:`, rightValueX - 10, nextY);
    doc.text(`${booking.Vehicle?.odometer || 0} KM`, rightValueX, nextY);
    
    if (isProof === 'true' && booking.Vehicle?.sold_date) {
      nextY += rowHeight;
      doc.font('Helvetica-Bold').fillColor('#b91c1c').text(`Sold Date`, rightLabelX, nextY);
      doc.font('Helvetica').text(`:`, rightValueX - 10, nextY);
      doc.font('Helvetica-Bold').text(new Date(booking.Vehicle.sold_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }), rightValueX, nextY);
    }

    doc.moveDown(5);

    // Financial Breakdown
    const price = parseFloat(booking.Vehicle?.price || 0);
    const dp = parseFloat(booking.down_payment || 0);
    const total = price - dp;

    const tableTop = doc.y;
    doc.rect(50, tableTop, 500, 22).fill('#1e40af');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text('PAYMENT BREAKDOWN', 65, tableTop + 7);
    doc.text('AMOUNT (IDR)', 430, tableTop + 7);
    
    doc.fillColor('#000').font('Helvetica').fontSize(10);
    doc.text('Vehicle Agreed Selling Price', 65, tableTop + 35);
    doc.font('Helvetica-Bold').text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price), 350, tableTop + 35, { align: 'right', width: 190 });

    doc.font('Helvetica').text('Less: Down Payment / Reservation Fee', 65, tableTop + 55);
    doc.text(`- ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(dp)}`, 350, tableTop + 55, { align: 'right', width: 190 });

    doc.moveTo(350, tableTop + 75).lineTo(540, tableTop + 75).strokeColor('#cbd5e1').stroke();
    
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#b91c1c').text('TOTAL SETTLEMENT AMOUNT', 65, tableTop + 85);
    doc.text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total), 350, tableTop + 85, { align: 'right', width: 190 });

    doc.moveDown(4);

    if (isProof === 'true') {
      doc.save(); // Save state for rotation
      const stampX = 300;
      const stampY = doc.y + 40;
      doc.rotate(-10, { origin: [stampX, stampY] });
      
      doc.rect(stampX - 100, stampY - 20, 200, 40).lineWidth(2).strokeColor('#10b981').stroke();
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#10b981').text('PAID & CLOSED', stampX - 100, stampY - 8, { width: 200, align: 'center' });
      
      doc.restore(); // Restore state (stop rotation)
      doc.moveDown(6);
      
      doc.rect(50, doc.y, 500, 25).fill('#f0fdf4');
      doc.fillColor('#166534').fontSize(9).font('Helvetica-Bold').text('OFFICIAL PROOF OF VEHICLE OWNERSHIP TRANSFER', 50, doc.y + 8, { align: 'center', width: 500 });
      doc.moveDown(3);
    } else {
      doc.moveDown(5);
    }

    // Disclaimer
    const disclaimer = isProof === 'true' 
      ? 'This document serves as the final proof of transaction and vehicle ownership transfer. All payments have been verified.'
      : 'Please ensure the remaining balance is settled before the agreed delivery date to avoid reservation cancellation.';
    
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8').text(disclaimer, 50, doc.y, { align: 'center', width: 500 });

    // Footer Signature
    doc.moveDown(4);
    const footerY = doc.y;
    
    doc.fillColor('#4b5563').fontSize(10).font('Helvetica').text(`Issued Date: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, footerY);
    
    doc.fillColor('#000').font('Helvetica-Bold').text('Authorized Dealer Representative,', 340, footerY);
    doc.moveDown(4);
    doc.text(`( ${booking.salesAgent?.name || 'Authorized Representative'} )`, 340);
    doc.fontSize(8).font('Helvetica').text('Dealer Sales Manager / Representative', 340);

    doc.end();
  } catch (error) {
    console.error('Export Sale PDF Error:', error);
    if (!res.headersSent) res.status(500).json({ message: error.message });
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

const exportFinancialReportPdf = async (req, res) => {
  try {
    const { officeId, year } = req.query;
    const user = req.user;
    const isSuperAdmin = user.Role?.name === 'Super Admin';
    let officeIds = [];
    
    if (isSuperAdmin) {
      if (officeId) officeIds = [officeId];
      else {
        const all = await Office.findAll({ attributes: ['id'] });
        officeIds = all.map(o => o.id);
      }
    } else {
      const currentOffice = await Office.findByPk(user.office_id);
      if (currentOffice && !currentOffice.parent_id) {
        const mapping = await Office.findAll({
          where: { [Op.or]: [{ id: user.office_id }, { parent_id: user.office_id }] },
          attributes: ['id']
        });
        officeIds = mapping.map(o => o.id);
      } else {
        officeIds = [user.office_id];
      }
    }

    const where = { office_id: { [Op.in]: officeIds } };
    let salesWhere = { ...where, status: 'Sold' };
    let purchaseWhere = { ...where };
    let bookingWhere = { ...where, status: 'Cancelled' };
    
    if (year && year !== 'all') {
      const startDate = new Date(`${year}-01-01T00:00:00`);
      const endDate = new Date(`${year}-12-31T23:59:59`);
      salesWhere.sold_date = { [Op.between]: [startDate, endDate] };
      purchaseWhere.entry_date = { [Op.between]: [startDate, endDate] };
      bookingWhere.booking_date = { [Op.between]: [startDate, endDate] };
    }

    // Fetch Data
    const sales = await Vehicle.findAll({ where: salesWhere });
    const purchases = await Vehicle.findAll({ where: purchaseWhere });
    const cancellations = await Booking.findAll({ 
      where: bookingWhere,
      include: [{ model: Vehicle, attributes: ['type', 'brand', 'model'] }]
    });

    // Grouping Logic
    const summary = {}; // { Category: { sales: [], purchases: [], cancellations: [] } }
    const categories = [...new Set([...sales.map(v => v.type), ...purchases.map(v => v.type)])];

    categories.forEach(cat => {
      summary[cat] = {
        sales: sales.filter(v => v.type === cat),
        purchases: purchases.filter(v => v.type === cat),
        cancellations: cancellations.filter(b => b.Vehicle?.type === cat)
      };
    });

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Financial_Report_${year}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e40af').text('FINANCIAL PERFORMANCE DETAIL REPORT', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Fiscal Period: ${year === 'all' ? 'All-Time' : year}`, { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(2);

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    // Render Categories
    categories.forEach(cat => {
      const data = summary[cat];
      
      // Category Header
      doc.rect(40, doc.y, 515, 20).fill('#f8fafc');
      doc.fillColor('#334155').font('Helvetica-Bold').fontSize(11).text(`CATEGORY: ${cat.toUpperCase()}`, 50, doc.y - 15);
      doc.moveDown(1);

      // --- Sales Section ---
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#16a34a').text('SALES (REVENUE)', 50);
      doc.moveDown(0.5);
      
      let salesTotal = 0;
      let marginTotal = 0;
      
      // Table Header
      const tableX = [50, 200, 320, 420];
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
      doc.text('Vehicle Description', tableX[0], doc.y);
      doc.text('Sold Date', tableX[1], doc.y);
      doc.text('Revenue', tableX[2], doc.y);
      doc.text('Margin', tableX[3], doc.y);
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(540, doc.y).strokeColor('#f1f5f9').stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica').fillColor('#000');
      data.sales.forEach(s => {
        const margin = Number(s.price) - (Number(s.purchase_price) + Number(s.service_cost));
        salesTotal += Number(s.price);
        marginTotal += margin;

        if (doc.y > 750) doc.addPage();
        
        doc.text(`${s.brand} ${s.model}`, tableX[0], doc.y, { width: 140 });
        const textY = doc.y;
        doc.text(s.sold_date || '-', tableX[1], textY);
        doc.text(formatIDR(s.price), tableX[2], textY);
        doc.text(formatIDR(margin), tableX[3], textY);
        doc.moveDown(0.5);
      });

      // Sub-total Sales
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fillColor('#16a34a');
      doc.text(`Sub-total ${cat} Sales:`, tableX[1], doc.y);
      doc.text(formatIDR(salesTotal), tableX[2], doc.y);
      doc.text(formatIDR(marginTotal), tableX[3], doc.y);
      doc.moveDown(2);

      // --- Purchase Section ---
      if (doc.y > 700) doc.addPage();
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#2563eb').text('PURCHASES (ACQUISITION)', 50);
      doc.moveDown(0.5);
      
      let buyTotal = 0;
      let serviceTotal = 0;
      
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
      doc.text('Vehicle Description', tableX[0], doc.y);
      doc.text('Entry Date', tableX[1], doc.y);
      doc.text('Acquisition', tableX[2], doc.y);
      doc.text('Service Cost', tableX[3], doc.y);
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(540, doc.y).strokeColor('#f1f5f9').stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica').fillColor('#000');
      data.purchases.forEach(p => {
        buyTotal += Number(p.purchase_price);
        serviceTotal += Number(p.service_cost);
        
        if (doc.y > 750) doc.addPage();
        doc.text(`${p.brand} ${p.model}`, tableX[0], doc.y, { width: 140 });
        const textY = doc.y;
        doc.text(p.entry_date, tableX[1], textY);
        doc.text(formatIDR(p.purchase_price), tableX[2], textY);
        doc.text(formatIDR(p.service_cost), tableX[3], textY);
        doc.moveDown(0.5);
      });

      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fillColor('#2563eb');
      doc.text(`Sub-total ${cat} Purchases:`, tableX[1], doc.y);
      doc.text(formatIDR(buyTotal), tableX[2], doc.y);
      doc.text(formatIDR(serviceTotal), tableX[3], doc.y);
      doc.moveDown(2);

      // --- Cancellation Section ---
      if (data.cancellations.length > 0) {
        if (doc.y > 700) doc.addPage();
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#ea580c').text('CANCELLATION REVENUE (NON-REFUNDABLE DP)', 50);
        doc.moveDown(0.5);
        
        let cancelTotal = 0;
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
        doc.text('Customer Name', tableX[0], doc.y);
        doc.text('Vehicle', tableX[1], doc.y);
        doc.text('DP Income', tableX[2], doc.y);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(540, doc.y).strokeColor('#f1f5f9').stroke();
        doc.moveDown(0.3);

        doc.font('Helvetica').fillColor('#000');
        data.cancellations.forEach(c => {
          cancelTotal += Number(c.down_payment);
          if (doc.y > 750) doc.addPage();
          doc.text(c.customer_name, tableX[0], doc.y);
          const textY = doc.y;
          doc.text(`${c.Vehicle?.brand} ${c.Vehicle?.model}`, tableX[1], textY);
          doc.text(formatIDR(c.down_payment), tableX[2], textY);
          doc.moveDown(0.5);
        });
        
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fillColor('#ea580c');
        doc.text(`Sub-total ${cat} Cancel Revenue:`, tableX[1], doc.y);
        doc.text(formatIDR(cancelTotal), tableX[2], doc.y);
        doc.moveDown(2);
      }

      doc.moveDown(1);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      doc.moveDown(2);
    });

    // Summary Page / Section
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e40af').text('EXECUTIVE FINANCIAL SUMMARY', { align: 'left' });
    doc.moveDown(1);
    
    const grandSales = sales.reduce((sum, v) => sum + Number(v.price), 0);
    const grandMargin = sales.reduce((sum, v) => sum + (Number(v.price) - (Number(v.purchase_price) + Number(v.service_cost))), 0);
    const grandBuy = purchases.reduce((sum, v) => sum + Number(v.purchase_price), 0);
    const grandService = purchases.reduce((sum, v) => sum + Number(v.service_cost), 0);
    const grandCancel = cancellations.reduce((sum, b) => sum + Number(b.down_payment), 0);

    const summaryData = [
      { label: 'Total Sales Revenue', value: formatIDR(grandSales), color: '#16a34a' },
      { label: 'Total Net Margin (Profit)', value: formatIDR(grandMargin), color: '#16a34a' },
      { label: 'Total Capital Expenditure (Buying)', value: formatIDR(grandBuy), color: '#dc2626' },
      { label: 'Total Service & Prep Costs', value: formatIDR(grandService), color: '#ea580c' },
      { label: 'Total Cancellation Income', value: formatIDR(grandCancel), color: '#2563eb' },
      { label: 'NET CASH MOVEMENT', value: formatIDR(grandSales + grandCancel - (grandBuy + grandService)), color: '#1e40af', bold: true }
    ];

    summaryData.forEach(item => {
      doc.fontSize(10).font(item.bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#475569').text(item.label, 50);
      doc.fillColor(item.color).text(item.value, 300, doc.y - 12, { align: 'right', width: 200 });
      doc.moveDown(0.8);
    });

    // Footer
    doc.fontSize(8).fillColor('#94a3b8').text(`Generated on: ${new Date().toLocaleString('id-ID')}`, 50, 780, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Export Financial PDF Error:', error);
    if (!res.headersSent) res.status(500).json({ message: error.message });
  }
};

module.exports = {
  exportUsers,
  exportSalesAgents,
  exportVehicles,
  exportBookingPdf,
  exportSaleInvoicePdf,
  exportDashboardPdf,
  exportFinancialReportPdf
};
