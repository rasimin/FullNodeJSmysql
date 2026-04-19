import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie, LabelList, Legend
} from 'recharts';
import {
  TrendingUp, Package, DollarSign, ShoppingCart, 
  ArrowUpRight, BarChart2, PieChart as PieIcon,
  Activity, Calendar, Filter, Download, Briefcase, Wallet, Eye, EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatOfficeHierarchy } from '../utils/hierarchy';
import { useAuth } from '../context/AuthContext';

const AnalysisReport = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOffice, setSelectedOffice] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isChangingYear, setIsChangingYear] = useState(false);
  const [showFullAmount, setShowFullAmount] = useState(false);
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
        params: { officeId: selectedOffice, year: selectedYear } 
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch analysis report', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedOffice, selectedYear]);

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(val);

  const formatShort = (val) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 1000000000000) return `${sign}Rp ${(absVal / 1000000000000).toFixed(2)}T`;
    if (absVal >= 1000000000) return `${sign}Rp ${(absVal / 1000000000).toFixed(1).replace('.0', '')}M`;
    if (absVal >= 1000000) return `${sign}Rp ${(absVal / 1000000).toFixed(1).replace('.0', '')}jt`;
    return formatCurrency(val);
  };

  const displayAmount = (val) => showFullAmount ? formatCurrency(val) : formatShort(val);

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
            <button 
              onClick={() => setShowFullAmount(!showFullAmount)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${
                showFullAmount 
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-blue-500 hover:border-blue-500'
              }`}
            >
              {showFullAmount ? <Eye size={14} /> : <EyeOff size={14} />}
              {showFullAmount ? 'Full Amount' : 'Abbreviated'}
            </button>

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
          title="Live Stock Summary" 
          value={
            <div className="flex items-baseline gap-2">
              <span className="text-2xl">{data?.currentStock?.totalUnits || 0}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase">Available</span>
              <div className="w-[1px] h-3 bg-gray-200 dark:bg-gray-700 mx-1" />
              <span className="text-xl text-orange-500">{data?.currentStock?.bookedUnits || 0}</span>
              <span className="text-[10px] text-orange-400 font-bold uppercase">Booked</span>
            </div>
          } 
          subValue="Real-time Inventory Status" 
          icon={Package} 
          color="blue" 
        />
        <MetricCard 
          title="Potential Cash Inflow" 
          value={displayAmount(data?.currentStock?.potentialRevenue)} 
          subValue="Total Asking Price of Stock" 
          icon={DollarSign} 
          color="green" 
        />
        <MetricCard 
          title="Potential Net Margin" 
          value={displayAmount(data?.currentStock?.potentialNetMargin)} 
          subValue="Expected Profit from Stock" 
          icon={TrendingUp} 
          color="amber" 
        />
        <MetricCard 
          title="Avg. Potential Margin" 
          value={displayAmount(data?.currentStock?.totalUnits > 0 ? data?.currentStock?.potentialNetMargin / data?.currentStock?.totalUnits : 0)} 
          subValue="Per Unit Profit Estimate" 
          icon={Activity} 
          color="purple" 
        />
      </div>

      {/* Financial Performance Summary Group */}
      <div className="card p-6 border border-gray-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/20 shadow-inner">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <BarChart2 size={18} className="text-blue-500" /> Financial Performance Summary
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Accumulated data filtered by fiscal year</p>
          </div>
          
          {!isChangingYear ? (
            <button 
              onClick={() => setIsChangingYear(true)}
              className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl px-4 py-2 self-end shadow-sm hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-all group"
            >
              <Calendar size={14} className="text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                {selectedYear === 'all' ? 'All-Time Records' : `${selectedYear} Fiscal Year`}
              </span>
              <ArrowUpRight size={12} className="text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-blue-400 rounded-xl px-3 py-1.5 self-end shadow-lg animate-in fade-in zoom-in duration-200">
              <select
                autoFocus
                className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest focus:ring-0 outline-none cursor-pointer text-gray-900 dark:text-white"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setIsChangingYear(false);
                }}
                onBlur={() => setIsChangingYear(false)}
              >
                <option value="all" className="dark:bg-gray-800">All-Time Records</option>
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y} className="dark:bg-gray-800">{y} Fiscal Year</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Cumulative Sales Summary */}
          <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 dark:from-green-900/10 dark:to-gray-800 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="h-1 bg-green-500" />
              <div className="p-6">
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Briefcase size={16} className="text-green-500" /> Sales Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Total Units</p>
                          <p className="text-xl font-black text-gray-900 dark:text-white">{data?.overall?.sales?.units}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">Closed</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Revenue</p>
                          <p className="text-sm xl:text-base font-black text-blue-600 truncate">{displayAmount(data?.overall?.sales?.revenue)}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">Gross</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Margin</p>
                          <p className="text-sm xl:text-base font-black text-green-600 truncate">{displayAmount(data?.overall?.sales?.margin)}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">Profit</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Cumulative Purchase Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 dark:from-blue-900/10 dark:to-gray-800 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="h-1 bg-blue-500" />
              <div className="p-6">
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <ShoppingCart size={16} className="text-blue-500" /> Purchase Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Total Units</p>
                          <p className="text-xl font-black text-gray-900 dark:text-white">{data?.overall?.purchases?.units}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">Inventory In</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Acquisition</p>
                          <p className="text-sm xl:text-base font-black text-red-600 truncate">{displayAmount(data?.overall?.purchases?.cost)}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">Capital Out</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Service Cost</p>
                          <p className="text-sm xl:text-base font-black text-orange-600 truncate">{displayAmount(data?.overall?.purchases?.service)}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">Prep Costs</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Cash Flow Balance Card with Opening Balance */}
          <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 dark:from-purple-900/10 dark:to-gray-800 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="h-1 bg-purple-500" />
              <div className="p-6">
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Wallet size={16} className="text-purple-500" /> Cash Flow Balance
                  </h3>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                          <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase">Opening Balance</p>
                              <p className={`text-xs font-bold ${data?.overall?.openingBalance >= 0 ? 'text-gray-600 dark:text-gray-300' : 'text-red-500'}`}>
                                  {displayAmount(data?.overall?.openingBalance || 0)}
                              </p>
                          </div>
                          <div className="text-right">
                              <p className="text-[9px] font-black text-gray-400 uppercase">Current Movement</p>
                              <p className={`text-xs font-bold ${
                                  (data?.overall?.sales?.revenue - (data?.overall?.purchases?.cost + data?.overall?.purchases?.service)) >= 0 
                                  ? 'text-green-600' : 'text-red-600'
                              }`}>
                                  {displayAmount(data?.overall?.sales?.revenue - (data?.overall?.purchases?.cost + data?.overall?.purchases?.service))}
                              </p>
                          </div>
                      </div>

                      <div className="flex justify-between items-end">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Closing Cash Balance</p>
                              <p className={`text-2xl font-black ${
                                  ((data?.overall?.openingBalance || 0) + (data?.overall?.sales?.revenue - (data?.overall?.purchases?.cost + data?.overall?.purchases?.service))) >= 0 
                                  ? 'text-green-600' : 'text-red-600'
                              }`}>
                                  {displayAmount((data?.overall?.openingBalance || 0) + (data?.overall?.sales?.revenue - (data?.overall?.purchases?.cost + data?.overall?.purchases?.service)))}
                              </p>
                          </div>

                          <div className="text-right">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                {selectedYear === 'all' ? 'All-Time Account Value' : `End of ${selectedYear} Status`}
                              </p>
                          </div>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                          <div 
                              className="bg-purple-500 h-full" 
                              style={{ 
                                  width: `${Math.min(100, (((data?.overall?.openingBalance || 0) + data?.overall?.sales?.revenue) / Math.max(1, (data?.overall?.purchases?.cost + data?.overall?.purchases?.service))) * 100)}%` 
                              }} 
                          />
                      </div>
                  </div>
              </div>
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

      <div className="grid grid-cols-1 gap-6">
        {/* Unit Performance Chart - Full Width Highlight */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <ShoppingCart size={16} className="text-blue-500" /> Unit Volume Performance (6 Months)
            </h3>
          </div>
          <div className="flex justify-center w-full overflow-hidden">
            {data?.trends?.units?.length > 0 ? (
              <BarChart 
                width={1000} 
                height={350} 
                data={data.trends.units} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Bar name="Units Sold" dataKey="sold" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false}>
                  <LabelList dataKey="sold" position="top" fill="#3b82f6" fontSize={10} fontWeight="bold" />
                </Bar>
                <Bar name="Units Purchased" dataKey="bought" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false}>
                  <LabelList dataKey="bought" position="top" fill="#f59e0b" fontSize={10} fontWeight="bold" />
                </Bar>
              </BarChart>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-xs text-gray-400 font-bold uppercase">No data available</div>
            )}
          </div>
        </div>
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



    </div>
  );
};

const MetricCard = ({ title, value, subValue, icon: Icon, color }) => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/40',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40',
  };

  const bgMap = {
    blue: 'bg-gradient-to-br from-blue-50 to-white border-blue-100/50 dark:from-blue-900/10 dark:to-gray-800 dark:border-gray-700',
    green: 'bg-gradient-to-br from-green-50 to-white border-green-100/50 dark:from-green-900/10 dark:to-gray-800 dark:border-gray-700',
    amber: 'bg-gradient-to-br from-amber-50 to-white border-amber-100/50 dark:from-amber-900/10 dark:to-gray-800 dark:border-gray-700',
    purple: 'bg-gradient-to-br from-purple-50 to-white border-purple-100/50 dark:from-purple-900/10 dark:to-gray-800 dark:border-gray-700',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className={`card p-5 border shadow-sm ${bgMap[color]}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        <ArrowUpRight size={16} className="text-gray-300" />
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-xl font-black text-gray-900 dark:text-white">{value}</h4>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-2">{subValue}</p>
    </motion.div>
  );
};

export default AnalysisReport;
