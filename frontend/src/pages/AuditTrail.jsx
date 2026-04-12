import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { History, FileText, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const safeDate = (s) => { if (!s) return 'N/A'; const d = new Date(s); return isNaN(d) ? s : d.toLocaleString(); };

const actionBadge = (action) => {
  const a = (action || '').toUpperCase();
  if (['CREATE', 'INSERT'].includes(a)) return 'badge badge-green';
  if (a === 'UPDATE') return 'badge badge-blue';
  if (a === 'DELETE') return 'badge badge-red';
  return 'badge badge-gray';
};

const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get(`/logs/audit-trails?page=${page}`)
      .then(r => { setLogs(r.data.items); setTotalPages(r.data.total_pages); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-5">
      <h1 className="text-base font-bold text-gray-900 dark:text-white">Audit Trails</h1>

      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 flex items-center gap-2">
          <History size={15} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Data Changes</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No audit trails found.</div>
        ) : logs.map((log, i) => (
          <motion.div key={log.id}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.15 }}
            className="table-row px-5 py-4 flex items-start gap-4"
          >
            <div className="icon-box icon-purple w-9 h-9 rounded-lg flex-shrink-0 mt-0.5">
              <FileText size={15} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Top row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {log.User?.name || 'System'}
                  </span>
                  <span className={actionBadge(log.action)}>{log.action}</span>
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                  <Calendar size={11} /> {safeDate(log.created_at)}
                </span>
              </div>

              {/* Table info */}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Table: <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{log.table_name}</code>
                {' '}· ID: <span className="font-mono text-gray-600 dark:text-gray-300">{log.record_id}</span>
              </p>

              {/* Diff */}
              {(log.old_values || log.new_values) && (
                <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {log.old_values && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-lg">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1.5">Old Values</p>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap font-mono">
                        {JSON.stringify(log.old_values, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.new_values && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900/50 rounded-lg">
                      <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1.5">New Values</p>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap font-mono">
                        {JSON.stringify(log.new_values, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
            <span className="text-sm text-gray-400">Page {page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrail;
