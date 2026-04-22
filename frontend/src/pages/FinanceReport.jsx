import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie, LabelList, Legend, ComposedChart
} from 'recharts';
import {
  TrendingUp, Package, DollarSign, ShoppingCart, 
  ArrowUpRight, BarChart2, PieChart as PieIcon,
  Activity, Calendar, Filter, Download, Briefcase, Wallet, Eye, EyeOff, XCircle, FileText,
  Smartphone, Monitor, Clock, LogOut, Shield, Building2, User, Mail, Lock
} from 'lucide-react';
import PdfViewerModal from '../components/PdfViewerModal';
import { motion } from 'framer-motion';
import { formatOfficeHierarchy } from '../utils/hierarchy';
import { API_URL, IMAGE_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import DynamicIsland from '../components/DynamicIsland';

const FinanceReport = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOffice, setSelectedOffice] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isChangingYear, setIsChangingYear] = useState(false);
  const [showFullAmount, setShowFullAmount] = useState(false);
  const [offices, setOffices] = useState([]);
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  
  // PDF Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfDocuments, setPdfDocuments] = useState([]);

  const notify = (status, message, delay = 2000) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

  const handleGenerateDetailedReport = async () => {
    notify('loading', 'Menghasilkan Laporan Keuangan Detail...');
    try {
      const res = await api.get('/export/financial-report', {
        params: { year: selectedYear, officeId: selectedOffice },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const filename = `Financial_Report_${selectedYear}_${selectedOffice || 'All'}.pdf`;
      
      setPdfDocuments([{
        title: `Detail Keuangan - ${selectedYear === 'all' ? 'Semua Waktu' : selectedYear}`,
        url,
        filename
      }]);
      setIsPdfModalOpen(true);
      notify('success', 'Laporan berhasil dibuat!');
    } catch (err) {
      console.error('Failed to generate PDF report', err);
      notify('error', 'Gagal menghasilkan laporan PDF');
    }
  };

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
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Laporan Keuangan</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Analisis Profitabilitas & Performa Agen</p>
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
                    <option key={office.id} value={office.id} className="text-gray-900 dark:bg-gray-800 dark:text-white">{office.displayName}</option>
                  ))}
                </select>
              </div>
            )}
            <button 
              onClick={handleGenerateDetailedReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25"
            >
                <FileText size={14} /> Ekspor PDF
            </button>
            <button onClick={fetchData} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                <Activity size={14} className="text-blue-500" /> Refresh
            </button>
        </div>
      </div>

      {/* Ringkasan Performa Keuangan */}
      <div className="card p-6 border border-gray-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/20 shadow-inner">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <BarChart2 size={18} className="text-blue-500" /> Ringkasan Performa Keuangan
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Data akumulasi berdasarkan tahun fiskal</p>
          </div>
          
          {!isChangingYear ? (
            <button 
              onClick={() => setIsChangingYear(true)}
              className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl px-4 py-2 self-end shadow-sm hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-all group"
            >
              <Calendar size={14} className="text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                {selectedYear === 'all' ? 'Semua Catatan' : `Tahun Fiskal ${selectedYear}`}
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
                <option value="all" className="dark:bg-gray-800">Semua Catatan</option>
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y} className="dark:bg-gray-800">Tahun Fiskal {y}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cumulative Sales Summary */}
          <div className="bg-gradient-to-br from-green-50/50 to-white border border-green-100 dark:from-green-900/10 dark:to-gray-800 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="h-1.5 bg-green-500" />
              <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="p-1.5 bg-green-100 dark:bg-green-900/40 rounded-lg"><Briefcase size={14} className="text-green-600" /></div> Ringkasan Penjualan
                    </h3>
                    <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[8px] font-black rounded uppercase">Aliran Pendapatan</span>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-1 border-r border-gray-100 dark:border-gray-700/50">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Total Unit</p>
                          <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{data?.overall?.sales?.units}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Transaksi Selesai</p>
                      </div>
                      <div className="space-y-1 border-r border-gray-100 dark:border-gray-700/50">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Pendapatan Kotor</p>
                          <p className="text-lg font-black text-blue-600 leading-none">{displayAmount(data?.overall?.sales?.revenue)}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Nilai Total</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Margin Bersih</p>
                          <p className="text-lg font-black text-green-600 leading-none">{displayAmount(data?.overall?.sales?.margin)}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Total Profit</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Cumulative Purchase Summary */}
          <div className="bg-gradient-to-br from-blue-50/50 to-white border border-blue-100 dark:from-blue-900/10 dark:to-gray-800 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="h-1.5 bg-blue-500" />
              <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg"><ShoppingCart size={14} className="text-blue-600" /></div> Ringkasan Pembelian
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[8px] font-black rounded uppercase">Alokasi Modal</span>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-1 border-r border-gray-100 dark:border-gray-700/50">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Stok Masuk</p>
                          <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{data?.overall?.purchases?.units}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Unit Baru</p>
                      </div>
                      <div className="space-y-1 border-r border-gray-100 dark:border-gray-700/50">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Akuisisi</p>
                          <p className="text-lg font-black text-red-600 leading-none">{displayAmount(data?.overall?.purchases?.cost)}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Modal Keluar</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Servis/Persiapan</p>
                          <p className="text-lg font-black text-orange-600 leading-none">{displayAmount(data?.overall?.purchases?.service)}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Total Biaya</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Cancellation Income Card */}
          <div className="bg-gradient-to-br from-orange-50/50 to-white border border-orange-100 dark:from-orange-900/10 dark:to-gray-800 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="h-1.5 bg-orange-500" />
              <div className="p-6 flex-1">
                  <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <div className="p-1.5 bg-orange-100 dark:bg-orange-900/40 rounded-lg"><XCircle size={14} className="text-orange-600" /></div> Pendapatan Pembatalan
                  </h3>
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-orange-100/50 dark:border-orange-900/20">
                      <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase mb-1">DP Tidak Kembali</p>
                          <p className="text-3xl font-black text-orange-600 leading-none">{displayAmount(data?.currentStock?.cancelledDPIncome)}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-relaxed">
                            Pendapatan Aman <br/>
                            <span className="text-[8px] text-gray-400">Dari Pemesanan Batal</span>
                          </p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Cash Flow Balance Card with Opening Balance */}
          <div className="bg-gradient-to-br from-purple-50/50 to-white border border-purple-100 dark:from-purple-900/10 dark:to-gray-800 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="h-1.5 bg-purple-500" />
              <div className="p-6 flex-1">
                  <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg"><Wallet size={14} className="text-purple-600" /></div> Saldo Arus Kas
                  </h3>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 pb-2 border-b border-gray-100 dark:border-gray-700/50">
                          <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase">Saldo Awal</p>
                              <p className={`text-xs font-black ${data?.overall?.openingBalance >= 0 ? 'text-gray-900 dark:text-gray-200' : 'text-red-500'}`}>
                                  {displayAmount(data?.overall?.openingBalance || 0)}
                              </p>
                          </div>
                          <div className="text-right border-l border-gray-100 dark:border-gray-700/50 pl-4">
                              <p className="text-[9px] font-black text-gray-400 uppercase">Arus Saat Ini</p>
                              <p className={`text-xs font-black ${
                                  (data?.overall?.sales?.revenue - (data?.overall?.purchases?.cost + data?.overall?.purchases?.service)) >= 0 
                                  ? 'text-green-600' : 'text-red-600'
                              }`}>
                                  {displayAmount(data?.overall?.sales?.revenue - (data?.overall?.purchases?.cost + data?.overall?.purchases?.service))}
                              </p>
                          </div>
                      </div>

                      <div className="flex justify-between items-center">
                          <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Posisi Kas Akhir</p>
                              <p className={`text-3xl font-black leading-none ${
                                  ((data?.overall?.openingBalance || 0) + (data?.overall?.sales?.revenue - (data?.overall?.purchases?.cost + data?.overall?.purchases?.service))) >= 0 
                                  ? 'text-green-600' : 'text-red-600'
                              }`}>
                                  {displayAmount((data?.overall?.openingBalance || 0) + (data?.overall?.sales?.revenue - (data?.overall?.purchases?.cost + data?.overall?.purchases?.service)))}
                              </p>
                          </div>
                          <div className="text-right">
                              <div className="inline-block px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded text-[8px] font-black text-purple-600 dark:text-purple-400 uppercase">
                                {selectedYear === 'all' ? 'STATUS SELAMANYA' : `STATUS ${selectedYear}`}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </div>

      {/* Papan Peringkat Agen Sales */}
      <div className="card p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" /> Papan Peringkat Agen Sales
          </h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase">Performa Terbaik ({selectedYear === 'all' ? 'Semua Waktu' : selectedYear})</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Peringkat</th>
                <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Agen</th>
                <th className="pb-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit Terjual</th>
                <th className="pb-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Nilai Jual</th>
                <th className="pb-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Performa</th>
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
                            <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{agent.salesAgent?.name || 'Agen Tidak Diketahui'}</p>
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
                  <td colSpan="5" className="py-10 text-center text-xs text-gray-400 font-bold uppercase">Tidak ada data penjualan untuk periode ini</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PdfViewerModal 
        isOpen={isPdfModalOpen} 
        onClose={() => setIsPdfModalOpen(false)} 
        documents={pdfDocuments} 
      />
    </div>
  );
};

export default FinanceReport;
