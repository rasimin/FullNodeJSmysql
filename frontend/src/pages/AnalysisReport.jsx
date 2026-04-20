import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie, LabelList, Legend, ComposedChart
} from 'recharts';
import {
  TrendingUp, Package, DollarSign, ShoppingCart, 
  ArrowUpRight, BarChart2, PieChart as PieIcon,
  Activity, Calendar, Filter, Download, Briefcase, Wallet, Eye, EyeOff, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatOfficeHierarchy } from '../utils/hierarchy';
import { API_URL, IMAGE_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import DynamicIsland from '../components/DynamicIsland';

const AnalysisReport = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOffice, setSelectedOffice] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isChangingYear, setIsChangingYear] = useState(false);
  const [showFullAmount, setShowFullAmount] = useState(false);
  const [offices, setOffices] = useState([]);
  const [notification, setNotification] = useState({ status: 'idle', message: '' });

  const notify = (status, message, delay = 2000) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

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
      if (res.data && res.data.currentStock) {
        setData(res.data);
      } else {
        console.error('Invalid report data received', res.data);
        notify('error', 'Gagal memuat data laporan');
      }
    } catch (err) {
      console.error('Failed to fetch analysis report', err);
      notify('error', 'Kesalahan server saat memuat laporan');
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
    if (val === null || val === undefined || isNaN(Number(val))) return formatCurrency(0);
    const num = Number(val);
    const absVal = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (absVal >= 1000000000000) return `${sign}Rp ${(absVal / 1000000000000).toFixed(2)}T`;
    if (absVal >= 1000000000) return `${sign}Rp ${(absVal / 1000000000).toFixed(1).replace('.0', '')}M`;
    if (absVal >= 1000000) return `${sign}Rp ${(absVal / 1000000).toFixed(1).replace('.0', '')}jt`;
    return formatCurrency(num);
  };

  const displayAmount = (val) => {
    const num = Number(val);
    if (isNaN(num)) return formatCurrency(0);
    return showFullAmount ? formatCurrency(num) : formatShort(num);
  };

  if (loading && !data) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <DynamicIsland status={notification.status} message={notification.message} />
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

          {/* Cancellation Income Card */}
          <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 dark:from-orange-900/10 dark:to-gray-800 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="h-1 bg-orange-500" />
              <div className="p-6">
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <XCircle size={16} className="text-orange-500" /> Cancellation Revenue
                  </h3>
                  <div className="flex items-end justify-between">
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Non-Refundable DP</p>
                          <p className="text-2xl font-black text-orange-600">{displayAmount(data?.currentStock?.cancelledDPIncome)}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-[9px] font-bold text-gray-400 uppercase leading-tight">Income from<br/>Cancelled Bookings</p>
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
              <ComposedChart 
                width={1000} 
                height={350} 
                data={data.trends.cashFlow} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Bar name="Cash In (Sales)" dataKey="inflow" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false}>
                  <LabelList dataKey="inflow" position="top" formatter={formatShort} fill="#10b981" fontSize={9} fontWeight="bold" />
                </Bar>
                <Bar name="Cash Out (Buy+Service)" dataKey="outflow" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false}>
                  <LabelList dataKey="outflow" position="top" formatter={formatShort} fill="#ef4444" fontSize={9} fontWeight="bold" />
                </Bar>
                {/* Subtle Trend Lines */}
                <Line type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={2} dot={false} strokeOpacity={0.4} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} dot={false} strokeOpacity={0.4} strokeDasharray="5 5" />
              </ComposedChart>
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
              <ComposedChart 
                width={1000} 
                height={350} 
                data={data.trends.units} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Bar name="Units Sold" dataKey="sold" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false}>
                  <LabelList dataKey="sold" position="top" fill="#3b82f6" fontSize={10} fontWeight="bold" />
                </Bar>
                <Bar name="Units Purchased" dataKey="bought" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false}>
                  <LabelList dataKey="bought" position="top" fill="#f59e0b" fontSize={10} fontWeight="bold" />
                </Bar>
                {/* Subtle Trend Lines */}
                <Line type="monotone" dataKey="sold" stroke="#3b82f6" strokeWidth={2} dot={false} strokeOpacity={0.4} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="bought" stroke="#f59e0b" strokeWidth={2} dot={false} strokeOpacity={0.4} strokeDasharray="5 5" />
              </ComposedChart>
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




      <div className="grid grid-cols-1 gap-6 mt-6">
        {/* Sales Agent Leaderboard */}
        <div className="card p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" /> Sales Agent Leaderboard
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Top Performers ({selectedYear === 'all' ? 'All-Time' : selectedYear})</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Rank</th>
                  <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Agent</th>
                  <th className="pb-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Units Sold</th>
                  <th className="pb-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Sales Value</th>
                  <th className="pb-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {data?.salesLeaderboard?.length > 0 ? (
                  data.salesLeaderboard.map((agent, index) => {
                    const maxSales = Math.max(...data.salesLeaderboard.map(a => Number(a.sales_total || 0)));
                    const percentage = (Number(agent.sales_total || 0) / Math.max(1, maxSales)) * 100;
                    
                    return (
                      <tr key={agent.sales_agent_id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all">
                        <td className="py-4">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                            index === 0 ? 'bg-amber-100 text-amber-600' : 
                            index === 1 ? 'bg-slate-100 text-slate-500' :
                            index === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-50 text-gray-400 dark:bg-gray-800'
                          }`}>
                            #{index + 1}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden border border-blue-200 dark:border-blue-800">
                              {agent.salesAgent?.avatar_url ? (
                                <img 
                                  src={agent.salesAgent.avatar_url.startsWith('http') 
                                    ? agent.salesAgent.avatar_url 
                                    : `${IMAGE_BASE_URL}${agent.salesAgent.avatar_url.startsWith('/') ? '' : '/'}${agent.salesAgent.avatar_url}`
                                  } 
                                  alt={agent.salesAgent?.name} 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(agent.salesAgent?.name || 'SA');
                                  }}
                                />
                              ) : (
                                <span className="text-[10px] font-black text-blue-600">
                                  {agent.salesAgent?.name?.substring(0, 2).toUpperCase() || 'SA'}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{agent.salesAgent?.name || 'Unknown Agent'}</p>
                              <p className="text-[9px] font-bold text-gray-400">ID: {agent.sales_agent_id || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black">
                            {agent.units_sold} UNITS
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <p className="text-xs font-black text-gray-900 dark:text-white">{displayAmount(agent.sales_total)}</p>
                        </td>
                        <td className="py-4 text-right min-w-[120px]">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] font-black text-gray-400">{Math.round(percentage)}%</span>
                            <div className="w-24 bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                className={`h-full rounded-full ${
                                  index === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gray-400'
                                }`}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-xs text-gray-400 font-bold uppercase">No sales data available for this period</td>
                  </tr>
                )}
              </tbody>
            </table>
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
