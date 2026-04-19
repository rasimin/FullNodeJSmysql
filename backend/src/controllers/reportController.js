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

exports.getBusinessAnalysisReport = async (req, res) => {
  try {
    const { officeId, year } = req.query;
    const user = req.user;
    
    // Permission & Office Scope
    const isSuperAdmin = user.Role?.name === 'Super Admin';
    let officeIds = [];
    if (isSuperAdmin) {
      if (officeId) {
        officeIds = [officeId];
      } else {
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

    const where = { office_id: { [Op.in]: officeIds } };

    // --- Added: Opening Balance Logic ---
    let openingBalance = 0;
    let salesWhere = { ...where, status: 'Sold' };
    let purchaseWhere = { ...where };

    if (year && year !== 'all') {
      const startDate = new Date(`${year}-01-01T00:00:00`);
      const endDate = new Date(`${year}-12-31T23:59:59`);
      
      // Calculate Opening Balance (Everything BEFORE this year)
      const prevSales = await Vehicle.findAll({
        where: { ...where, status: 'Sold', sold_date: { [Op.lt]: startDate } },
        attributes: [[sequelize.fn('SUM', sequelize.col('price')), 'total']],
        raw: true
      });
      const prevPurchases = await Vehicle.findAll({
        where: { ...where, entry_date: { [Op.lt]: startDate } },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('purchase_price')), 'cost'],
          [sequelize.fn('SUM', sequelize.col('service_cost')), 'service']
        ],
        raw: true
      });
      
      openingBalance = Number(prevSales[0]?.total || 0) - (Number(prevPurchases[0]?.cost || 0) + Number(prevPurchases[0]?.service || 0));

      // Update where clauses for cumulative metrics to only show this year
      salesWhere.sold_date = { [Op.between]: [startDate, endDate] };
      purchaseWhere.entry_date = { [Op.between]: [startDate, endDate] };
    }

    // 1. Current Live Stock Summary (Always all-time/current)
    const availableVehicles = await Vehicle.findAll({
      where: { ...where, status: 'Available' },
      attributes: ['brand', 'price', 'purchase_price', 'service_cost'],
      raw: true
    });

    const liveStockCount = availableVehicles.length;
    const bookedCount = await Vehicle.count({
      where: { ...where, status: 'Booked' }
    });

    const potentialRevenue = availableVehicles.reduce((sum, v) => sum + Number(v.price || 0), 0);
    const potentialNetMargin = availableVehicles.reduce((sum, v) => {
      const price = Number(v.price || 0);
      const purchase = Number(v.purchase_price || 0);
      const service = Number(v.service_cost || 0);
      return sum + (price - (purchase + service));
    }, 0);

    // 2. Units per Brand (Current Stock)
    const brandDistribution = {};
    availableVehicles.forEach(v => {
      const brandName = v.brand || 'Unknown';
      brandDistribution[brandName] = (brandDistribution[brandName] || 0) + 1;
    });
    const unitsPerBrand = Object.keys(brandDistribution).map(brand => ({
      brand,
      count: brandDistribution[brand]
    })).sort((a, b) => b.count - a.count).slice(0, 10); 

    // 3. Monthly Trends (Always last 6 months based on current date, unless requested otherwise)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); 
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Sales Trend
    const soldTrendRaw = await Vehicle.findAll({
      where: { 
        ...where, 
        status: 'Sold',
        sold_date: { [Op.gte]: sixMonthsAgo } 
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('sold_date'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'units_sold'],
        [sequelize.fn('SUM', sequelize.col('price')), 'revenue'],
        [sequelize.literal('SUM(price - (purchase_price + service_cost))'), 'margin']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('sold_date'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('sold_date'), '%Y-%m'), 'ASC']],
      raw: true
    });

    // Purchase Trend (including service cost)
    const purchaseTrendRaw = await Vehicle.findAll({
      where: { 
        ...where, 
        entry_date: { [Op.gte]: sixMonthsAgo } 
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('entry_date'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'units_purchased'],
        [sequelize.fn('SUM', sequelize.col('purchase_price')), 'purchase_cost'],
        [sequelize.fn('SUM', sequelize.col('service_cost')), 'service_cost']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('entry_date'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('entry_date'), '%Y-%m'), 'ASC']],
      raw: true
    });

    // 4. Cumulative Metrics (Can be filtered by year)
    const cumulativeSales = await Vehicle.findAll({
      where: salesWhere,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_units'],
        [sequelize.fn('SUM', sequelize.col('price')), 'total_revenue'],
        [sequelize.literal('SUM(price - (purchase_price + service_cost))'), 'total_margin']
      ],
      raw: true
    });

    const cumulativePurchases = await Vehicle.findAll({
      where: purchaseWhere,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_units'],
        [sequelize.fn('SUM', sequelize.col('purchase_price')), 'total_purchase_cost'],
        [sequelize.fn('SUM', sequelize.col('service_cost')), 'total_service_cost']
      ],
      raw: true
    });

    // ... (trend merging logic)
    const allMonths = Array.from({length: 6}, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return d.toISOString().substring(0, 7); // YYYY-MM
    });

    const cashFlowTrend = allMonths.map(month => {
        const sale = soldTrendRaw.find(s => s.month === month) || {};
        const purchase = purchaseTrendRaw.find(p => p.month === month) || {};
        return {
            month,
            inflow: Number(sale.revenue || 0),
            outflow: Number(purchase.purchase_cost || 0) + Number(purchase.service_cost || 0)
        };
    });

    const unitTrend = allMonths.map(month => {
        const sale = soldTrendRaw.find(s => s.month === month) || {};
        const purchase = purchaseTrendRaw.find(p => p.month === month) || {};
        return {
            month,
            sold: Number(sale.units_sold || 0),
            bought: Number(purchase.units_purchased || 0)
        };
    });

    // 5. Sales Agent Leaderboard (Based on filtered salesWhere)
    const salesLeaderboard = await Vehicle.findAll({
      where: salesWhere,
      attributes: [
        'sales_agent_id',
        [sequelize.fn('COUNT', sequelize.col('Vehicle.id')), 'units_sold'],
        [sequelize.fn('SUM', sequelize.col('price')), 'sales_total']
      ],
      include: [{
        model: SalesAgent,
        as: 'salesAgent',
        attributes: ['name', 'avatar_url']
      }],
      group: ['sales_agent_id', 'salesAgent.id'],
      order: [[sequelize.literal('units_sold'), 'DESC']],
      limit: 10,
      raw: true,
      nest: true
    });


    res.json({
      currentStock: {
        totalUnits: liveStockCount,
        bookedUnits: bookedCount,
        potentialRevenue,
        potentialNetMargin,
        unitsPerBrand
      },
      trends: {
        sales: soldTrendRaw.map(s => ({
            month: s.month,
            units: Number(s.units_sold || 0),
            revenue: Number(s.revenue || 0),
            margin: Number(s.margin || 0)
        })),
        purchases: purchaseTrendRaw.map(p => ({
            month: p.month,
            units: Number(p.units_purchased || 0),
            cost: Number(p.purchase_cost || 0),
            service: Number(p.service_cost || 0)
        })),
        cashFlow: cashFlowTrend,
        units: unitTrend
      },
      overall: {
        sales: {
          units: Number(cumulativeSales[0]?.total_units || 0),
          revenue: Number(cumulativeSales[0]?.total_revenue || 0),
          margin: Number(cumulativeSales[0]?.total_margin || 0)
        },
        purchases: {
          units: Number(cumulativePurchases[0]?.total_units || 0),
          cost: Number(cumulativePurchases[0]?.total_purchase_cost || 0),
          service: Number(cumulativePurchases[0]?.total_service_cost || 0)
        },
        openingBalance
      },
      salesLeaderboard
    });


  } catch (error) {
    console.error('Analysis Report Error:', error);
    res.status(500).json({ message: error.message });
  }
};



