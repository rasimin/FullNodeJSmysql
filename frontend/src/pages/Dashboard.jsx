import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import api from '../services/api';
import { 
  Users, ShieldCheck, Building2, Activity, UserCircle, 
  LogIn, LogOut, PlusCircle, Edit3, Trash2, Globe 
} from 'lucide-react';

const safeDate = (str) => {
  if (!str) return 'N/A';
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  
  // Format lebih cantik: 12 Apr, 14:30
  return d.toLocaleString('en-GB', { 
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

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const userRole = user?.role || user?.Role?.name;
  const userOffice = user?.office || user?.Office?.name;

  const statCards = [
    { title: 'Total Users',   value: stats.totalUsers,   icon: Users,       iconClass: 'icon-box icon-blue'   },
    { title: 'Total Roles',   value: stats.totalRoles,   icon: ShieldCheck, iconClass: 'icon-box icon-purple' },
    { title: 'Total Offices', value: stats.totalOffices, icon: Building2,   iconClass: 'icon-box icon-orange' },
  ];

  return (
    <div className="space-y-5">

      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="card p-5"
      >
        <h1 className="text-base font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}! 👋
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Role: <span className="font-semibold text-blue-600 dark:text-blue-400">{userRole || '—'}</span>
          </p>
          <div className="h-3 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Building2 size={14} className="text-blue-500" />
            {user?.Office?.name || 'Main Panel'}
            {user?.Office?.Parent?.name && (
              <span className="text-xs text-gray-400">
                 (Branch of <span className="font-medium text-gray-700 dark:text-gray-300">{user.Office.Parent.name}</span>)
              </span>
            )}
          </p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.2 }}
            className="card p-5 flex items-center gap-4"
          >
            <div className={s.iconClass}>
              <s.icon size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{s.title}</p>
              {loading
                ? <div className="mt-1 h-7 w-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                : <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{s.value}</p>
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
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recent Activities</span>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="p-10 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-2" />
            <p className="text-xs text-gray-400">Fetching activities...</p>
          </div>
        ) : stats.recentActivities.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-400">No recent activities log yet.</p>
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
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">System Log</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
