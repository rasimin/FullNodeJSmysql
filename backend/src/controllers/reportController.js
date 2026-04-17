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

    // Calculate Net Margins
    const soldVehiclesRaw = await Vehicle.findAll({
      where: { ...where, status: 'Sold' },
      attributes: ['price', 'purchase_price', 'service_cost']
    });
    const totalNetMargin = soldVehiclesRaw.reduce((sum, v) => {
      return sum + (Number(v.price) - (Number(v.purchase_price) + Number(v.service_cost)));
    }, 0);

    const availableVehiclesRaw = await Vehicle.findAll({
      where: { ...where, status: 'Available' },
      attributes: ['price', 'purchase_price', 'service_cost']
    });
    const potentialNetMargin = availableVehiclesRaw.reduce((sum, v) => {
      return sum + (Number(v.price) - (Number(v.purchase_price) + Number(v.service_cost)));
    }, 0);

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
      attributes: ['id', 'name', 'sales_code'],
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
      sales_code: agent.sales_code,
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
        potentialRevenue: Number(potentialRevenue),
        totalNetMargin: Number(totalNetMargin),
        potentialNetMargin: Number(potentialNetMargin)
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
        sales_code: agent.sales_code,
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

exports.getAdvancedAnalytics = async (req, res) => {
  try {
    const { officeId } = req.query;
    const user = req.user;
    
    // Permission & Office Scope (Same logic as dashboard)
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

    const baseWhere = { office_id: { [Op.in]: officeIds } };

    // 1. Inventory Aging (For Available Units)
    const availableVehicles = await Vehicle.findAll({
      where: { ...baseWhere, status: 'Available' },
      attributes: ['id', 'brand', 'model', 'entry_date', 'price']
    });

    const now = new Date();
    const agingData = {
      '0-30 Days': 0,
      '31-60 Days': 0,
      '61-90 Days': 0,
      'Over 90 Days': 0
    };

    const slowMoving = availableVehicles.map(v => {
      const entryDate = new Date(v.entry_date);
      const diffTime = Math.abs(now - entryDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 30) agingData['0-30 Days']++;
      else if (diffDays <= 60) agingData['31-60 Days']++;
      else if (diffDays <= 90) agingData['61-90 Days']++;
      else agingData['Over 90 Days']++;

      return {
        id: v.id,
        name: `${v.brand} ${v.model}`,
        days: diffDays,
        price: v.price,
        entry_date: v.entry_date
      };
    }).sort((a, b) => b.days - a.days).slice(0, 10); // Top 10 oldest

    // 2. Profit Analysis (For Sold Units)
    const soldVehicles = await Vehicle.findAll({
      where: { ...baseWhere, status: 'Sold' },
      attributes: ['brand', 'price', 'purchase_price', 'service_cost', 'office_id'],
      include: [{ model: Office, attributes: ['name'] }]
    });

    // Profit by Brand
    const profitByBrand = {};
    const profitByOffice = {};
    let totalGrossProfit = 0;

    soldVehicles.forEach(v => {
      const margin = Number(v.price) - (Number(v.purchase_price) + Number(v.service_cost));
      totalGrossProfit += margin;

      // Group by Brand
      if (!profitByBrand[v.brand]) profitByBrand[v.brand] = { revenue: 0, margin: 0, count: 0 };
      profitByBrand[v.brand].revenue += Number(v.price);
      profitByBrand[v.brand].margin += margin;
      profitByBrand[v.brand].count++;

      // Group by Office
      const officeName = v.Office?.name || 'Unknown';
      if (!profitByOffice[officeName]) profitByOffice[officeName] = { revenue: 0, margin: 0, count: 0 };
      profitByOffice[officeName].revenue += Number(v.price);
      profitByOffice[officeName].margin += margin;
      profitByOffice[officeName].count++;
    });

    res.json({
      inventoryAging: {
        summary: agingData,
        slowMoving
      },
      profitability: {
        totalGrossProfit,
        byBrand: Object.keys(profitByBrand).map(key => ({ brand: key, ...profitByBrand[key] })),
        byOffice: Object.keys(profitByOffice).map(key => ({ office: key, ...profitByOffice[key] }))
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAnalysisReport = async (req, res) => {
  try {
    const { officeId } = req.query;
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

    const baseWhere = { office_id: { [Op.in]: officeIds } };

    // 1. Current Live Stock Analytics (Available & Booked)
    const liveStockWhere = { ...baseWhere, status: { [Op.in]: ['Available', 'Booked'] } };
    const liveStockUnits = await Vehicle.findAll({
      where: liveStockWhere,
      attributes: ['brand', 'price', 'purchase_price', 'service_cost']
    });

    const liveStockCount = liveStockUnits.length;
    let potentialCashIn = 0;
    let potentialNetMargin = 0;
    const brandDistribution = {};

    liveStockUnits.forEach(v => {
      potentialCashIn += Number(v.price);
      potentialNetMargin += (Number(v.price) - (Number(v.purchase_price) + Number(v.service_cost)));
      
      brandDistribution[v.brand] = (brandDistribution[v.brand] || 0) + 1;
    });

    const brandChartData = Object.keys(brandDistribution).map(brand => ({
      brand,
      count: brandDistribution[brand]
    })).sort((a, b) => b.count - a.count);

    // 2. All-Time Historical Performance (Sold Units)
    const soldWhere = { ...baseWhere, status: 'Sold' };
    const allTimeSold = await Vehicle.findAll({
      where: soldWhere,
      attributes: ['price', 'purchase_price', 'service_cost']
    });

    const totalUnitsSoldAllTime = allTimeSold.length;
    const totalRevenueAllTime = allTimeSold.reduce((sum, v) => sum + Number(v.price), 0);
    const totalMarginAllTime = allTimeSold.reduce((sum, v) => sum + (Number(v.price) - (Number(v.purchase_price) + Number(v.service_cost))), 0);

    // 3. Comparison Logic (This Month vs Last 3 Months)
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfThreeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    // This Month Stats
    const thisMonthSold = await Vehicle.findAll({
      where: { 
        ...soldWhere, 
        sold_date: { [Op.gte]: startOfThisMonth } 
      },
      attributes: ['price', 'purchase_price', 'service_cost']
    });

    const thisMonthUnits = thisMonthSold.length;
    const thisMonthMargin = thisMonthSold.reduce((sum, v) => sum + (Number(v.price) - (Number(v.purchase_price) + Number(v.service_cost))), 0);

    // Last 3 Months Stats (Average)
    const lastThreeMonthsSold = await Vehicle.findAll({
      where: { 
        ...soldWhere, 
        sold_date: { 
          [Op.gte]: startOfThreeMonthsAgo,
          [Op.lt]: startOfThisMonth
        } 
      },
      attributes: ['price', 'purchase_price', 'service_cost']
    });

    const totalLast3MonthsUnits = lastThreeMonthsSold.length;
    const totalLast3MonthsMargin = lastThreeMonthsSold.reduce((sum, v) => sum + (Number(v.price) - (Number(v.purchase_price) + Number(v.service_cost))), 0);
    
    const avgLast3MonthsUnits = totalLast3MonthsUnits / 3;
    const avgLast3MonthsMargin = totalLast3MonthsMargin / 3;

    res.json({
      liveStock: {
        total: liveStockCount,
        potentialCashIn,
        potentialNetMargin,
        brandDistribution: brandChartData
      },
      historical: {
        totalUnits: totalUnitsSoldAllTime,
        totalRevenue: totalRevenueAllTime,
        totalMargin: totalMarginAllTime
      },
      comparison: {
        thisMonth: {
          units: thisMonthUnits,
          margin: thisMonthMargin
        },
        avgLast3Months: {
          units: avgLast3MonthsUnits,
          margin: avgLast3MonthsMargin
        }
      }
    });

  } catch (error) {
    console.error('getAnalysisReport Error:', error);
    res.status(500).json({ message: error.message });
  }
};

