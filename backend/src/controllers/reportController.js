const { Vehicle, Booking, Office, SalesAgent, sequelize } = require('../models');
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

    // 6. Sales Agent Performance
    const agentPerformanceRaw = await SalesAgent.findAll({
      where: { office_id: { [Op.in]: officeIds } },
      attributes: ['id', 'name'],
      include: [{
        model: Vehicle,
        as: 'soldVehicles',
        where: { status: 'Sold' },
        attributes: ['id', 'price'],
        required: false
      }]
    });

    const agentPerformance = agentPerformanceRaw.map(agent => ({
      name: agent.name,
      soldCount: agent.soldVehicles?.length || 0,
      totalRevenue: agent.soldVehicles?.reduce((acc, v) => acc + Number(v.price), 0) || 0
    })).sort((a, b) => b.soldCount - a.soldCount);

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
        branchComparison,
        agentPerformance
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSalesAgentReport = async (req, res) => {
  try {
    const { officeId, startDate, endDate } = req.query;
    const user = req.user;
    
    // Permission & Office Scope
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
      if (currentOffice && !currentOffice.parent_id) { // Head Office
        const mapping = await Office.findAll({
          where: { [Op.or]: [{ id: user.office_id }, { parent_id: user.office_id }] },
          attributes: ['id']
        });
        officeIds = mapping.map(o => o.id);
      } else {
        officeIds = [user.office_id];
      }
    }

    const whereVehicle = { 
      status: 'Sold',
      office_id: { [Op.in]: officeIds }
    };
    if (startDate && endDate) {
      whereVehicle.sold_date = { [Op.between]: [startDate, endDate] };
    }

    const agents = await SalesAgent.findAll({
      where: { office_id: { [Op.in]: officeIds } },
      include: [{
        model: Vehicle,
        as: 'soldVehicles',
        where: whereVehicle,
        required: false,
        attributes: ['id', 'price', 'purchase_price', 'service_cost', 'sold_date', 'brand', 'model']
      }]
    });

    const report = agents.map(agent => {
      const sold = agent.soldVehicles || [];
      const totalRevenue = sold.reduce((sum, v) => sum + Number(v.price), 0);
      const totalCost = sold.reduce((sum, v) => sum + (Number(v.purchase_price) + Number(v.service_cost)), 0);
      const totalMargin = totalRevenue - totalCost;

      return {
        id: agent.id,
        name: agent.name,
        unitsSold: sold.length,
        totalRevenue,
        totalMargin,
        averageMargin: sold.length > 0 ? totalMargin / sold.length : 0
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAgentSalesDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const whereVehicle = { 
      sales_agent_id: id,
      status: 'Sold'
    };
    if (startDate && endDate) {
      whereVehicle.sold_date = { [Op.between]: [startDate, endDate] };
    }

    const sales = await Vehicle.findAll({
      where: whereVehicle,
      order: [['sold_date', 'DESC']],
      attributes: ['id', 'type', 'brand', 'model', 'year', 'plate_number', 'price', 'purchase_price', 'service_cost', 'sold_date']
    });

    const transformed = sales.map(s => {
      const margin = Number(s.price) - (Number(s.purchase_price) + Number(s.service_cost));
      return {
        ...s.toJSON(),
        margin
      };
    });

    res.json(transformed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
