import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart,
  Target, BarChart2, PieChart as PieIcon, ArrowUpRight, ArrowDownRight,
  Activity, Wallet, Briefcase, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const AnalysisReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOffice, setSelectedOffice] = useState('');
  const [offices, setOffices] = useState([]);

  const { user } = JSON.parse(localStorage.getItem('user_data') || '{}');
  const isSuperAdmin = user?.Role?.name === 'Super Admin';
  const isHeadOffice = isSuperAdmin || !user?.office_id || user?.Office?.parent_id === null;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/analysis', { params: { officeId: selectedOffice } });
      setData(res.data);
      
      if (isHeadOffice && offices.length === 0) {
        const offRes = await api.get('/offices');
        setOffices(offRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch analysis data', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedOffice]);

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  const formatCompact = (val) => {
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)} M`;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)} Jt`;
    return formatCurrency(val);
  };

  if (loading && !data) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    </div>
  );

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight italic">Business Intelligence</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Strategic Market & Financial Analysis</p>
        </div>
        {isHeadOffice && (
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-black text-gray-400 uppercase">Scope:</p>
            <select
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500/20"
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
            >
              <option value="">Full Network</option>
              {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Top Row: Current Live Inventory & Potential */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-2xl shadow-blue-500/20"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-white/20 rounded-2xl"><Package size={24} /></div>
            <Zap size={20} className="text-yellow-400 animate-pulse" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Current Live Stock</p>
          <h2 className="text-4xl font-black mt-1">{data?.liveStock?.total} <span className="text-sm font-bold opacity-60">UNITS</span></h2>
          <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-end">
            <div>
              <p className="text-[9px] font-black uppercase opacity-60">Avg Daily Input</p>
              <p className="text-sm font-bold">4.2 Units</p>
            </div>
            <div className="text-right">
              <span className="px-2 py-1 bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-tighter">Live Status</span>
            </div>
          </div>
        </motion.div>

        <StatSummaryCard 
          title="Potential Cash In" 
          value={formatCompact(data?.liveStock?.potentialCashIn)} 
          subTitle="STOCK MARKET VALUE"
          icon={Wallet}
          color="emerald"
          delay={0.2}
        />

        <StatSummaryCard 
          title="Potential Net Margin" 
          value={formatCompact(data?.liveStock?.potentialNetMargin)} 
          subTitle="ESTIMATED PROFIT FROM STOCK"
          icon={TrendingUp}
          color="indigo"
          delay={0.3}
        />
      </div>

      {/* Middle Row: Brand Analysis & Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Brand Distribution */}
        <div className="lg:col-span-8 card p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <BarChart2 size={16} className="text-blue-500" /> Stock by Brand
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Units in Inventory</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.liveStock?.brandDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis dataKey="brand" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40}>
                  {data?.liveStock?.brandDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Comparison */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <GrowthCard 
            title="Units Performance" 
            current={data?.comparison?.thisMonth?.units} 
            avg={data?.comparison?.avgLast3Months?.units} 
            unit="Units"
            icon={ShoppingCart}
          />
          <GrowthCard 
            title="Margin Performance" 
            current={data?.comparison?.thisMonth?.margin} 
            avg={data?.comparison?.avgLast3Months?.margin} 
            isCurrency
            icon={Target}
          />
        </div>
      </div>

      {/* Bottom Row: All-Time Sales Performance */}
      <div className="card p-8 bg-gray-900 border-none overflow-hidden relative">
        {/* Background Decor */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-10 text-center flex items-center justify-center gap-3">
            <Activity size={18} className="text-blue-500" /> All-Time Performance Hub
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Units Sold</p>
              <h4 className="text-4xl font-black text-white">{data?.historical?.totalUnits}</h4>
              <p className="text-[10px] font-black text-green-500 uppercase tracking-tighter flex items-center justify-center gap-1">
                <ArrowUpRight size={12} /> Success Rate 98.4%
              </p>
            </div>
            
            <div className="space-y-2 border-x border-white/5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gross Revenue</p>
              <h4 className="text-4xl font-black text-white">{formatCompact(data?.historical?.totalRevenue)}</h4>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">TOTAL SALES VALUE</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Net Profit Margin</p>
              <h4 className="text-4xl font-black text-indigo-400">{formatCompact(data?.historical?.totalMargin)}</h4>
              <p className="text-[10px] font-black text-green-500 uppercase tracking-tighter flex items-center justify-center gap-1">
                <Target size={12} /> Profit Optimized
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatSummaryCard = ({ title, value, subTitle, icon: Icon, color, delay }) => {
  const colors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-100 dark:border-emerald-900/50 icon-bg-emerald',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 border-indigo-100 dark:border-indigo-900/50 icon-bg-indigo',
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 border-blue-100 dark:border-blue-900/50 icon-bg-blue',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`card p-6 border-l-4 ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} ${colors[color].split(' ')[3]}`}
    >
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <div className={`p-2 rounded-xl ${colors[color].split(' ')[4] || 'bg-gray-100'}`}><Icon size={18} /></div>
      </div>
      <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{value}</h4>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{subTitle}</p>
    </motion.div>
  );
};

const GrowthCard = ({ title, current, avg, unit = '', isCurrency = false, icon: Icon }) => {
  const diff = current - avg;
  const percent = avg > 0 ? (diff / avg) * 100 : 0;
  const isUp = diff >= 0;

  const formatValue = (v) => {
    if (isCurrency) {
      if (v >= 1000000000) return `Rp ${(v / 1000000000).toFixed(1)}M`;
      if (v >= 1000000) return `Rp ${(v / 1000000).toFixed(1)}Jt`;
      return v.toLocaleString('id-ID');
    }
    return v.toFixed(1);
  };

  return (
    <div className="card p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-blue-600"><Icon size={18} /></div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black ${isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(percent).toFixed(1)}%
        </div>
      </div>
      
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-xl font-black text-gray-900 dark:text-white">{formatValue(current)}</h4>
          <span className="text-[10px] font-bold text-gray-400 uppercase">{unit}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
        <p className="text-[9px] font-bold text-gray-400 uppercase">Avg 3 Months</p>
        <p className="text-[10px] font-black text-gray-700 dark:text-gray-300">{formatValue(avg)}</p>
      </div>
    </div>
  );
};

export default AnalysisReport;
