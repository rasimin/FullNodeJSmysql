import React from 'react';
import { LayoutList, LayoutGrid } from 'lucide-react';

const ViewSwitcher = ({ viewMode, setViewMode, listLabel = "List", cardLabel = "Card" }) => {
  return (
    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0">
      <button 
        onClick={() => setViewMode('table')}
        className={`p-1.5 px-3 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase transition-all ${
          viewMode === 'table' 
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm' 
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
      >
        <LayoutList size={14} /> 
        <span className="pr-1.5 tracking-wider">{listLabel}</span>
      </button>
      <button 
        onClick={() => setViewMode('grid')}
        className={`p-1.5 px-3 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase transition-all ${
          viewMode === 'grid' 
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm' 
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
      >
        <LayoutGrid size={14} /> 
        <span className="pr-1.5 tracking-wider">{cardLabel}</span>
      </button>
    </div>
  );
};

export default ViewSwitcher;
