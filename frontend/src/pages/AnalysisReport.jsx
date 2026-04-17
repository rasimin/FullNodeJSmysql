import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie, LabelList, Legend
} from 'recharts';
import {
  TrendingUp, Package, DollarSign, ShoppingCart, 
  ArrowUpRight, BarChart2, PieChart as PieIcon,
  Activity, Calendar, Filter, Download, Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatOfficeHierarchy } from '../utils/hierarchy';
import { useAuth } from '../context/AuthContext';

const AnalysisReport = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOffice, setSelectedOffice] = useState('');
  const [offices, setOffices] = useState([]);

  // Robust check for Head Office / Super Admin permissions
  const isHeadOffice = 
    user?.role === 'Super Admin' || 
    !user?.office_id || 
    user?.parent_office_id === null || 
    user?.Office?.parent_id === null;

  const fetchOffices = async () => {
    if (isHeadOffice) {
      try {
        const res = await api.get('/offices');
        setOffices(formatOfficeHierarchy(res.data));
      } catch (err) {
        console.error('Failed to fetch offices', err);
      }
    }
  };

  useEffect(() => {
    fetchOffices();
  }, []);
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/business-analysis', { 
        params: { officeId: selectedOffice } 
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch analysis report', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedOffice]);

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(val);

  const formatShort = (val) => {
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(1).replace('.0', '')}m`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
    return val;
  };

  if (loading && !data) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Business Analysis Report</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Live Inventory & Performance Metrics</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            {isHeadOffice && (
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5">
                <Filter size={14} className="text-gray-400" />
                <select
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 outline-none cursor-pointer text-gray-900 dark:text-white"
                  value={selectedOffice}
                  onChange={(e) => setSelectedOffice(e.target.value)}
                >
                  <option value="" className="text-gray-900 dark:bg-gray-800 dark:text-white">All Branches</option>
                  {offices.map((office) => (
                    <option 
                      key={office.id} 
                      value={office.id} 
                      className="text-gray-900 dark:bg-gray-800 dark:text-white"
                    >
                      {office.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button onClick={fetchData} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                <Activity size={14} className="text-blue-500" /> Refresh Data
            </button>
        </div>
      </div>

      {/* Top Cards: Current Live Stock & Potential */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Live Stock Count" 
          value={data?.currentStock?.totalUnits} 
          subValue="Units Currently Available" 
          icon={Package} 
          color="blue" 
        />
        <MetricCard 
          title="Potential Cash Inflow" 
          value={formatCurrency(data?.currentStock?.potentialRevenue)} 
          subValue="Total Asking Price of Stock" 
          icon={DollarSign} 
          color="green" 
        />
        <MetricCard 
          title="Potential Net Margin" 
          value={formatCurrency(data?.currentStock?.potentialNetMargin)} 
          subValue="Expected Profit from Stock" 
          icon={TrendingUp} 
          color="amber" 
        />
        <MetricCard 
          title="Avg. Potential Margin" 
          value={formatCurrency(data?.currentStock?.totalUnits > 0 ? data?.currentStock?.potentialNetMargin / data?.currentStock?.totalUnits : 0)} 
          subValue="Per Unit Profit Estimate" 
          icon={Activity} 
          color="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Distribution Chart */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <PieIcon size={16} className="text-blue-500" /> Current Units Per Brand (Top 10)
            </h3>
          </div>
          <div className="flex justify-center w-full overflow-hidden">
            {data?.currentStock?.unitsPerBrand?.length > 0 ? (
              <BarChart 
                width={500} 
                height={320} 
                data={data.currentStock.unitsPerBrand} 
                layout="vertical" 
                margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.1} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="brand" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  width={90}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                  <LabelList dataKey="count" position="right" fill="#94a3b8" fontSize={10} fontWeight="bold" offset={10} />
                </Bar>
              </BarChart>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-xs text-gray-400 font-bold uppercase">No data available</div>
            )}
          </div>
        </div>

        {/* Monthly Margin Trend */}
        <div className="card p-6">
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-500" /> Monthly Margin Trend (6 Months)
          </h3>
          <div className="flex justify-center w-full overflow-hidden">
            {data?.trends?.sales?.length > 0 ? (
              <AreaChart width={500} height={320} data={data.trends.sales}>
                <defs>
                  <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                <Area type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMargin)" isAnimationActive={false}>
                  <LabelList dataKey="margin" position="top" formatter={formatShort} fill="#10b981" fontSize={10} fontWeight="bold" offset={10} />
                </Area>
              </AreaChart>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-xs text-gray-400 font-bold uppercase">No data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Cash Flow Comparison Chart - Full Width Highlight */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <BarChart2 size={16} className="text-purple-500" /> Cash Flow Performance (6 Months)
            </h3>
          </div>
          <div className="flex justify-center w-full overflow-hidden">
            {data?.trends?.cashFlow?.length > 0 ? (
              <BarChart 
                width={1000} 
                height={350} 
                data={data.trends.cashFlow} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Bar name="Cash In (Sales)" dataKey="inflow" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false}>
                  <LabelList dataKey="inflow" position="top" formatter={formatShort} fill="#10b981" fontSize={9} fontWeight="bold" />
                </Bar>
                <Bar name="Cash Out (Buy+Service)" dataKey="outflow" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false}>
                  <LabelList dataKey="outflow" position="top" formatter={formatShort} fill="#ef4444" fontSize={9} fontWeight="bold" />
                </Bar>
              </BarChart>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-xs text-gray-400 font-bold uppercase">No data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Units Sold Trend */}
        <div className="card p-6">
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <ShoppingCart size={16} className="text-indigo-500" /> Units Sold (6 Months)
          </h3>
          <div className="flex justify-center w-full overflow-hidden">
            {data?.trends?.sales?.length > 0 ? (
              <LineChart width={500} height={300} data={data.trends.sales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <Line type="monotone" dataKey="units" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} isAnimationActive={false}>
                  <LabelList dataKey="units" position="top" fill="#6366f1" fontSize={10} fontWeight="bold" offset={10} />
                </Line>
              </LineChart>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-xs text-gray-400 font-bold uppercase">No data available</div>
            )}
          </div>
        </div>

        {/* Units Purchased Trend */}
        <div className="card p-6">
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <Package size={16} className="text-amber-500" /> Units Purchased (6 Months)
          </h3>
          <div className="flex justify-center w-full overflow-hidden">
            {data?.trends?.purchases?.length > 0 ? (
              <LineChart width={500} height={300} data={data.trends.purchases}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <Line type="monotone" dataKey="units" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} isAnimationActive={false}>
                  <LabelList dataKey="units" position="top" fill="#f59e0b" fontSize={10} fontWeight="bold" offset={10} />
                </Line>
              </LineChart>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-xs text-gray-400 font-bold uppercase">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Summary Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative Sales Summary */}
        <div className="card overflow-hidden">
            <div className="h-1 bg-green-500" />
            <div className="p-6">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Briefcase size={16} className="text-green-500" /> Cumulative Sales Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Total Units Sold</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{data?.overall?.sales?.units}</p>
                        <p className="text-[9px] font-bold text-gray-400">UNITS CLOSED</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Total Revenue</p>
                        <p className="text-lg xl:text-xl font-black text-blue-600">{formatCurrency(data?.overall?.sales?.revenue)}</p>
                        <p className="text-[9px] font-bold text-gray-400">GROSS SALES</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Total Margin</p>
                        <p className="text-lg xl:text-xl font-black text-green-600">{formatCurrency(data?.overall?.sales?.margin)}</p>
                        <p className="text-[9px] font-bold text-gray-400">NET PROFIT</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Cumulative Purchase Summary */}
        <div className="card overflow-hidden">
            <div className="h-1 bg-blue-500" />
            <div className="p-6">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ShoppingCart size={16} className="text-blue-500" /> Cumulative Purchase Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Total Units Bought</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{data?.overall?.purchases?.units}</p>
                        <p className="text-[9px] font-bold text-gray-400">INVENTORY IN</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Purchase Cost</p>
                        <p className="text-lg xl:text-xl font-black text-red-600">{formatCurrency(data?.overall?.purchases?.cost)}</p>
                        <p className="text-[9px] font-bold text-gray-400">CAPITAL OUT</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Total Service Cost</p>
                        <p className="text-lg xl:text-xl font-black text-orange-600">{formatCurrency(data?.overall?.purchases?.service)}</p>
                        <p className="text-[9px] font-bold text-gray-400">PREP COSTS</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subValue, icon: Icon, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        <ArrowUpRight size={16} className="text-gray-300" />
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-xl font-black text-gray-900 dark:text-white truncate">{value}</h4>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-2">{subValue}</p>
    </motion.div>
  );
};

export default AnalysisReport;
