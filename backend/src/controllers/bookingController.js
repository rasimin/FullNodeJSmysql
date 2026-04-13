const { Booking, Vehicle, User, Office, SalesAgent } = require('../models');

exports.createBooking = async (req, res) => {
  try {
    const { vehicle_id, customer_name, customer_phone, id_number, booking_date, expiry_date, down_payment, notes } = req.body;
    
    // Pastikan kendaraan ada dan tersedia
    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (vehicle.status !== 'Available') return res.status(400).json({ message: 'Vehicle already booked or sold' });

    // Buat data booking
    const booking = await Booking.create({
      vehicle_id,
      customer_name,
      customer_phone,
      id_number,
      booking_date,
      expiry_date,
      down_payment: down_payment || 0,
      notes,
      sales_agent_id: req.body.sales_agent_id,
      booked_by_agent_id: req.body.sales_agent_id,
      user_id: req.user.id,
      office_id: vehicle.office_id,
      status: 'Active'
    }, { userId: req.user.id });

    // Update status kendaraan menjadi Booked
    await vehicle.update({ status: 'Booked' }, { userId: req.user.id });

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
      await vehicle.update({ status: 'Available' }, { userId: req.user.id });
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
      await vehicle.update({ status: 'Available' }, { userId: req.user.id });
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
    const { officeId } = req.query;
    const where = {};
    if (officeId) where.office_id = officeId;

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: Vehicle, attributes: ['brand', 'model', 'plate_number'] },
        { model: User, attributes: ['name'] },
        { model: Office, attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.confirmSale = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: { vehicle_id: req.params.vehicleId, status: 'Active' }
    });
    
    const vehicle = await Vehicle.findByPk(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    if (booking) {
      await booking.update({ 
        status: 'Sold',
        sales_agent_id: req.body.sales_agent_id || booking.sales_agent_id 
      }, { userId: req.user.id });
    }

    await vehicle.update({ 
      status: 'Sold',
      sold_date: req.body.sold_date || new Date().toISOString().split('T')[0],
      sales_agent_id: req.body.sales_agent_id || (booking ? booking.sales_agent_id : null)
    }, { userId: req.user.id });

    res.json({ message: 'Unit successfully marked as Sold' });
  } catch (err) {
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
        { model: SalesAgent, as: 'salesAgent', attributes: ['name'] },
        { model: SalesAgent, as: 'bookedByAgent', attributes: ['name'] }
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

    await booking.update({
      customer_name: req.body.customer_name,
      customer_phone: req.body.customer_phone,
      id_number: req.body.id_number,
      booking_date: req.body.booking_date,
      expiry_date: req.body.expiry_date,
      down_payment: req.body.down_payment,
      notes: req.body.notes,
      sales_agent_id: req.body.sales_agent_id,
      booked_by_agent_id: req.body.sales_agent_id // Update also booked_by if it's still being edited
    }, { userId: req.user.id });

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
