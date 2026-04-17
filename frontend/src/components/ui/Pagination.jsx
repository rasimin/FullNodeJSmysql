import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ page, totalPages, setPage }) => {
  if (totalPages < 1) return null;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-6 py-4 gap-4 shadow-sm mt-6">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Page:</span>
        <span className="text-xs font-black text-blue-600 dark:text-blue-400">{page} / {totalPages}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button 
          disabled={page === 1}
          onClick={() => setPage(1)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
            page === 1 
              ? 'border-gray-100 dark:border-gray-800/40 text-gray-300 dark:text-gray-700' 
              : 'border-gray-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 text-gray-600 dark:text-gray-400 hover:text-blue-500 cursor-pointer bg-white dark:bg-gray-800/50'
          }`}
          title="First Page"
        >
          <ChevronsLeft size={16} />
        </button>

        <button 
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
            page === 1 
              ? 'border-gray-100 dark:border-gray-800/40 text-gray-300 dark:text-gray-700' 
              : 'border-gray-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 text-gray-600 dark:text-gray-400 hover:text-blue-500 cursor-pointer bg-white dark:bg-gray-800/50'
          }`}
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>
        
        <div className="flex items-center gap-2 px-3 h-10 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-white/5">
          <span className="text-[10px] text-gray-400 font-bold uppercase">Go to</span>
          <select 
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="bg-transparent text-xs font-black text-blue-600 dark:text-blue-400 outline-none cursor-pointer"
          >
            {Array.from({ length: totalPages }, (_, i) => (
              <option key={i + 1} value={i + 1} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        <button 
          disabled={page === totalPages}
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
            page === totalPages 
              ? 'border-gray-100 dark:border-gray-800/40 text-gray-300 dark:text-gray-700' 
              : 'border-gray-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 text-gray-600 dark:text-gray-400 hover:text-blue-500 cursor-pointer bg-white dark:bg-gray-800/50'
          }`}
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>

        <button 
          disabled={page === totalPages}
          onClick={() => setPage(totalPages)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
            page === totalPages 
              ? 'border-gray-100 dark:border-gray-800/40 text-gray-300 dark:text-gray-700' 
              : 'border-gray-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 text-gray-600 dark:text-gray-400 hover:text-blue-500 cursor-pointer bg-white dark:bg-gray-800/50'
          }`}
          title="Last Page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
