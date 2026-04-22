import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  History, Activity, Calendar, Globe, 
  LogIn, LogOut, PlusCircle, Edit3, Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const safeDate = (str) => {
  if (!str) return 'N/A';
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const getActionStyles = (action) => {
  const act = (action || '').toLowerCase();
  if (act.includes('login')) return { icon: LogIn, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40' };
  if (act.includes('logout')) return { icon: LogOut, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/40' };
  if (act.includes('create') || act.includes('add')) return { icon: PlusCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/40' };
  if (act.includes('update') || act.includes('edit')) return { icon: Edit3, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' };
  if (act.includes('delete') || act.includes('remove')) return { icon: Trash2, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40' };
  return { icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/40' };
};

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/logs/activities?page=${page}`);
      setLogs(response.data.items);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [page]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Catatan Aktivitas</h1>
        <div className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-800">
          Showing {logs.length} activities
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 flex items-center gap-2">
          <History size={16} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recent System Activities</span>
        </div>

        {/* Content */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-gray-400">Loading activity history...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400">No activities found in the records.</p>
            </div>
          ) : (
            logs.map((log, i) => {
              const { icon: ActionIcon, color, bg } = getActionStyles(log.action);
              return (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.15 }}
                  className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50/40 dark:hover:bg-gray-800/20 transition-colors"
                >
                  {/* Icon Box */}
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <ActionIcon size={18} className={color} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {log.User?.name || 'System User'}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${bg} ${color}`}>
                          {log.action}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Calendar size={12} /> {safeDate(log.created_at)}
                      </span>
                    </div>

                    {/* Details Toggle/Box if any */}
                    {log.details && (
                      <div className="mt-2.5">
                        <pre className="text-[10px] font-mono p-2.5 bg-gray-50 dark:bg-gray-950/60 border border-gray-100 dark:border-gray-800 rounded-lg text-gray-500 dark:text-gray-400 overflow-x-auto">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Footer Info */}
                    <div className="mt-2 flex items-center gap-4 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1"><Globe size={11} /> IP: {log.ip_address || 'N/A'}</span>
                      {log.user_agent && (
                        <span className="truncate hidden md:block max-w-sm" title={log.user_agent}>
                          UA: {log.user_agent}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="btn text-xs py-1.5 px-3 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="btn text-xs py-1.5 px-3 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
