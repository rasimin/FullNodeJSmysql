import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import api from '../services/api';
import { 
  Users, ShieldCheck, Building2, Activity, UserCircle, 
  LogIn, LogOut, PlusCircle, Edit3, Trash2, Globe, FileText, TrendingUp
} from 'lucide-react';
import { IMAGE_BASE_URL } from '../config';

const safeDate = (str) => {
  if (!str) return 'N/A';
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  
  // Format lebih cantik: 12 Apr, 14:30
  return d.toLocaleString('id-ID', { 
    day: '2-digit', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const getActionStyles = (action) => {
  const act = action.toLowerCase();
  if (act.includes('login')) return { icon: LogIn, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40' };
  if (act.includes('logout')) return { icon: LogOut, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/40' };
  if (act.includes('create') || act.includes('add')) return { icon: PlusCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/40' };
  if (act.includes('update') || act.includes('edit')) return { icon: Edit3, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' };
  if (act.includes('delete') || act.includes('remove')) return { icon: Trash2, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40' };
  return { icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/40' };
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, totalRoles: 0, totalOffices: 0, recentActivities: [] });
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    api.get('/reports/business-analysis', { 
      params: { officeId: '', year: new Date().getFullYear().toString() } 
    })
      .then(r => {
        if (r.data && r.data.salesLeaderboard) {
          setLeaderboard(r.data.salesLeaderboard);
        }
      })
      .catch(console.error)
      .finally(() => setLeaderboardLoading(false));
  }, []);

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

  const userRole = user?.role || user?.Role?.name;
  const userOffice = user?.office || user?.Office?.name;



  const statCards = [
    { title: 'Total Pengguna',   value: stats.totalUsers,   icon: Users,       iconClass: 'icon-box icon-blue'   },
    { title: 'Total Peran',   value: stats.totalRoles,   icon: ShieldCheck, iconClass: 'icon-box icon-purple' },
    { title: 'Total Kantor', value: stats.totalOffices, icon: Building2,   iconClass: 'icon-box icon-orange' },
  ];

  return (
    <div className="space-y-5">

      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Selamat datang kembali, {user?.name}! 👋
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Peran: <span className="font-semibold text-blue-600 dark:text-blue-400">{userRole || '—'}</span>
            </p>
            <div className="h-3 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-500" />
              {user?.Office?.name || 'Panel Utama'}
              {user?.Office?.Parent?.name && (
                <span className="text-xs text-gray-400">
                   (Branch of <span className="font-medium text-gray-700 dark:text-gray-300">{user.Office.Parent.name}</span>)
                </span>
              )}
            </p>
          </div>
        </div>

      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.2 }}
            className={`card p-3 md:p-5 flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 text-center md:text-left ${i === 2 && 'col-span-2 md:col-span-1'}`}
          >
            <div className={`${s.iconClass} w-10 h-10 md:w-12 md:h-12`}>
              <s.icon size={18} className="md:size-[22px]" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{s.title}</p>
              {loading
                ? <div className="mt-1 h-5 md:h-7 w-12 md:w-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mx-auto md:mx-0" />
                : <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{s.value}</p>
              }
            </div>
          </motion.div>
        ))}
      </div>


      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.2 }}
        className="card overflow-hidden"
      >
        {/* Card Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 bg-gray-50 dark:bg-gray-900">
          <Activity size={16} className="text-blue-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Aktivitas Terbaru</span>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="p-10 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-2" />
            <p className="text-xs text-gray-400">Mengambil aktivitas...</p>
          </div>
        ) : stats.recentActivities.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-400">Belum ada log aktivitas terbaru.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {stats.recentActivities.map((log, i) => {
              const { icon: ActionIcon, color, bg } = getActionStyles(log.action);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.15 }}
                  className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  {/* Action Icon */}
                  <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                    <ActionIcon size={16} className={color} />
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {log.User?.name || 'Unknown User'}
                      </span>
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        {log.action}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <Activity size={10} /> {safeDate(log.created_at)}
                      </span>
                      {log.ip_address && (
                        <span className="flex items-center gap-1 font-mono">
                          <Globe size={10} /> {log.ip_address}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profile Indicator */}
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                    <UserCircle size={12} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Log Sistem</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Papan Peringkat Agen Sales */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.2 }}
        className="card p-6 overflow-hidden"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" /> Papan Peringkat Agen Sales
          </h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase">Performa Terbaik ({new Date().getFullYear()})</span>
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
              {leaderboardLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="py-4">
                      <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : leaderboard.length > 0 ? (
                leaderboard.map((agent, index) => {
                  const maxSales = Math.max(...leaderboard.map(a => Number(a.sales_total || 0)));
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
                        <p className="text-xs font-black text-gray-900 dark:text-white">{formatShort(agent.sales_total)}</p>
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
      </motion.div>
    </div>
  );
};

export default Dashboard;
