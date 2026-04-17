import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart,
  Calendar, Filter, FileText, Download, ChevronRight, BarChart2, PieChart as PieIcon, Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatOfficeHierarchy } from '../utils/hierarchy';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offices, setOffices] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState('');

  const { user } = JSON.parse(localStorage.getItem('user_data') || '{}');
  const isHeadOffice = !user?.office_id || user?.Office?.parent_id === null;

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard', {
        params: { officeId: selectedOffice }
      });
      // Ensure we have at least an empty array for charts
      const data = res.data;
      if (data.charts.sales.length === 0) {
        // Fallback for empty sales data to show a clean axis
        data.charts.sales = [{ month: 'No Data', count: 0, revenue: 0 }];
      }
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
    setLoading(false);
  };

  const fetchOffices = async () => {
    if (isHeadOffice) {
      try {
        const res = await api.get('/offices');
        setOffices(formatOfficeHierarchy(res.data));
      } catch (err) { console.error(err); }
    }
  };

  useEffect(() => {
    fetchStats();
    fetchOffices();
  }, [selectedOffice]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  if (loading && !stats) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Overview of sales performance and inventory flow</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {isHeadOffice && (
            <select
              className="input h-10 text-sm"
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
            >
              <option value="">All Branches</option>
              {offices.map(o => <option key={o.id} value={o.id}>{o.displayName}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.summary?.totalRevenue)}
          subValue="+12% from last month"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Units Sold"
          value={stats?.summary?.totalSold}
          subValue="Active Sales"
          icon={ShoppingCart}
          color="green"
        />
        <StatCard
          title="Current Stock"
          value={stats?.summary?.totalAvailable}
          subValue="Available Units"
          icon={Package}
          color="amber"
        />
        <StatCard
          title="Potential Value"
          value={formatCurrency(stats?.summary?.potentialRevenue)}
          subValue="Unsold Inventory"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Incoming Line Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" /> Sales vs Incoming Trend
            </h3>
          </div>
          <div className="flex justify-center h-[300px] w-full mt-4">
            <AreaChart width={550} height={300} data={stats?.charts?.sales}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </div>
        </div>

        {/* Volume Bar Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 size={18} className="text-green-500" /> Units Movement
            </h3>
          </div>
          <div className="flex justify-center h-[300px] w-full mt-4">
            <BarChart width={550} height={300} data={stats?.charts?.sales}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar
                dataKey="count"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Type Distribution */}
        <div className="card p-6 h-full flex flex-col justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <PieIcon size={18} className="text-amber-500" /> Inventory Type
          </h3>
          <div className="flex justify-center items-center h-[250px] w-full relative">
            <PieChart width={250} height={250}>
              <Pie
                data={stats?.charts?.distribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="type"
                isAnimationActive={false}
              >
                {stats?.charts?.distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-2xl font-bold">{stats?.summary?.totalInventory}</span>
              <span className="text-[10px] text-gray-500 uppercase font-bold">Total Units</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {stats?.charts?.distribution.map((entry, index) => (
              <div key={entry.type} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{entry.type} ({entry.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Performance Comparison Chart */}
        <div className="card lg:col-span-2 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BarChart2 size={18} className="text-blue-500" /> Branch Revenue & Inventory Overview
          </h3>
          <div className="flex justify-center h-[300px] w-full overflow-hidden">
            <BarChart
              width={700}
              height={300}
              data={stats?.charts?.branchComparison}
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}Jt`} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              <Bar yAxisId="left" name="Vehicles (Stock)" dataKey="totalVehicles" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
              <Bar yAxisId="right" name="Revenue (Sold)" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
            </BarChart>
          </div>
        </div>
      </div>

      {/* Dynamic Branch Performance Overview */}
      <div className="card p-3 md:p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 md:mb-6 text-sm md:text-base">Branch Performance Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
          {stats?.charts?.branchComparison?.map((office, idx) => (
            <div key={office.id} className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex flex-col justify-between gap-3 group hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-7 h-7 md:w-10 md:h-10 shrink-0 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-[10px] md:text-sm font-bold border border-gray-100 dark:border-gray-700">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-sm font-bold truncate">{office.name}</p>
                  <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest truncate">{office.type.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                <div>
                  <p className="text-[8px] text-gray-400 uppercase font-bold">In-Stock</p>
                  <p className="text-[11px] md:text-sm font-bold text-gray-900 dark:text-white">{office.availableVehicles}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-gray-400 uppercase font-bold">Revenue</p>
                  <p className="text-[11px] md:text-sm font-bold text-green-600 truncate">{formatCurrency(office.revenue)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold ${office.activeStatus === 'Active' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                  {office.activeStatus}
                </span>
                <div className="w-4 h-1 bg-gray-200 dark:bg-gray-800 rounded-full group-hover:bg-blue-500 transition-colors md:hidden" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Agent performance leaderboard */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Users size={18} className="text-purple-500" /> Sales Agent Performance Leaderboard
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {stats?.charts?.agentPerformance?.map((agent, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center text-[10px] md:text-xs font-bold">
                  #{idx + 1}
                </div>
                <span className="font-bold text-gray-900 dark:text-white uppercase text-[9px] md:text-xs tracking-wider truncate">{agent.name} {agent.sales_code ? `(${agent.sales_code})` : ''}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Units Sold</p>
                    <p className="text-sm md:text-lg font-bold text-blue-600">{agent.soldCount} U</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Revenue</p>
                    <p className="text-[10px] md:text-sm font-bold text-green-600">{formatCurrency(agent.totalRevenue)}</p>
                  </div>
                </div>
                {/* Progress bar (Visual dummy relative to top agent) */}
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(agent.soldCount / (stats.charts.agentPerformance[0]?.soldCount || 1)) * 100}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
              </div>
            </div>
          ))}
          {(!stats?.charts?.agentPerformance || stats.charts.agentPerformance.length === 0) && (
            <div className="col-span-full py-8 text-center text-gray-400 text-sm italic">
              No sales data found for agents in this selection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subValue, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-3 md:p-5"
    >
      <div className="flex justify-between items-start mb-2 md:mb-4">
        <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${colorClasses[color]}`}>
          <Icon size={18} className="md:size-6" />
        </div>
        <button className="text-gray-400 hover:text-gray-600 hidden md:block">
          <ChevronRight size={18} />
        </button>
      </div>
      <div>
        <p className="text-[10px] md:text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h4 className="text-sm md:text-xl font-bold text-gray-900 dark:text-white mt-0.5 md:mt-1 truncate">{value}</h4>
        <p className="text-[8px] md:text-[10px] font-bold text-green-500 mt-1.5 md:mt-2 flex items-center gap-1">
          <TrendingUp size={10} /> <span className="truncate">{subValue}</span>
        </p>
      </div>
    </motion.div>
  );
};

export default Reports;
