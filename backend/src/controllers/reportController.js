const { Vehicle, Booking, Office, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
  try {
    const { officeId } = req.query;
    const user = req.user;
    
    // Default filter by office hierarchy
    const isSuperAdmin = user.Role?.name === 'Super Admin';
    let officeIds = [];
    const currentOffice = await Office.findByPk(user.office_id);
    
    if (isSuperAdmin) {
       if (officeId) {
         officeIds = [officeId];
       } else {
         const allOffices = await Office.findAll({ attributes: ['id'] });
         officeIds = allOffices.map(o => o.id);
       }
    } else if (currentOffice && !currentOffice.parent_id) { // Head Office
       if (officeId) {
         officeIds = [officeId];
       } else {
         const mappingOffices = await Office.findAll({
           where: { [Op.or]: [{ id: user.office_id }, { parent_id: user.office_id }] },
           attributes: ['id']
         });
         officeIds = mappingOffices.map(o => o.id);
       }
    } else {
       officeIds = [user.office_id];
    }

    const where = { office_id: { [Op.in]: officeIds } };

    // 1. Core Summary Stats
    const totalInventory = await Vehicle.count({ where });
    const totalAvailable = await Vehicle.count({ where: { ...where, status: 'Available' } });
    const totalSold = await Vehicle.count({ where: { ...where, status: 'Sold' } });
    const totalPending = await Vehicle.count({ where: { ...where, status: 'Pending' } });
    
    const totalRevenue = await Vehicle.sum('price', { where: { ...where, status: 'Sold' } }) || 0;
    const potentialRevenue = await Vehicle.sum('price', { where: { ...where, status: 'Available' } }) || 0;

    // 2. Incoming Goods Chart (by month - last 6 months)
    const incomingData = await Vehicle.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('entry_date'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('entry_date'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('entry_date'), '%Y-%m'), 'ASC']],
      limit: 6
    });

    // 3. Sales Chart (by month - last 6 months)
    const salesDataRaw = await Vehicle.findAll({
      where: { ...where, status: 'Sold', sold_date: { [Op.ne]: null } },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('sold_date'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('price')), 'revenue']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('sold_date'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('sold_date'), '%Y-%m'), 'ASC']],
      limit: 6
    });

    const salesData = salesDataRaw.map(s => ({
      month: s.get('month'),
      count: Number(s.get('count')),
      revenue: Number(s.get('revenue'))
    }));

    // 4. Type Distribution (Mobil vs Motor)
    const typeDistributionRaw = await Vehicle.findAll({
      where,
      attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['type']
    });

    // 5. Branch Comparison (Per Branch Analytics)
    const branchComparisonRaw = await Office.findAll({
      where: isSuperAdmin ? {} : { [Op.or]: [{ id: user.office_id }, { parent_id: user.office_id }] },
      attributes: ['id', 'name', 'type'],
      include: [{
        model: Vehicle,
        as: 'vehicles',
        attributes: ['id', 'status', 'price']
      }]
    });

    const branchComparison = branchComparisonRaw.map(office => {
      const vehicles = office.vehicles || [];
      return {
        id: office.id,
        name: office.name,
        type: office.type,
        totalVehicles: vehicles.length,
        soldVehicles: vehicles.filter(v => v.status === 'Sold').length,
        availableVehicles: vehicles.filter(v => v.status === 'Available').length,
        revenue: vehicles.filter(v => v.status === 'Sold').reduce((acc, v) => acc + Number(v.price), 0),
        activeStatus: vehicles.length > 0 ? 'Active' : 'Idle'
      };
    }).sort((a, b) => b.totalVehicles - a.totalVehicles); // Sort by quantity

    res.json({
      summary: {
        totalInventory,
        totalAvailable,
        totalSold,
        totalPending,
        totalRevenue: Number(totalRevenue),
        potentialRevenue: Number(potentialRevenue)
      },
      charts: {
        incoming: incomingData,
        sales: salesData,
        distribution: typeDistributionRaw.map(t => ({ type: t.type, count: Number(t.get('count')) })),
        branchComparison
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
