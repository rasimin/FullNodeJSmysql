import React, { useState } from 'react';
import { Database, Play, Terminal, AlertCircle, CheckCircle2, Clock, Search, Download, Trash2, Copy, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import DynamicIsland from '../components/DynamicIsland';
import Pagination from '../components/ui/Pagination';

const QueryRunner = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' or 'text'
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [executionInfo, setExecutionInfo] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  const notify = (status, message, delay = 3000) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

  const handleReset = () => {
    setQuery('');
    setResults(null);
    setExecutionInfo(null);
    setCurrentPage(1);
    setActiveTab('grid');
    notify('success', 'Halaman berhasil di-reset');
  };

  const handleExecute = async () => {
    if (!query.trim()) return notify('error', 'Masukkan query SQL terlebih dahulu');

    setLoading(true);
    notify('loading', 'Mengeksekusi query...');
    setResults(null);
    setExecutionInfo(null);
    setCurrentPage(1);

    try {
      const res = await api.post('/dev/query', { sql: query });
      setResults(res.data.results);
      setExecutionInfo({
        time: res.data.executionTime,
        count: Array.isArray(res.data.results) ? res.data.results.length : (res.data.results.affectedRows || 0),
        status: 'success'
      });
      notify('success', 'Query berhasil dijalankan!');
      if (!Array.isArray(res.data.results)) setActiveTab('text');
    } catch (err) {
      console.error(err);
      setExecutionInfo({
        error: err.response?.data?.error || err.message,
        status: 'error'
      });
      setActiveTab('text');
      notify('error', 'Gagal mengeksekusi query');
    } finally {
      setLoading(false);
    }
  };

  const renderGrid = () => {
    if (!results || !Array.isArray(results) || results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Search size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-medium">Tidak ada data untuk ditampilkan</p>
        </div>
      );
    }

    const columns = Object.keys(results[0]);
    
    // Pagination Logic
    const totalPages = Math.ceil(results.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = results.slice(indexOfFirstItem, indexOfLastItem);

    return (
      <div className="space-y-4">
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900/50 overflow-hidden">
          <div className="max-h-[500px] overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentItems.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                    {columns.map(col => (
                      <td key={col} className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {row[col] === null ? <span className="italic text-gray-400">null</span> : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {totalPages > 1 && (
          <Pagination 
            page={currentPage} 
            totalPages={totalPages} 
            setPage={setCurrentPage} 
          />
        )}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-[1600px] mx-auto"
    >
      <DynamicIsland status={notification.status} message={notification.message} />

      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Database size={20} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">SQL Query Runner</h1>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Developer Utilities & Database Management</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleReset}
                className="h-11 px-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-red-500 hover:border-red-500/50 transition-all flex items-center gap-2"
            >
                <RotateCcw size={18} />
                Reset
            </button>
            <button 
                onClick={handleExecute}
                disabled={loading}
                className="btn-primary h-11 px-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
                {loading ? <Clock size={18} className="animate-spin" /> : <Play size={18} />}
                Jalankan Query
            </button>
        </div>
      </div>

      {/* Editor Section */}
      <div className="card overflow-hidden border-none shadow-xl bg-[#1e1e1e] p-1">
        <div className="flex items-center gap-2 px-4 py-2 bg-[#252526] border-b border-white/5">
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <span className="ml-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Terminal size={12} /> MySQL Console
            </span>
        </div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="-- Ketik query SQL di sini...
SELECT * FROM vehicles LIMIT 10;"
          className="w-full h-48 bg-transparent text-gray-300 p-4 font-mono text-sm outline-none resize-y custom-scrollbar placeholder:text-gray-600"
          spellCheck="false"
        />
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('grid')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'grid' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Grid Result
                </button>
                <button
                    onClick={() => setActiveTab('text')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'text' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Console Output
                </button>
            </div>

            {executionInfo && (
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                    {executionInfo.status === 'success' ? (
                        <>
                            <span className="flex items-center gap-1.5 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-900/30">
                                <CheckCircle2 size={12} /> Success
                            </span>
                            <span className="text-gray-400">{executionInfo.count} rows affected</span>
                            <span className="text-gray-400">{executionInfo.time}</span>
                        </>
                    ) : (
                        <span className="flex items-center gap-1.5 text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30">
                            <AlertCircle size={12} /> Execution Failed
                        </span>
                    )}
                </div>
            )}
        </div>

        <div className="card min-h-[300px] border-none shadow-xl overflow-hidden">
            <AnimatePresence mode="wait">
                {activeTab === 'grid' ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                        className="p-1"
                    >
                        {renderGrid()}
                    </motion.div>
                ) : (
                    <motion.div
                        key="text"
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                        className="p-6 font-mono text-xs"
                    >
                        {executionInfo?.status === 'error' ? (
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 space-y-2">
                                <p className="font-bold uppercase tracking-widest text-[10px]">Error Message:</p>
                                <p className="leading-relaxed">{executionInfo.error}</p>
                            </div>
                        ) : results ? (
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl text-gray-600 dark:text-gray-400 space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-bold uppercase tracking-widest text-[10px] text-blue-600">Response Object:</p>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(JSON.stringify(results, null, 2));
                                                notify('success', 'Berhasil disalin ke clipboard');
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-[9px] font-black uppercase text-gray-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                                        >
                                            <Copy size={12} /> Salin JSON
                                        </button>
                                    </div>
                                    <div className="max-h-[500px] overflow-auto custom-scrollbar rounded-lg bg-gray-100/50 dark:bg-black/20 p-4">
                                        <pre className="whitespace-pre-wrap">
                                            {JSON.stringify(results, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Terminal size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-medium">Output console akan muncul di sini</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default QueryRunner;
