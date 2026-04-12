import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, 
  Calendar, Filter, FileText, Download, ChevronRight, BarChart2, PieChart as PieIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

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
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
    setLoading(false);
  };

  const fetchOffices = async () => {
    if (isHeadOffice) {
      try {
        const res = await api.get('/offices');
        setOffices(res.data);
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
              {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
          <button className="btn-white text-xs gap-2">
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.charts?.sales}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume Bar Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 size={18} className="text-green-500" /> Units Movement
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.charts?.sales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Type Distribution */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <PieIcon size={18} className="text-amber-500" /> Inventory Type
          </h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.charts?.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="type"
                >
                  {stats?.charts?.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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

        {/* Top Branches (Demo list) */}
        <div className="card lg:col-span-2 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">Branch Performance Overview</h3>
          <div className="space-y-4">
            {offices.slice(0, 5).map((office, idx) => (
              <div key={office.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-xs font-bold border border-gray-100 dark:border-gray-700">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{office.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{office.Parent?.name || 'Main'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">Active</p>
                  <p className="text-[10px] text-gray-400 font-medium">Monthly Active</p>
                </div>
              </div>
            ))}
          </div>
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
      className="card p-5"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <ChevronRight size={18} />
        </button>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</h4>
        <p className="text-[10px] font-bold text-green-500 mt-2 flex items-center gap-1">
          <TrendingUp size={10} /> {subValue}
        </p>
      </div>
    </motion.div>
  );
};

export default Reports;
