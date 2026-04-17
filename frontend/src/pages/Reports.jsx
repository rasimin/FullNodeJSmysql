import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart,
  Calendar, Filter, FileText, Download, ChevronRight, BarChart2, 
  PieChart as PieIcon, Users, Clock, Activity, Target, ShieldCheck,
  AlertCircle, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatOfficeHierarchy } from '../utils/hierarchy';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, aging, profit
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offices, setOffices] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState('');

  const { user } = JSON.parse(localStorage.getItem('user_data') || '{}');
  const isHeadOffice = !user?.office_id || user?.Office?.parent_id === null;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        api.get('/reports/dashboard', { params: { officeId: selectedOffice } }),
        api.get('/reports/analytics', { params: { officeId: selectedOffice } })
      ]);
      
      const statsData = statsRes.data;
      if (statsData.charts.sales.length === 0) {
        statsData.charts.sales = [{ month: 'No Data', count: 0, revenue: 0 }];
      }
      setStats(statsData);
      setAnalytics(analyticsRes.data);
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
    fetchData();
    fetchOffices();
  }, [selectedOffice]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const AGING_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  if (loading && !stats) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'aging', label: 'Inventory Aging', icon: Clock },
    { id: 'profit', label: 'Profit Analysis', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Tabs */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div className="w-full">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Advanced Analytics</h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Strategic Insights & Performance Data</p>
            </div>
            {isHeadOffice && (
              <select
                className="input h-10 text-[10px] font-black uppercase w-48 border-gray-200 dark:border-gray-800"
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
              >
                <option value="">All Branches</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.displayName}</option>)}
              </select>
            )}
          </div>

          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-2xl w-fit">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard 
                title="Total Revenue" 
                value={formatCurrency(stats?.summary?.totalRevenue)} 
                extraValue={`Net: ${formatCurrency(stats?.summary?.totalNetMargin)}`}
                subValue="+12% VS LAST MONTH" 
                icon={DollarSign} 
                color="blue" 
              />
              <StatCard title="Units Sold" value={stats?.summary?.totalSold} subValue="TOTAL CLOSED DEALS" icon={ShoppingCart} color="green" />
              <StatCard title="Current Stock" value={stats?.summary?.totalAvailable} subValue="READY TO SELL" icon={Package} color="amber" />
              <StatCard 
                title="Potential Value" 
                value={formatCurrency(stats?.summary?.potentialRevenue)} 
                extraValue={`Net: ${formatCurrency(stats?.summary?.potentialNetMargin)}`}
                subValue="UNSOLD INVENTORY" 
                icon={TrendingUp} 
                color="purple" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={16} className="text-blue-500" /> Sales Trend (Last 6 Months)</h3>
                <div className="flex justify-center w-full overflow-hidden">
                    <AreaChart width={500} height={300} data={stats?.charts?.sales}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `Rp${(v/1000000).toFixed(0)}jt`} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }} itemStyle={{ color: '#f8fafc' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" isAnimationActive={false} />
                    </AreaChart>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><BarChart2 size={16} className="text-green-500" /> Units Movement</h3>
                <div className="flex justify-center w-full overflow-hidden">
                    <BarChart width={500} height={300} data={stats?.charts?.sales}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }} itemStyle={{ color: '#f8fafc' }} />
                      <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} isAnimationActive={false} />
                    </BarChart>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card p-6">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><PieIcon size={16} className="text-amber-500" /> Category Distribution</h3>
                <div className="h-[250px] flex justify-center items-center relative">
                    <PieChart width={250} height={250}>
                      <Pie data={stats?.charts?.distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="count" isAnimationActive={false}>
                        {stats?.charts?.distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black">{stats?.summary?.totalInventory}</span>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Total Stock</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {stats?.charts?.distribution.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-[10px] font-black uppercase text-gray-500">{entry.type}</span></div>
                  ))}
                </div>
              </div>

              <div className="card lg:col-span-2 p-6">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Users size={16} className="text-purple-500" /> Sales Agent Leaderboard</h3>
                <div className="space-y-4">
                  {stats?.charts?.agentPerformance?.slice(0, 5).map((agent, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-white dark:bg-gray-800 text-gray-400'}`}>#{i+1}</div>
                      <div className="flex-1 min-w-0"><p className="text-[11px] font-black uppercase text-gray-900 dark:text-white truncate">{agent.name}</p><p className="text-[9px] font-bold text-gray-400">{agent.sales_code}</p></div>
                      <div className="text-right"><p className="text-[11px] font-black text-blue-600">{agent.soldCount} Units</p><p className="text-[9px] font-bold text-green-600">{formatCurrency(agent.totalRevenue)}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'aging' && (
          <motion.div 
            key="aging"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card p-6">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Clock size={16} className="text-red-500" /> Stock Duration Summary</h3>
                <div className="flex justify-center w-full mt-4">
                    <BarChart width={300} height={300} data={Object.entries(analytics?.inventoryAging?.summary || {}).map(([label, count]) => ({ label, count }))} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="label" type="category" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} width={80} />
                      <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: '16px', border: 'none' }} itemStyle={{ color: '#f8fafc' }} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24} isAnimationActive={false}>
                        {Object.keys(analytics?.inventoryAging?.summary || {}).map((_, i) => <Cell key={i} fill={AGING_COLORS[i % AGING_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                </div>
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 flex gap-3">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-[11px] font-bold text-red-700 dark:text-red-400 leading-relaxed uppercase tracking-tight">Units in "Over 90 Days" category require immediate management attention to avoid capital stagnation.</p>
                </div>
              </div>

              <div className="card lg:col-span-2 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><Target size={16} className="text-blue-500" /> Slow Moving Units (Top 10)</h3>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[9px] font-black text-gray-500 uppercase">Ordered by Days</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Vehicle Name</th>
                        <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Entry Date</th>
                        <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Stock Age</th>
                        <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {analytics?.inventoryAging?.slowMoving.map((v, i) => (
                        <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-4 font-black text-[11px] uppercase text-gray-900 dark:text-white">{v.name}</td>
                          <td className="py-4 text-[10px] font-bold text-gray-500">{new Date(v.entry_date).toLocaleDateString('id-ID')}</td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${v.days > 90 ? 'bg-red-100 text-red-600' : v.days > 60 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{v.days} Days</span>
                            </div>
                          </td>
                          <td className="py-4 text-right font-black text-[11px] text-blue-600">{formatCurrency(v.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'profit' && (
          <motion.div 
            key="profit"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="card p-6 lg:col-span-1 flex flex-col justify-center items-center text-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none">
                <div className="p-4 bg-white/20 rounded-3xl mb-4"><DollarSign size={32} /></div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Gross Profit</p>
                <h2 className="text-3xl font-black mt-1">{formatCurrency(analytics?.profitability?.totalGrossProfit)}</h2>
                <div className="mt-6 flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-400/30">
                  <ArrowUpRight size={14} className="text-green-400" />
                  <span className="text-[10px] font-bold">Health: Excellent</span>
                </div>
              </div>

              <div className="lg:col-span-3 card p-6">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Target size={16} className="text-green-500" /> Profitability by Brand</h3>
                <div className="flex justify-center w-full mt-4">
                    <BarChart width={700} height={300} data={analytics?.profitability?.byBrand}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                      <XAxis dataKey="brand" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `Rp${(v/1000000).toFixed(0)}jt`} />
                      <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: '16px', border: 'none' }} itemStyle={{ color: '#f8fafc' }} />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                      <Bar name="Revenue" dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} isAnimationActive={false} />
                      <Bar name="Net Margin" dataKey="margin" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} isAnimationActive={false} />
                    </BarChart>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><ShieldCheck size={16} className="text-indigo-500" /> Branch Contribution (Margin)</h3>
                <div className="h-[300px] flex justify-center items-center w-full">
                    <PieChart width={300} height={300}>
                      <Pie 
                        data={analytics?.profitability?.byOffice} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={70} 
                        outerRadius={90} 
                        paddingAngle={5} 
                        dataKey="margin" 
                        nameKey="office"
                        isAnimationActive={false}
                      >
                        {analytics?.profitability?.byOffice.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: '16px', border: 'none' }} itemStyle={{ color: '#f8fafc' }} />
                    </PieChart>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {analytics?.profitability?.byOffice.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-[10px] font-black uppercase text-gray-500">{entry.office}</span></div>
                  ))}
                </div>
              </div>

              <div className="card p-6 flex flex-col justify-center">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-8 text-center">Profitability Efficiency</h3>
                <div className="grid grid-cols-2 gap-8">
                  {analytics?.profitability?.byBrand.slice(0, 4).map((b, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end"><p className="text-[10px] font-black uppercase text-gray-500">{b.brand}</p><p className="text-xs font-black text-blue-600">{((b.margin/b.revenue)*100).toFixed(1)}%</p></div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(b.margin/b.revenue)*100}%` }} className="h-full bg-blue-600" />
                      </div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Avg Margin: {formatCurrency(b.margin/b.count)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ title, value, extraValue, subValue, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-3 md:p-5">
      <div className="flex justify-between items-start mb-2 md:mb-4">
        <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${colorClasses[color]}`}><Icon size={18} className="md:size-6" /></div>
        <button className="text-gray-400 hover:text-gray-600 hidden md:block"><ChevronRight size={18} /></button>
      </div>
      <div>
        <p className="text-[10px] md:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest font-black">{title}</p>
        <h4 className="text-sm md:text-xl font-bold text-gray-900 dark:text-white mt-0.5 md:mt-1 truncate">{value}</h4>
        {extraValue && <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter mt-0.5">{extraValue}</p>}
        <p className="text-[8px] md:text-[10px] font-black text-green-500 mt-1.5 md:mt-2 flex items-center gap-1 uppercase tracking-tighter"><TrendingUp size={10} /> {subValue}</p>
      </div>
    </motion.div>
  );
};

export default Reports;
