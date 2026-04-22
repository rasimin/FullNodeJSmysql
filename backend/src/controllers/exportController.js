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
    const title = isInvoice ? 'FINAL SETTLEMENT INVOICE' : 'UNIT DOWN PAYMENT RECEIPT';
    const subTitle = isInvoice ? 'Payment Request for Remaining Unit Balance' : 'Official Unit Down Payment & Security Deposit Statement';
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

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af').text('UNIT SPECIFICATIONS', rightLabelX, startY);
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

      doc.text('Unit Agreed Selling Price', 65, tableTop + 35);
      doc.font('Helvetica-Bold').text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price), 350, tableTop + 35, { align: 'right', width: 190 });

      doc.font('Helvetica').text('Less: Down Payment (Already Paid)', 65, tableTop + 55);
      doc.text(`- ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(dp)}`, 350, tableTop + 55, { align: 'right', width: 190 });

      doc.moveTo(350, tableTop + 75).lineTo(540, tableTop + 75).strokeColor('#cbd5e1').stroke();

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#b91c1c').text('REMAINING BALANCE PAYABLE', 65, tableTop + 85);
      doc.text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total), 350, tableTop + 85, { align: 'right', width: 190 });
    } else {
      doc.text('Unit Down Payment', 65, tableTop + 35);
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
      ? 'This invoice is for the final settlement of the unit purchase. Please ensure payment is made before the delivery date.'
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

    const title = isProof === 'true' ? 'SALES RECEIPT' : 'FINAL SETTLEMENT INVOICE';
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
    doc.fontSize(10).font('Helvetica').fillColor('#4b5563').text('Unit Ownership Transfer & Payment Settlement', { align: 'left' });
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

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af').text('UNIT DESCRIPTION', rightLabelX, startY);
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

    doc.moveDown(1.5);

    // Financial Breakdown
    const price = parseFloat(booking.Vehicle?.price || 0);
    const dp = parseFloat(booking.down_payment || 0);
    const total = price - dp;

    const tableTop = doc.y;
    doc.rect(50, tableTop, 500, 22).fill('#1e40af');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text('PAYMENT BREAKDOWN', 65, tableTop + 7);
    doc.text('AMOUNT (IDR)', 430, tableTop + 7);

    doc.fillColor('#000').font('Helvetica').fontSize(10);
    doc.text('Unit Agreed Selling Price', 65, tableTop + 35);
    doc.font('Helvetica-Bold').text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price), 350, tableTop + 35, { align: 'right', width: 190 });

    doc.font('Helvetica').text('Less: Down Payment', 65, tableTop + 55);
    doc.text(`- ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(dp)}`, 350, tableTop + 55, { align: 'right', width: 190 });

    doc.moveTo(350, tableTop + 75).lineTo(540, tableTop + 75).strokeColor('#cbd5e1').stroke();

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#b91c1c').text('TOTAL SETTLEMENT AMOUNT', 65, tableTop + 85);
    doc.text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total), 350, tableTop + 85, { align: 'right', width: 190 });

    doc.moveDown(2);

    if (isProof === 'true') {
      doc.save(); // Save state for rotation
      const stampX = 300;
      const stampY = doc.y + 35;
      doc.rotate(-10, { origin: [stampX, stampY] });

      doc.rect(stampX - 100, stampY - 20, 200, 40).lineWidth(2).strokeColor('#10b981').stroke();
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#10b981').text('PAID & CLOSED', stampX - 100, stampY - 8, { width: 200, align: 'center' });

      doc.restore(); // Restore state (stop rotation)
      doc.moveDown(4.5);

      doc.rect(50, doc.y, 500, 22).fill('#f0fdf4');
      doc.fillColor('#166534').fontSize(9).font('Helvetica-Bold').text('OFFICIAL PROOF OF UNIT OWNERSHIP TRANSFER', 50, doc.y + 6, { align: 'center', width: 500 });
      doc.moveDown(1.5);
    } else {
      doc.moveDown(2);
    }

    // Disclaimer
    const disclaimer = isProof === 'true'
      ? 'This document serves as the final proof of transaction and unit ownership transfer. All payments have been verified.'
      : 'Please ensure the remaining balance is settled before the agreed delivery date to avoid reservation cancellation.';

    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8').text(disclaimer, 50, doc.y, { align: 'center', width: 500 });

    // Footer Signature - Ensure block doesn't split
    if (doc.y > 720) doc.addPage();
    doc.moveDown(2);
    const footerY = doc.y;

    doc.fillColor('#4b5563').fontSize(10).font('Helvetica').text(`Issued Date: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, footerY);

    doc.fillColor('#000').font('Helvetica-Bold').text('Authorized Dealer Representative,', 340, footerY);
    doc.moveDown(3);
    doc.text(`( ${booking.salesAgent?.name || 'Authorized Representative'} )`, 340);
    doc.fontSize(8).font('Helvetica').text('Dealer Sales Manager / Representative', 340);

    // Attachment: Proof of Delivery Photo (If exists)
    if (booking.delivery_photo) {
      try {
        const photoPath = path.join(__dirname, '../../', booking.delivery_photo);
        if (fs.existsSync(photoPath)) {
          doc.addPage();
          doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af').text('ATTACHMENT: PROOF OF DELIVERY', { align: 'center' });
          doc.moveDown(1);
          doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
          doc.moveDown(2);

          doc.image(photoPath, {
            fit: [500, 600],
            align: 'center',
            valign: 'center'
          });

          doc.moveDown(2);
          doc.fontSize(9).font('Helvetica-Oblique').fillColor('#64748b').text('This photograph serves as formal visual confirmation of the unit handover process to the authorized purchaser.', { align: 'center', width: 400 });
        }
      } catch (imgErr) {
        console.error('Error adding photo to PDF:', imgErr);
      }
    }

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

    // Helper for Table Rendering with Grid Lines
    const drawTable = (headers, rows, widths, options = {}) => {
      const { align = [] } = options;
      const startX = 40;

      // Draw Headers
      let maxHeaderHeight = 0;
      headers.forEach((h, i) => {
        const height = doc.heightOfString(h, { width: widths[i] - 10 });
        if (height > maxHeaderHeight) maxHeaderHeight = height;
      });
      const headerHeight = maxHeaderHeight + 10;

      if (doc.y + headerHeight > 780) doc.addPage();

      let currentY = doc.y;
      doc.rect(startX, currentY, widths.reduce((a, b) => a + b, 0), headerHeight).fill('#f8fafc');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');

      let x = startX;
      headers.forEach((h, i) => {
        doc.text(h, x + 5, currentY + 5, { width: widths[i] - 10, align: align[i] || 'left' });
        doc.rect(x, currentY, widths[i], headerHeight).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
        x += widths[i];
      });

      doc.y = currentY + headerHeight;

      // Draw Rows
      rows.forEach(row => {
        let maxRowHeight = 0;
        row.forEach((cell, i) => {
          const height = doc.heightOfString(String(cell), { width: widths[i] - 10 });
          if (height > maxRowHeight) maxRowHeight = height;
        });
        const rowHeight = maxRowHeight + 10;

        if (doc.y + rowHeight > 780) {
          doc.addPage();
        }

        currentY = doc.y;
        doc.fontSize(8).font('Helvetica').fillColor('#000');
        x = startX;
        row.forEach((cell, i) => {
          doc.text(String(cell), x + 5, currentY + 5, { width: widths[i] - 10, align: align[i] || 'left' });
          doc.rect(x, currentY, widths[i], rowHeight).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
          x += widths[i];
        });
        doc.y = currentY + rowHeight;
      });
    };

    const drawSummaryRow = (label, values, widths, options = {}) => {
      const { color = '#000', bgColor = '#f8fafc', align = [] } = options;
      const startX = 40;
      const rowHeight = 18;
      if (doc.y + rowHeight > 780) doc.addPage();
      const currentY = doc.y;

      const labelWidth = widths.slice(0, widths.length - values.length).reduce((a, b) => a + b, 0);

      doc.rect(startX, currentY, widths.reduce((a, b) => a + b, 0), rowHeight).fill(bgColor);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(color);

      doc.text(label, startX + 5, currentY + 5, { width: labelWidth - 10, align: 'right' });
      doc.rect(startX, currentY, labelWidth, rowHeight).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

      let x = startX + labelWidth;
      values.forEach((val, i) => {
        const colIdx = widths.length - values.length + i;
        doc.text(val, x + 5, currentY + 5, { width: widths[colIdx] - 10, align: align[i] || 'right' });
        doc.rect(x, currentY, widths[colIdx], rowHeight).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
        x += widths[colIdx];
      });
      doc.y = currentY + rowHeight;
    };

    // 1. Initial Quick Summary Table (Cross-check)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af').text('QUICK SUMMARY BY CATEGORY', 40);
    doc.moveDown(0.5);

    const quickSummaryWidths = [115, 100, 100, 100, 100];
    const quickSummaryRows = categories.map(cat => {
      const data = summary[cat];
      const sTotal = data.sales.reduce((sum, v) => sum + Number(v.price), 0);
      const pTotal = data.purchases.reduce((sum, v) => sum + Number(v.purchase_price), 0);
      const serTotal = data.purchases.reduce((sum, v) => sum + Number(v.service_cost), 0);
      const cTotal = data.cancellations.reduce((sum, b) => sum + Number(b.down_payment), 0);
      const net = sTotal + cTotal - (pTotal + serTotal);

      return [
        cat.toUpperCase(),
        formatIDR(sTotal),
        formatIDR(pTotal + serTotal),
        formatIDR(cTotal),
        formatIDR(net)
      ];
    });

    drawTable(
      ['Category', 'Total Revenue', 'Total Expenses', 'Cancellation', 'Net Cash Flow'],
      quickSummaryRows,
      quickSummaryWidths,
      { align: ['left', 'right', 'right', 'right', 'right'] }
    );

    // Grand Total Row for Quick Summary
    const grandSalesSum = sales.reduce((sum, v) => sum + Number(v.price), 0);
    const grandExpSum = purchases.reduce((sum, v) => sum + Number(v.purchase_price), 0) + purchases.reduce((sum, v) => sum + Number(v.service_cost), 0);
    const grandCancelSum = cancellations.reduce((sum, b) => sum + Number(b.down_payment), 0);
    const grandNetSum = grandSalesSum + grandCancelSum - grandExpSum;

    drawSummaryRow(
      'GRAND TOTAL:',
      [formatIDR(grandSalesSum), formatIDR(grandExpSum), formatIDR(grandCancelSum), formatIDR(grandNetSum)],
      quickSummaryWidths,
      { color: '#1e40af', bgColor: '#f1f5f9' }
    );

    doc.moveDown(2);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(2);

    // 2. Render Detailed Transaction Tables (Merged)
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e40af').text('DETAILED TRANSACTION LEDGER', 40);
    doc.moveDown(1);

    // --- Merged Sales Section ---
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#16a34a').text('ALL SALES TRANSACTIONS', 40);
    doc.moveDown(0.5);

    const salesWidths = [50, 160, 80, 110, 115];
    const salesRows = sales.map(s => {
      const margin = Number(s.price) - (Number(s.purchase_price) + Number(s.service_cost));
      return [
        s.type === 'Mobil' ? 'MOBIL' : 'MOTOR',
        `${s.brand} ${s.model}`,
        s.sold_date || '-',
        formatIDR(s.price),
        formatIDR(margin)
      ];
    });

    drawTable(
      ['Type', 'Unit Description', 'Sold Date', 'Revenue', 'Margin'],
      salesRows,
      salesWidths,
      { align: ['center', 'left', 'left', 'right', 'right'] }
    );
    drawSummaryRow('TOTAL SALES:', [formatIDR(grandSalesSum), formatIDR(sales.reduce((sum, s) => sum + (Number(s.price) - (Number(s.purchase_price) + Number(s.service_cost))), 0))], salesWidths, { color: '#16a34a' });
    doc.moveDown(2);

    // --- Merged Purchase Section ---
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2563eb').text('ALL PURCHASE & ACQUISITION TRANSACTIONS', 40);
    doc.moveDown(0.5);

    const purchaseWidths = [50, 160, 80, 110, 115];
    const purchaseRows = purchases.map(p => {
      return [
        p.type === 'Mobil' ? 'MOBIL' : 'MOTOR',
        `${p.brand} ${p.model}`,
        p.entry_date || '-',
        formatIDR(p.purchase_price),
        formatIDR(p.service_cost)
      ];
    });

    drawTable(
      ['Type', 'Unit Description', 'Entry Date', 'Acquisition', 'Service Cost'],
      purchaseRows,
      purchaseWidths,
      { align: ['center', 'left', 'left', 'right', 'right'] }
    );
    drawSummaryRow('TOTAL PURCHASES:', [formatIDR(purchases.reduce((sum, p) => sum + Number(p.purchase_price), 0)), formatIDR(purchases.reduce((sum, p) => sum + Number(p.service_cost), 0))], purchaseWidths, { color: '#2563eb' });
    doc.moveDown(2);

    // --- Merged Cancellation Section ---
    if (cancellations.length > 0) {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#ea580c').text('ALL CANCELLATION REVENUE', 40);
      doc.moveDown(0.5);

      const cancelWidths = [50, 150, 170, 145];
      const cancelRows = cancellations.map(c => {
        return [
          c.Vehicle?.type === 'Mobil' ? 'MOBIL' : 'MOTOR',
          c.customer_name,
          `${c.Vehicle?.brand} ${c.Vehicle?.model}`,
          formatIDR(c.down_payment)
        ];
      });

      drawTable(
        ['Type', 'Customer Name', 'Vehicle Description', 'DP Income'],
        cancelRows,
        cancelWidths,
        { align: ['center', 'left', 'left', 'right'] }
      );
      drawSummaryRow('TOTAL CANCELLATION:', [formatIDR(grandCancelSum)], cancelWidths, { color: '#ea580c' });
      doc.moveDown(2);
    }

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
