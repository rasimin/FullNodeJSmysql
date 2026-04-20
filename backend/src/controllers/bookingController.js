const { Booking, Vehicle, User, Office, SalesAgent, BookingArchive } = require('../models');
const { Op } = require('sequelize');
const { getPagination, getPagingData } = require('../utils/pagination');

exports.createBooking = async (req, res) => {
  try {
    const { vehicle_id, customer_name, customer_phone, nik, id_number, booking_date, expiry_date, down_payment, notes } = req.body;
    
    // Application-level mandatory validation for NIK
    if (!nik) return res.status(400).json({ message: 'NIK (National ID Number) is mandatory' });

    // Pastikan kendaraan ada dan tersedia
    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (vehicle.status !== 'Available') return res.status(400).json({ message: 'Vehicle already booked or sold' });

    // Buat data booking
    const booking = await Booking.create({
      vehicle_id,
      customer_name,
      customer_phone,
      nik,
      id_number,
      booking_date,
      expiry_date,
      down_payment: down_payment || 0,
      notes,
      sales_agent_id: req.body.sales_agent_id || null,
      booked_by_agent_id: req.body.sales_agent_id || null,
      user_id: req.user.id,
      office_id: vehicle.office_id,
      status: 'Active'
    }, { userId: req.user.id });

    // Update status kendaraan menjadi Booked
    await vehicle.update({ 
      status: 'Booked',
      sales_agent_id: req.body.sales_agent_id || null 
    }, { userId: req.user.id });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    if (booking.status !== 'Active') return res.status(400).json({ message: 'Only active bookings can be cancelled' });

    await booking.update({ status: 'Cancelled' }, { userId: req.user.id });
    
    const vehicle = await Vehicle.findByPk(booking.vehicle_id);
    if (vehicle) {
      await vehicle.update({ 
        status: 'Available',
        sales_agent_id: null
      }, { userId: req.user.id });
    }
    
    res.json({ message: 'Booking cancelled and vehicle released' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelVehicleBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: { vehicle_id: req.params.vehicleId, status: 'Active' }
    });
    
    if (!booking) return res.status(404).json({ message: 'Active booking not found for this vehicle' });

    await booking.update({ status: 'Cancelled' }, { userId: req.user.id });
    
    const vehicle = await Vehicle.findByPk(req.params.vehicleId);
    if (vehicle) {
      await vehicle.update({ 
        status: 'Available', 
        sales_agent_id: null 
      }, { userId: req.user.id });
    }
    
    res.json({ message: 'Booking cancelled and unit is now Available' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getVehicleBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: { vehicle_id: req.params.vehicleId, status: 'Active' },
      include: [
        { model: User, attributes: ['name'] },
        { model: Office, attributes: ['name'] }
      ]
    });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const { page, size, search, status, officeId: filterOfficeId, startDate, endDate } = req.query;
    const { limit, offset } = getPagination(page, size);
    const user = req.user;

    // --- Office Filtering Logic ---
    const isSuperAdmin = user.Role?.name === 'Super Admin';
    const currentOffice = await Office.findByPk(user.office_id);
    let officeIds = [];

    if (isSuperAdmin) {
      if (filterOfficeId) {
        officeIds = [filterOfficeId];
      } else {
        const allOffices = await Office.findAll({ attributes: ['id'] });
        officeIds = allOffices.map(o => o.id);
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
    if (status) condition.status = status;

    if (startDate && endDate) {
      condition.booking_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      condition.booking_date = { [Op.gte]: startDate };
    } else if (endDate) {
      condition.booking_date = { [Op.lte]: endDate };
    }
    
    if (search) {
      condition[Op.or] = [
        { customer_name: { [Op.like]: `%${search}%` } },
        { customer_phone: { [Op.like]: `%${search}%` } },
        { '$Vehicle.brand$': { [Op.like]: `%${search}%` } },
        { '$Vehicle.model$': { [Op.like]: `%${search}%` } },
        { '$Vehicle.plate_number$': { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Booking.findAndCountAll({
      where: condition,
      limit,
      offset,
      include: [
        { model: Vehicle, attributes: ['brand', 'model', 'plate_number', 'price'] },
        { model: User, attributes: ['name'] },
        { model: Office, attributes: ['name'] },
        { model: SalesAgent, as: 'salesAgent', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(getPagingData({ count, rows }, page, limit));
  } catch (err) {
    console.error('Get All Bookings Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.confirmSale = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { sales_agent_id, sold_date, customer_name, customer_phone } = req.body;

    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    let booking = await Booking.findOne({
      where: { vehicle_id: vehicleId, status: 'Active' }
    });
    
    if (booking) {
      // Jika ada booking aktif, update menjadi Sold
      await booking.update({ 
        status: 'Sold',
        sales_agent_id: sales_agent_id || booking.sales_agent_id 
      }, { userId: req.user.id });
    } else {
      // Jika jual langsung (tanpa booking), buat record baru di tabel booking sebagai catatan transaksi
      booking = await Booking.create({
        vehicle_id: vehicleId,
        customer_name: customer_name || 'Direct Customer',
        customer_phone: customer_phone || '-',
        booking_date: sold_date || new Date().toISOString().split('T')[0],
        down_payment: 0,
        status: 'Sold',
        sales_agent_id: sales_agent_id || null,
        user_id: req.user.id,
        office_id: vehicle.office_id
      }, { userId: req.user.id });
    }

    await vehicle.update({ 
      status: 'Sold',
      sold_date: sold_date || new Date().toISOString().split('T')[0],
      sales_agent_id: sales_agent_id || (booking ? booking.sales_agent_id : null) || null
    }, { userId: req.user.id });

    res.json(booking);
  } catch (err) {
    console.error('Confirm Sale Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getVehicleBookingHistory = async (req, res) => {
  try {
    const history = await Booking.findAll({
      where: { vehicle_id: req.params.vehicleId },
      include: [
        { model: User, attributes: ['name'] },
        { model: Office, attributes: ['name'] },
        { model: SalesAgent, as: 'salesAgent', attributes: ['name', 'sales_code'] },
        { model: SalesAgent, as: 'bookedByAgent', attributes: ['name', 'sales_code'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    // Hanya booking Active yang bisa diedit (atau sesuai business logic)
    if (booking.status !== 'Active') {
      return res.status(400).json({ message: 'Only active bookings can be edited' });
    }

    // Application-level mandatory validation for NIK
    if (!req.body.nik) return res.status(400).json({ message: 'NIK (National ID Number) is mandatory' });

    await booking.update({
      customer_name: req.body.customer_name,
      customer_phone: req.body.customer_phone,
      nik: req.body.nik,
      id_number: req.body.id_number,
      booking_date: req.body.booking_date,
      expiry_date: req.body.expiry_date,
      down_payment: req.body.down_payment,
      notes: req.body.notes,
      sales_agent_id: req.body.sales_agent_id || null,
      booked_by_agent_id: req.body.sales_agent_id || null // Update also booked_by if it's still being edited
    }, { userId: req.user.id });

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id, { include: [Vehicle] });
    
    if (!booking) return res.status(404).json({ message: 'Transaction not found' });

    // 1. Create Archive (Recycle Bin)
    await BookingArchive.create({
      original_booking_id: booking.id,
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      vehicle_id: booking.vehicle_id,
      status: booking.status,
      down_payment: booking.down_payment,
      booking_date: booking.booking_date,
      deleted_by_user_id: req.user.id,
      raw_data: booking.toJSON()
    });

    // 2. If it was an Active booking, make the vehicle available again
    if (booking.status === 'Active' && booking.Vehicle) {
      await booking.Vehicle.update({ status: 'Available' });
    }

    // 3. Delete from main table
    await booking.destroy();

    res.json({ message: 'Transaction moved to trash successfully' });
  } catch (err) {
    console.error('Delete Booking Error:', err);
    res.status(500).json({ message: err.message });
  }
};
