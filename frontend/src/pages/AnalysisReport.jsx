import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie, LabelList, Legend, ComposedChart
} from 'recharts';
import {
  TrendingUp, Package, DollarSign, ShoppingCart, 
  ArrowUpRight, BarChart2, PieChart as PieIcon,
  Activity, Filter, Eye, EyeOff, History, X, Search, ChevronLeft, ChevronRight, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatOfficeHierarchy } from '../utils/hierarchy';
import { API_URL, IMAGE_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import DynamicIsland from '../components/DynamicIsland';
import Pagination from '../components/ui/Pagination';

const AnalysisReport = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOffice, setSelectedOffice] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const [showFullAmount, setShowFullAmount] = useState(false);
  const [offices, setOffices] = useState([]);
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  
  // Aging Modal States
  const [isAgingModalOpen, setIsAgingModalOpen] = useState(false);
  const [agingSearch, setAgingSearch] = useState('');
  const [agingCategory, setAgingCategory] = useState('all');
  const [chartWidth, setChartWidth] = useState(1000);
  const [agingPage, setAgingPage] = useState(1);
  const agingItemsPerPage = 10;

  // Auto-select oldest category when modal opens
  useEffect(() => {
    if (isAgingModalOpen && data?.currentStock?.inventoryAging) {
      const categories = ['Di Atas 90 Hari', '61-90 Hari', '31-60 Hari', '0-30 Hari'];
      const agingData = data.currentStock.inventoryAging;
      
      const autoSelected = categories.find(cat => agingData[cat] > 0);
      
      if (autoSelected) {
        setAgingCategory(autoSelected);
      } else {
        setAgingCategory('all');
      }
      setAgingPage(1);
      setAgingSearch('');
    }
  }, [isAgingModalOpen, data?.currentStock?.inventoryAging]);

  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('volume-chart-container');
      if (container) {
        const padding = window.innerWidth < 500 ? 16 : 48;
        setChartWidth(container.offsetWidth - padding);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [data]);


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

  // Filter and Paginate Aging Data
  const filteredAgingData = data?.currentStock?.allAvailableUnits?.filter(unit => {
    const matchesSearch = 
      unit.brand?.toLowerCase().includes(agingSearch.toLowerCase()) ||
      unit.model?.toLowerCase().includes(agingSearch.toLowerCase()) ||
      unit.plate_number?.toLowerCase().includes(agingSearch.toLowerCase());
    
    const matchesCategory = agingCategory === 'all' || unit.agingCategory === agingCategory;
    
    return matchesSearch && matchesCategory;
  }) || [];

  const handleExportExcel = () => {
    if (filteredAgingData.length === 0) {
      return notify('error', 'Tidak ada data untuk diekspor');
    }

    const headers = ['Merk/Model', 'Plat Nomor', 'Usia (Hari)', 'Harga Jual', 'Harga Modal', 'Tanggal Masuk', 'Kategori Aging'];
    const rows = filteredAgingData.map(unit => [
      `"${unit.brand} ${unit.model}"`,
      `"${unit.plate_number}"`,
      unit.days,
      unit.price,
      Number(unit.purchase_price) + Number(unit.service_cost),
      `"${new Date(unit.entry_date).toLocaleDateString('id-ID')}"`,
      `"${unit.agingCategory}"`
    ]);

    const csvContent = "\ufeff" + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Data_Aging_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('success', 'Data berhasil diekspor ke format Excel (CSV)');
  };

  const totalAgingPages = Math.ceil(filteredAgingData.length / agingItemsPerPage);
  const paginatedAgingData = filteredAgingData.slice(
    (agingPage - 1) * agingItemsPerPage,
    agingPage * agingItemsPerPage
  );

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
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Dashboard Utama</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Metrik Inventaris & Performa Langsung</p>
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
              {showFullAmount ? 'Jumlah Penuh' : 'Disingkat'}
            </button>

            {isHeadOffice && (
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5">
                <Filter size={14} className="text-gray-400" />
                <select
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 outline-none cursor-pointer text-gray-900 dark:text-white"
                  value={selectedOffice}
                  onChange={(e) => setSelectedOffice(e.target.value)}
                >
                  <option value="" className="text-gray-900 dark:bg-gray-800 dark:text-white">Semua Cabang</option>
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
                <Activity size={14} className="text-blue-500" /> Perbarui Data
            </button>
        </div>
      </div>

      {/* Top Cards: Current Live Stock & Potential */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Ringkasan Stok Aktif" 
          value={
            <div className="flex items-baseline gap-2">
              <span className="text-2xl">{data?.currentStock?.totalUnits || 0}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase">Tersedia</span>
              <div className="w-[1px] h-3 bg-gray-200 dark:bg-gray-700 mx-1" />
              <span className="text-xl text-orange-500">{data?.currentStock?.bookedUnits || 0}</span>
              <span className="text-[10px] text-orange-400 font-bold uppercase">Dipesan</span>
            </div>
          } 
          subValue="Status Inventaris Real-time" 
          icon={Package} 
          color="blue" 
        />
        <MetricCard 
          title="Potensi Arus Kas Masuk" 
          value={displayAmount(data?.currentStock?.potentialRevenue)} 
          subValue="Total Harga Penawaran Stok" 
          icon={DollarSign} 
          color="green" 
        />
        <MetricCard 
          title="Potensi Margin Bersih" 
          value={displayAmount(data?.currentStock?.potentialNetMargin)} 
          subValue="Estimasi Keuntungan dari Stok" 
          icon={TrendingUp} 
          color="amber" 
        />
        <MetricCard 
          title="Rata-rata Potensi Margin" 
          value={displayAmount(data?.currentStock?.totalUnits > 0 ? data?.currentStock?.potentialNetMargin / data?.currentStock?.totalUnits : 0)} 
          subValue="Estimasi Profit Per Unit" 
          icon={Activity} 
          color="purple" 
        />
      </div>





      <div className="grid grid-cols-1 gap-6">
        {/* Unit Performance Chart - Full Width Highlight */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <ShoppingCart size={16} className="text-blue-500" /> Performa Volume Unit (6 Bulan)
            </h3>
          </div>
          <div className="flex flex-col xl:flex-row gap-6 items-stretch">
            <div id="volume-chart-container" className="flex-1 w-full overflow-hidden">
              {data?.trends?.units?.length > 0 ? (
                <ComposedChart 
                  width={chartWidth}
                  height={chartWidth < 500 ? 220 : 350}
                  data={data.trends.units} 
                  margin={chartWidth < 500 ? { top: 10, right: 0, left: -35, bottom: 0 } : { top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#94a3b8" 
                      fontSize={chartWidth < 500 ? 8 : 10} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => chartWidth < 500 ? val.split('-')[1] : val}
                    />
                    <YAxis stroke="#94a3b8" fontSize={chartWidth < 500 ? 8 : 10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend 
                      iconType="circle" 
                      wrapperStyle={{ paddingTop: '20px', fontSize: chartWidth < 500 ? '8px' : '10px', fontWeight: 'bold', textTransform: 'uppercase' }} 
                      payload={[
                        { value: 'Unit Terjual', type: 'circle', color: '#3b82f6' },
                        { value: 'Unit Dibeli', type: 'circle', color: '#f59e0b' }
                      ]}
                    />
                    <Bar name="Unit Terjual" dataKey="sold" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={chartWidth < 500 ? 14 : 40} isAnimationActive={false}>
                      <LabelList dataKey="sold" position="top" fill="#3b82f6" fontSize={chartWidth < 500 ? 8 : 10} fontWeight="bold" />
                    </Bar>
                    <Bar name="Unit Dibeli" dataKey="bought" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={chartWidth < 500 ? 14 : 40} isAnimationActive={false}>
                      <LabelList dataKey="bought" position="top" fill="#f59e0b" fontSize={chartWidth < 500 ? 8 : 10} fontWeight="bold" />
                    </Bar>
                    <Line type="monotone" dataKey="sold" stroke="#3b82f6" strokeWidth={2} dot={false} strokeOpacity={0.4} strokeDasharray="5 5" legendType="none" />
                    <Line type="monotone" dataKey="bought" stroke="#f59e0b" strokeWidth={2} dot={false} strokeOpacity={0.4} strokeDasharray="5 5" legendType="none" />
                  </ComposedChart>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-xs text-gray-400 font-bold uppercase">Data tidak tersedia</div>
              )}
            </div>

            {/* Monthly Summary Sideboxes */}
            <div className="w-full xl:w-72 flex flex-col gap-4 mt-4 xl:mt-0">
               {/* Sold Summary */}
               <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-blue-500/20 transition-all" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Terjual Bulan Ini</p>
                    <div className="flex items-baseline gap-2 mb-4">
                      <h4 className="text-3xl font-black text-gray-900 dark:text-white">
                        {data?.trends?.units?.[data.trends.units.length - 1]?.sold || 0}
                      </h4>
                      <span className="text-xs font-bold text-gray-400 uppercase">Unit</span>
                    </div>
                    <div className="pt-4 border-t border-blue-100 dark:border-blue-500/20">
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Total Nilai Penjualan</p>
                      <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                        {displayAmount(data?.trends?.cashFlow?.[data.trends.cashFlow.length - 1]?.inflow || 0)}
                      </p>
                    </div>
                  </div>
               </div>

               {/* Bought Summary */}
               <div className="bg-orange-50/50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/20 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-orange-500/20 transition-all" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1">Dibeli Bulan Ini</p>
                    <div className="flex items-baseline gap-2 mb-4">
                      <h4 className="text-3xl font-black text-gray-900 dark:text-white">
                        {data?.trends?.units?.[data.trends.units.length - 1]?.bought || 0}
                      </h4>
                      <span className="text-xs font-bold text-gray-400 uppercase">Unit</span>
                    </div>
                    <div className="pt-4 border-t border-orange-100 dark:border-orange-500/20">
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Total Modal (Beli+Servis)</p>
                      <p className="text-sm font-black text-orange-600 dark:text-orange-400">
                        {displayAmount(data?.trends?.cashFlow?.[data.trends.cashFlow.length - 1]?.outflow || 0)}
                      </p>
                    </div>
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
              <BarChart2 size={16} className="text-purple-500" /> Performa Arus Kas (6 Bulan)
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
                 <Legend 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} 
                  payload={[
                    { value: 'Kas Masuk (Penjualan)', type: 'circle', color: '#10b981' },
                    { value: 'Kas Keluar (Beli+Servis)', type: 'circle', color: '#ef4444' }
                  ]}
                />
                <Bar name="Kas Masuk (Penjualan)" dataKey="inflow" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false}>
                  <LabelList dataKey="inflow" position="top" formatter={formatShort} fill="#10b981" fontSize={9} fontWeight="bold" />
                </Bar>
                <Bar name="Kas Keluar (Beli+Servis)" dataKey="outflow" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false}>
                  <LabelList dataKey="outflow" position="top" formatter={formatShort} fill="#ef4444" fontSize={9} fontWeight="bold" />
                </Bar>
                {/* Subtle Trend Lines */}
                <Line type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={2} dot={false} strokeOpacity={0.4} strokeDasharray="5 5" legendType="none" />
                <Line type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} dot={false} strokeOpacity={0.4} strokeDasharray="5 5" legendType="none" />
              </ComposedChart>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-xs text-gray-400 font-bold uppercase">Data tidak tersedia</div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Aging Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card p-6">
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <History size={16} className="text-orange-500" /> Usia Inventaris (Aging)
          </h3>
          <div className="flex flex-col items-center justify-center min-h-[320px] w-full">
            {data?.currentStock?.inventoryAging ? (
              <PieChart width={320} height={320}>
                <Pie
                  data={Object.keys(data.currentStock.inventoryAging).map(key => ({
                    name: key,
                    value: data.currentStock.inventoryAging[key]
                  }))}
                  cx="50%"
                  cy="40%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '12px', 
                    fontSize: '10px', 
                    color: '#fff',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '20px' }} 
                  formatter={(value) => (
                    <span className="text-gray-600 dark:text-gray-300">
                      {value} : <span className="text-blue-600 dark:text-cyan-400 font-black ml-1">{data?.currentStock?.inventoryAging[value] || 0}</span>
                    </span>
                  )}
                />
              </PieChart>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-xs text-gray-400 font-bold uppercase">Data tidak tersedia</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-red-500" /> Unit Slow Moving (Tertua)
            </h3>
            <button 
              onClick={() => setIsAgingModalOpen(true)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-blue-500"
              title="Lihat Semua Detail Aging"
            >
              <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-3 text-[10px] font-black text-gray-400 uppercase">Unit</th>
                  <th className="pb-3 text-[10px] font-black text-gray-400 uppercase text-center">Usia Stok</th>
                  <th className="pb-3 text-[10px] font-black text-gray-400 uppercase text-right">Harga</th>
                  <th className="pb-3 text-[10px] font-black text-gray-400 uppercase text-right">Tgl Masuk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {data?.currentStock?.slowMoving?.map((unit, idx) => (
                  <tr key={idx} className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3">
                      <div className="text-[11px] font-black text-gray-900 dark:text-white uppercase">{unit.brand} {unit.model}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                          {unit.plate_number}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                        unit.days > 90 ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 border dark:border-red-500/30' :
                        unit.days > 60 ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border dark:border-orange-500/30' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border dark:border-blue-500/30'
                      }`}>
                        {unit.days} Hari
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="text-[10px] font-black text-gray-900 dark:text-white uppercase">Jual: {displayAmount(unit.price)}</div>
                      <div className="text-[8px] font-bold text-orange-500 uppercase mt-0.5">Modal: {displayAmount(Number(unit.purchase_price) + Number(unit.service_cost))}</div>
                    </td>
                    <td className="py-3 text-right text-[9px] font-bold text-gray-400">
                      {new Date(unit.entry_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {(!data?.currentStock?.slowMoving || data.currentStock.slowMoving.length === 0) && (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-xs text-gray-400 font-bold uppercase">Tidak ada data unit tersedia</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>




      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Distribution Chart */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <PieIcon size={16} className="text-blue-500" /> Stok Unit Per Merk (10 Besar)
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
              <div className="h-[300px] flex items-center justify-center text-xs text-gray-400 font-bold uppercase">Data tidak tersedia</div>
            )}
          </div>
        </div>

        {/* Monthly Margin Trend */}
        <div className="card p-6">
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-500" /> Tren Margin Bulanan (6 Bulan)
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
              <div className="h-[300px] flex items-center justify-center text-xs text-gray-400 font-bold uppercase">Data tidak tersedia</div>
            )}
          </div>
        </div>
      </div>







      <AnimatePresence>
        {isAgingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100 dark:border-gray-800"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <History className="text-orange-500" /> Detail Usia Inventaris (Aging)
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Daftar lengkap stok unit berdasarkan kategori usia</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-green-500/20 active:scale-95"
                    title="Export ke Excel"
                  >
                    <FileSpreadsheet size={16} /> Export Excel
                  </button>
                  <button 
                    onClick={() => setIsAgingModalOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-red-500"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Modal Filters */}
              <div className="p-6 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 items-center justify-between">
                  <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Cari Brand, Model, atau Plat Nomor..." 
                      value={agingSearch}
                      onChange={(e) => { setAgingSearch(e.target.value); setAgingPage(1); }}
                      className={`w-full pl-10 ${agingSearch ? 'pr-10' : 'pr-4'} py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all`}
                    />
                    {agingSearch && (
                      <button 
                        onClick={() => { setAgingSearch(''); setAgingPage(1); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter:</span>
                  <div className="flex gap-1 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                    {['all', '0-30 Hari', '31-60 Hari', '61-90 Hari', 'Di Atas 90 Hari'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setAgingCategory(cat); setAgingPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                          agingCategory === cat 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                        }`}
                      >
                        {cat === 'all' ? 'Semua' : cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Content - Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-white dark:bg-gray-900">
                      <th className="pl-6 pr-4 py-4 bg-white dark:bg-gray-900 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100 dark:border-gray-800">Unit & Plat Nomor</th>
                      <th className="px-4 py-4 bg-white dark:bg-gray-900 text-[10px] font-black text-gray-400 uppercase text-center border-b border-gray-100 dark:border-gray-800">Usia Stok</th>
                      <th className="px-4 py-4 bg-white dark:bg-gray-900 text-[10px] font-black text-gray-400 uppercase text-right border-b border-gray-100 dark:border-gray-800">Harga Jual</th>
                      <th className="px-4 py-4 bg-white dark:bg-gray-900 text-[10px] font-black text-gray-400 uppercase text-right border-b border-gray-100 dark:border-gray-800">Harga Modal</th>
                      <th className="pl-4 pr-6 py-4 bg-white dark:bg-gray-900 text-[10px] font-black text-gray-400 uppercase text-right border-b border-gray-100 dark:border-gray-800">Tgl Masuk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {paginatedAgingData.map((unit, idx) => (
                      <tr key={idx} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="pl-6 pr-4 py-4 border-b border-gray-50 dark:border-gray-800/50">
                          <div className="text-sm font-black text-gray-900 dark:text-white uppercase">{unit.brand} {unit.model}</div>
                          <span className="text-[10px] font-black bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-gray-700 mt-1 inline-block">
                            {unit.plate_number}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center border-b border-gray-50 dark:border-gray-800/50">
                          <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            unit.days > 90 ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 border dark:border-red-500/30' :
                            unit.days > 60 ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border dark:border-orange-500/30' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border dark:border-blue-500/30'
                          }`}>
                            {unit.days} Hari
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-black text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800/50">
                          {displayAmount(unit.price)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-black text-orange-600 dark:text-orange-400 border-b border-gray-50 dark:border-gray-800/50">
                          {displayAmount(Number(unit.purchase_price) + Number(unit.service_cost))}
                        </td>
                        <td className="pl-4 pr-6 py-4 text-right text-[10px] font-bold text-gray-400 border-b border-gray-50 dark:border-gray-800/50">
                          {new Date(unit.entry_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                    {paginatedAgingData.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-20 text-center text-gray-400 font-bold uppercase text-xs">Tidak ada unit yang sesuai dengan pencarian</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer - Pagination */}
              {totalAgingPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Menampilkan <span className="text-gray-900 dark:text-white">{Math.min(filteredAgingData.length, (agingPage-1) * agingItemsPerPage + 1)}</span> - <span className="text-gray-900 dark:text-white">{Math.min(filteredAgingData.length, agingPage * agingItemsPerPage)}</span> dari <span className="text-gray-900 dark:text-white">{filteredAgingData.length}</span> Unit
                    </p>
                    <div className="scale-90 origin-right">
                      <Pagination 
                        page={agingPage} 
                        totalPages={totalAgingPages} 
                        setPage={setAgingPage} 
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
