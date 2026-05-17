import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Code, Copy, Check, Search, ChevronDown, ChevronUp, 
  X, Eye, Edit, Trash, Plus, AlertCircle, Info, AlertTriangle, 
  CheckCircle2, Bell, FileText, LayoutGrid, Sliders, Layers, 
  Tv, MessageSquare, ArrowRight, User, Trash2, Calendar, Clock,
  Filter, HelpCircle, Settings, ChevronRight, RefreshCw, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ViewSwitcher from '../components/ui/ViewSwitcher';

// --- Code Snippet Component ---
const CodeView = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Kode berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-3 rounded-xl bg-[#1e1e24] dark:bg-[#0d0e12] overflow-hidden border border-gray-200 dark:border-gray-800 shadow-inner">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-white/5 bg-[#17171c] text-gray-400">
        <span className="text-[10px] font-black uppercase tracking-widest font-mono flex items-center gap-1.5">
          <Code size={11} className="text-blue-400" /> React + Tailwind CSS
        </span>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#2a2a35] dark:bg-gray-800 text-gray-300 hover:text-white text-[10px] font-bold uppercase transition-all hover:bg-blue-600 hover:text-white"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Tersalin' : 'Salin'}
        </button>
      </div>
      <div className="p-4 max-h-72 overflow-y-auto font-mono text-[11px] text-gray-300 whitespace-pre-wrap leading-relaxed custom-scrollbar">
        {code}
      </div>
    </div>
  );
};

// --- Custom Searchable Combobox Component (Self-Contained Demo) ---
const SearchableCombobox = ({ label, options, placeholder, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="space-y-1.5 relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 px-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full input text-left flex items-center justify-between cursor-pointer focus:border-blue-500 pr-10"
        >
          <span className={selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="absolute z-50 w-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-2 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 sticky top-0">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ketik untuk mencari..."
                    className="w-full text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-8 pr-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {search && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSearch(''); }} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-red-500"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              </div>
              <ul className="max-h-48 overflow-y-auto py-1 custom-scrollbar text-xs">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                      <li
                        key={opt.value}
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                          setSearch('');
                        }}
                        className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check size={12} />}
                      </li>
                    );
                  })
                ) : (
                  <li className="px-3 py-4 text-center text-gray-400 italic">
                    Tidak ditemukan data
                  </li>
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const UiGallery = () => {
  const [activeTab, setActiveTab] = useState('forms'); // 'forms', 'grids', 'cards', 'modals', 'feedback'
  
  // Interactive States
  const [textValue, setTextValue] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [typing, setTyping] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState('');
  const [searchableOpt, setSearchableOpt] = useState('');
  const [isSwitchedOn, setIsSwitchedOn] = useState(false);
  const [checkedBox, setCheckedBox] = useState(false);

  // Modals & Panels States
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Grid / Table States & Dummy Data
  const [gridSearch, setGridSearch] = useState('');
  const [gridSort, setGridSort] = useState({ column: 'name', dir: 'asc' });
  const [gridPage, setGridPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  
  const dummyVehicles = [
    { id: 1, name: 'Toyota Avanza 1.3 G', brand: 'Toyota', type: 'MPV', price: 235000000, status: 'Tersedia', agent: 'Rian Wijaya' },
    { id: 2, name: 'Honda Civic RS 1.5 Turbo', brand: 'Honda', type: 'Sedan', price: 610000000, status: 'Booking', agent: 'Lina Kusuma' },
    { id: 3, name: 'Mitsubishi Pajero Sport', brand: 'Mitsubishi', type: 'SUV', price: 575000000, status: 'Terjual', agent: 'Dedi Setiadi' },
    { id: 4, name: 'Hyundai IONIQ 5 Signature', brand: 'Hyundai', type: 'EV', price: 780000000, status: 'Tersedia', agent: 'Rian Wijaya' },
    { id: 5, name: 'Daihatsu Rocky 1.0 R', brand: 'Daihatsu', type: 'SUV', price: 245000000, status: 'Tersedia', agent: 'Ahmad Faisal' },
    { id: 6, name: 'Suzuki XL7 Alpha', brand: 'Suzuki', type: 'MPV', price: 290000000, status: 'Booking', agent: 'Lina Kusuma' },
    { id: 7, name: 'Wuling Air EV Lite', brand: 'Wuling', type: 'EV', price: 190000000, status: 'Tersedia', agent: 'Dedi Setiadi' },
    { id: 8, name: 'Honda HR-V SE', brand: 'Honda', type: 'SUV', price: 415000000, status: 'Terjual', agent: 'Ahmad Faisal' },
  ];

  // Search filter typing animation mockup
  useEffect(() => {
    if (searchVal) {
      setTyping(true);
      const handler = setTimeout(() => setTyping(false), 600);
      return () => clearTimeout(handler);
    }
  }, [searchVal]);

  // Code Viewer toggles
  const [showCode, setShowCode] = useState({});
  const toggleCode = (id) => {
    setShowCode(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Searchable select dummy options
  const cityOptions = [
    { value: 'jkt', label: 'Jakarta (Pusat)' },
    { value: 'bdg', label: 'Bandung (Cabang)' },
    { value: 'sub', label: 'Surabaya (Cabang)' },
    { value: 'mdn', label: 'Medan (Kantor Wilayah)' },
    { value: 'smg', label: 'Semarang (Pos Sales)' },
    { value: 'ygy', label: 'Yogyakarta (Kantor Cabang)' },
    { value: 'mks', label: 'Makassar (Cabang)' },
  ];

  // Grid sorting & filtering logics
  const handleSort = (col) => {
    setGridSort(prev => ({
      column: col,
      dir: prev.column === col && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredGridData = dummyVehicles.filter(item => 
    item.name.toLowerCase().includes(gridSearch.toLowerCase()) ||
    item.brand.toLowerCase().includes(gridSearch.toLowerCase()) ||
    item.agent.toLowerCase().includes(gridSearch.toLowerCase())
  );

  const sortedGridData = [...filteredGridData].sort((a, b) => {
    let aVal = a[gridSort.column];
    let bVal = b[gridSort.column];
    if (typeof aVal === 'string') {
      return gridSort.dir === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return gridSort.dir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Simple page logic
  const itemsPerPage = 4;
  const totalGridPages = Math.ceil(sortedGridData.length / itemsPerPage);
  const displayedGridData = sortedGridData.slice(
    (gridPage - 1) * itemsPerPage, 
    gridPage * itemsPerPage
  );

  const toggleSelectRow = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === displayedGridData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(displayedGridData.map(x => x.id));
    }
  };

  // Dynamic Island States
  const [island, setIsland] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const triggerIsland = (type, title, message) => {
    setIsland({
      isOpen: true,
      type,
      title,
      message
    });
    
    if (type !== 'loading') {
      setTimeout(() => {
        setIsland(prev => ({ ...prev, isOpen: false }));
      }, 3500);
    }
  };

  // Toast triggers
  const triggerToast = (type) => {
    if (type === 'success') {
      triggerIsland('success', 'Data Tersimpan!', 'Katalog showroom telah berhasil diperbarui secara online.');
    }
    if (type === 'error') {
      triggerIsland('error', 'Koneksi API Gagal', 'Server showroom tidak merespons. Sila hubungi IT Support.');
    }
    if (type === 'info') {
      triggerIsland('info', 'Pemberitahuan Sistem', 'Pemeliharaan server berkala akan dilakukan malam ini pukul 23:00.');
    }
    if (type === 'loading') {
      triggerIsland('loading', 'Sinkronisasi Data...', 'Menghubungkan ke core API showroom pusat.');
      setTimeout(() => {
        triggerIsland('success', 'Sinkronisasi Sukses!', 'Seluruh data cabang telah ter-update dengan sempurna.');
      }, 2500);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-[1600px] mx-auto pb-16 relative"
    >
      {/* --- DYNAMIC ISLAND NOTIFICATION BANNER --- */}
      <div 
        className="fixed top-4 left-1/2 z-[100] pointer-events-none"
        style={{ transform: 'translateX(-50%)' }}
      >
        <AnimatePresence>
          {island.isOpen && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: -20, width: '120px' }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: 0,
                width: 'auto', 
                minWidth: '360px',
                maxWidth: '480px'
              }}
              exit={{ scale: 0.8, opacity: 0, y: -20, width: '120px' }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className="pointer-events-auto bg-black dark:bg-[#1c1f26] border border-white/10 text-white p-3.5 pl-4 pr-5 rounded-[28px] shadow-2xl flex items-center gap-3.5 backdrop-blur-xl"
            >
              {/* Left Side: Animated Dynamic Island Icon */}
              <div className={`p-2 rounded-full shrink-0 flex items-center justify-center ${
                island.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' :
                island.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
                island.type === 'info' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]' :
                'bg-gray-500/10 text-gray-400 border border-gray-500/20'
              }`}>
                {island.type === 'success' && <CheckCircle2 size={16} className="animate-pulse" />}
                {island.type === 'error' && <AlertCircle size={16} className="animate-bounce" />}
                {island.type === 'info' && <Info size={16} />}
                {island.type === 'loading' && <RefreshCw size={16} className="animate-spin text-blue-400" />}
              </div>

              {/* Middle: Content Info */}
              <div className="flex-1 min-w-0 pr-2">
                <span className="block text-[9px] font-black uppercase tracking-widest text-blue-400 font-mono">
                  {island.type === 'success' ? 'Berhasil' :
                   island.type === 'error' ? 'Kesalahan' :
                   island.type === 'info' ? 'Informasi' : 'Memproses'}
                </span>
                <h5 className="text-xs font-bold text-white truncate mt-0.5">{island.title}</h5>
                <p className="text-[10px] text-gray-400 leading-normal truncate">{island.message}</p>
              </div>

              {/* Right Side: Close button */}
              <button 
                onClick={() => setIsland(prev => ({ ...prev, isOpen: false }))}
                className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-90"
              >
                <X size={10} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Premium Glassmorphic Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-900/40 backdrop-blur-md p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-br from-blue-500/10 to-violet-500/0 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Sparkles size={20} />
            </span>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Katalog Komponen UI</h1>
          </div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-relaxed">
            Pusat Referensi Desain, Animasi, dan Standarisasi Kode Admin Panel
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-semibold text-xs animate-pulse">
          <Settings size={12} className="animate-spin-slow" /> Versi Standard V1.0
        </div>
      </div>

      {/* Interactive Tabs Header Menu */}
      <div className="flex overflow-x-auto gap-1 p-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-fit max-w-full shadow-md no-scrollbar">
        {[
          { id: 'forms', label: 'Inputs & Form', icon: Sliders },
          { id: 'grids', label: 'Grids & Data Table', icon: LayoutGrid },
          { id: 'cards', label: 'Cards & Layout', icon: Layers },
          { id: 'modals', label: 'Modals & Popup', icon: Tv },
          { id: 'feedback', label: 'Alerts & Feedback', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all relative shrink-0 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' 
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* --- CONTENT TABS --- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* ========================================================================= */}
          {/* 1. FORMS & INPUTS */}
          {/* ========================================================================= */}
          {activeTab === 'forms' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Box 1: Textboxes & States */}
              <div className="card p-6 space-y-6 shadow-md">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Standard Textbox & Validation States</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Contoh textbox standard dengan variasi status validasi & error feedback.</p>
                </div>

                <div className="space-y-4">
                  {/* Basic Textbox */}
                  <Input 
                    label="Textbox Standard" 
                    placeholder="Ketik sesuatu di sini..." 
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                  />
                  
                  {/* Icon Textbox */}
                  <Input 
                    label="Textbox Dengan Icon" 
                    placeholder="Masukkan username anda" 
                    icon={User}
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                  />

                  {/* Required Textbox with Warning state */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Required Input & Custom Error <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Input bermasalah..." 
                      className="input border-red-500 dark:border-red-500/70 bg-red-50/5 focus:ring-red-500/20"
                    />
                    <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                      <AlertCircle size={10} /> Kolom ini wajib diisi dengan format yang benar.
                    </p>
                  </div>

                  {/* Disabled and ReadOnly */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Status Disabled" value="Data Terkunci" disabled />
                    <Input label="Status Read Only" value="Teks Hanya Dibaca" readOnly />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={() => toggleCode('textbox')} 
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    <Code size={14} /> 
                    {showCode['textbox'] ? 'Sembunyikan Kode' : 'Lihat Contoh Kode'}
                  </button>
                  {showCode['textbox'] && (
                    <CodeView code={`// Input Standar (Import dari components/ui/Input)
import Input from '../components/ui/Input';

<Input 
  label="Nama Lengkap" 
  placeholder="Masukkan nama..." 
  required={true}
  icon={User} // Lucide Icon Reference
  value={text} 
  onChange={(e) => setText(e.target.value)}
/>

// Teksbox dengan Error State (Tailwind)
<div className="space-y-1.5">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Email <span className="text-red-500">*</span>
  </label>
  <input 
    type="email" 
    className="input border-red-500 bg-red-50/5 focus:ring-red-500/20" 
  />
  <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
    <AlertCircle size={10} /> Email tidak valid.
  </p>
</div>`} />
                  )}
                </div>
              </div>

              {/* Box 2: Textbox Search & Auto-complete Combobox */}
              <div className="card p-6 space-y-6 shadow-md">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Textbox Search & Searchable Combobox</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Pencarian input dinamis dengan debounced loading & dropdown custom tersaring.</p>
                </div>

                <div className="space-y-5">
                  {/* Search Input with Debounce mockup */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Search Textbox (Input Pencarian Dinamis)
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <Search size={15} />
                      </div>
                      <input
                        type="text"
                        value={searchVal}
                        onChange={(e) => setSearchVal(e.target.value)}
                        placeholder="Cari kendaraan atau brand..."
                        className="input pl-10 pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center gap-2">
                        {typing && <RefreshCw size={12} className="animate-spin text-blue-500" />}
                        {searchVal && !typing && (
                          <button onClick={() => setSearchVal('')} className="text-gray-400 hover:text-red-500">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    {searchVal && (
                      <p className="text-[10px] text-blue-500 font-medium px-1">
                        {typing ? 'Mengetik...' : `Hasil pencarian untuk "${searchVal}"`}
                      </p>
                    )}
                  </div>

                  {/* Classic Custom Select Option */}
                  <Select 
                    label="Combobox Classic (Dropdown Select)"
                    placeholder="Pilih tipe body kendaraan"
                    options={[
                      { value: 'suv', label: 'SUV (Sport Utility Vehicle)' },
                      { value: 'mpv', label: 'MPV (Multi Purpose Vehicle)' },
                      { value: 'sedan', label: 'Sedan Premium' },
                      { value: 'ev', label: 'EV (Electric Vehicle)' }
                    ]}
                    value={selectedOpt}
                    onChange={(e) => setSelectedOpt(e.target.value)}
                  />

                  {/* Searchable Autocomplete Select Combobox */}
                  <SearchableCombobox 
                    label="Searchable Dropdown (Autocomplete Combobox)"
                    placeholder="Pilih kantor cabang..."
                    options={cityOptions}
                    value={searchableOpt}
                    onChange={setSearchableOpt}
                  />
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={() => toggleCode('searchbox')} 
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    <Code size={14} /> 
                    {showCode['searchbox'] ? 'Sembunyikan Kode' : 'Lihat Contoh Kode'}
                  </button>
                  {showCode['searchbox'] && (
                    <CodeView code={`// Search Textbox (Dengan Loader dan Clear button)
const [searchVal, setSearchVal] = useState('');
const [typing, setTyping] = useState(false);

<div className="relative group">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500">
    <Search size={15} />
  </div>
  <input
    type="text"
    value={searchVal}
    onChange={(e) => setSearchVal(e.target.value)}
    placeholder="Cari..."
    className="input pl-9 pr-10"
  />
  <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
    {typing && <RefreshCw size={12} className="animate-spin text-blue-500" />}
    {searchVal && (
      <button onClick={() => setSearchVal('')} className="text-gray-400 hover:text-red-500">
        <X size={14} />
      </button>
    )}
  </div>
</div>`} />
                  )}
                </div>
              </div>

              {/* Box 3: Toggle Switches & Custom Checkboxes */}
              <div className="card p-6 lg:col-span-2 space-y-6 shadow-md">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Checkboxes, Radio & Toggle Sliders</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Komponen interaktif biner dengan animasi transisi mikro yang mulus.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Toggles */}
                  <div className="space-y-4">
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Toggle Switches</span>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setIsSwitchedOn(!isSwitchedOn)}
                        className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer outline-none ${isSwitchedOn ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                      >
                        <motion.div 
                          layout
                          className="w-5 h-5 bg-white rounded-full shadow-sm"
                          animate={{ x: isSwitchedOn ? 20 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                      <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">
                        Status Fitur: <span className={isSwitchedOn ? 'text-blue-600 font-bold' : 'text-gray-400'}>{isSwitchedOn ? 'Aktif' : 'Non-Aktif'}</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Toggle switch di atas dirancang menggunakan tag button yang dibungkus transisi <b>framer-motion</b> spring untuk menyajikan animasi gerak yang premium saat ditekan.
                    </p>
                  </div>

                  {/* Custom Checkboxes */}
                  <div className="space-y-4">
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Custom Styled Checkbox</span>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={checkedBox}
                        onChange={() => setCheckedBox(!checkedBox)}
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold select-none">
                        Saya menyetujui syarat & ketentuan berlaku
                      </span>
                    </label>
                    
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Checkbox di atas menggantikan rendering default browser melalui pseudo-element SVG checkmark (styling class diatur di <code className="text-blue-600">index.css</code>) agar seragam di semua platform OS.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={() => toggleCode('toggles')} 
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    <Code size={14} /> 
                    {showCode['toggles'] ? 'Sembunyikan Kode' : 'Lihat Contoh Kode'}
                  </button>
                  {showCode['toggles'] && (
                    <CodeView code={`// Toggle Switch Dinamis (Framer Motion)
const [isOn, setIsOn] = useState(false);

<button 
  onClick={() => setIsOn(!isOn)}
  className={\`w-11 h-6 rounded-full relative p-0.5 transition-colors \${isOn ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}\`}
>
  <motion.div 
    layout
    className="w-5 h-5 bg-white rounded-full shadow"
    animate={{ x: isOn ? 20 : 0 }}
    transition={{ type: "spring", stiffness: 500, damping: 30 }}
  />
</button>

// Checkbox Standard Seragam (Tailwind Custom Styling di index.css)
<label className="flex items-center gap-3 cursor-pointer">
  <input 
    type="checkbox" 
    className="appearance-none w-5 h-5 border-2 border-gray-300 dark:border-gray-700 rounded-lg checked:bg-blue-600"
  />
  <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold select-none">Label Teks</span>
</label>`} />
                  )}
                </div>
              </div>

              {/* Box 4: Buttons & Action States */}
              <div className="card p-6 lg:col-span-2 space-y-6 shadow-md">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Buttons & Action States Showcase</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Kumpulan variasi tombol standar, tombol aksi, status loading, ukuran, dan grup tombol terintegrasi.</p>
                </div>

                <div className="space-y-6">
                  {/* Row 1: Button Styles */}
                  <div className="space-y-3">
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Button Styles</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <button className="btn-primary">Tombol Primer</button>
                      <button className="btn">Tombol Sekunder</button>
                      <button className="btn border-blue-500/50 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10">Tombol Outline</button>
                      <button className="btn border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">Tombol Ghost</button>
                      <button className="btn-danger">Tombol Destruktif</button>
                    </div>
                  </div>

                  {/* Row 2: Icons, Loading & Disabled States */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    {/* With Icons */}
                    <div className="space-y-3">
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Dengan Icon</span>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button className="btn-primary"><Plus size={14} /> Tambah Data</button>
                        <button className="btn"><Calendar size={14} /> Jadwalkan</button>
                        <button className="btn-icon bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Cari Data"><Search size={14} /></button>
                        <button className="btn-delete bg-red-50 dark:bg-red-950/20 hover:bg-red-100 text-red-500" title="Hapus"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {/* Loading State */}
                    <div className="space-y-3">
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Status Loading</span>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button className="btn-primary opacity-80 cursor-wait"><RefreshCw size={14} className="animate-spin" /> Menyimpan...</button>
                        <button className="btn opacity-80 cursor-wait"><RefreshCw size={14} className="animate-spin text-blue-500" /> Memuat Data</button>
                      </div>
                    </div>

                    {/* Disabled State */}
                    <div className="space-y-3">
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Status Non-Aktif (Disabled)</span>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button className="btn-primary" disabled>Primer Locked</button>
                        <button className="btn" disabled>Sekunder Locked</button>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Button Sizes & Segmented Button Groups */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Button Sizes */}
                    <div className="space-y-3">
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Ukuran Tombol (Sizes)</span>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white rounded-md active:scale-95 transition-all">Mini</button>
                        <button className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg active:scale-95 transition-all">Small</button>
                        <button className="btn-primary">Medium / Default</button>
                        <button className="px-6 py-3.5 text-sm font-black uppercase tracking-wider bg-blue-600 text-white rounded-xl active:scale-95 transition-all shadow-md shadow-blue-500/15">Large Button</button>
                      </div>
                    </div>

                    {/* Button Groups */}
                    <div className="space-y-3">
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Grup Tombol Segmentasi (Button Group)</span>
                      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 w-fit">
                        {['Harian', 'Mingguan', 'Bulanan'].map((label, idx) => {
                          const isActive = idx === 2; // Static demo (Bulanan active)
                          return (
                            <button
                              key={label}
                              className={`px-4.5 py-2 text-xs font-bold transition-all border-r last:border-r-0 border-gray-200 dark:border-gray-800 cursor-pointer ${
                                isActive 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={() => toggleCode('buttons')} 
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    <Code size={14} /> 
                    {showCode['buttons'] ? 'Sembunyikan Kode' : 'Lihat Contoh Kode'}
                  </button>
                  {showCode['buttons'] && (
                    <CodeView code={`// 1. Tombol Primer (Standard Project Style)
<button className="btn-primary">Tombol Primer</button>

// 2. Tombol Sekunder / Default (Borders)
<button className="btn">Tombol Sekunder</button>

// 3. Tombol Outline (Custom Border Accent)
<button className="btn border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10">Tombol Outline</button>

// 4. Tombol Ghost (Sleek Transparent)
<button className="btn border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">Tombol Ghost</button>

// 5. Tombol Danger / Destruktif
<button className="btn-danger">Hapus Permanen</button>

// 6. Tombol Status Loading (Spinner Icon)
<button className="btn-primary opacity-80 cursor-wait">
  <RefreshCw size={14} className="animate-spin" /> Menyimpan...
</button>

// 7. Grup Tombol Tersegmentasi
<div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 w-fit">
  <button className="px-4 py-2 text-xs font-bold bg-blue-600 text-white">Aktif</button>
  <button className="px-4 py-2 text-xs font-bold bg-white text-gray-500 hover:bg-gray-50">Lainnya</button>
</div>`} />
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. GRIDS & DATA TABLES */}
          {/* ========================================================================= */}
          {activeTab === 'grids' && (
            <div className="card p-6 space-y-6 shadow-md overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Premium Data Table & Search Grid</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Data grid responsive dengan filter search, pagination, checkbox multi-select, sorting, dan aksi terintegrasi.</p>
                </div>
                
                {/* Search & Actions Bar */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="relative group w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" />
                    <input
                      type="text"
                      placeholder="Cari mobil, brand, sales..."
                      value={gridSearch}
                      onChange={(e) => { setGridSearch(e.target.value); setGridPage(1); }}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500 transition-all"
                    />
                    {gridSearch && (
                      <button onClick={() => setGridSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <ViewSwitcher 
                    viewMode={viewMode} 
                    setViewMode={setViewMode} 
                    listLabel="Tabel" 
                    cardLabel="Kartu" 
                  />

                  <button className="h-9 px-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all">
                    <Filter size={12} /> Filter
                  </button>
                  
                  <button className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-500/10 transition-all">
                    <Plus size={12} /> Tambah Mobil
                  </button>
                </div>
              </div>

              {/* Table / Grid Container */}
              {viewMode === 'table' ? (
                <div className="border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900/40 overflow-hidden">
                  <div className="max-w-full overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                          {/* Checkbox Header */}
                          <th className="px-5 py-4 w-12 text-center">
                            <input 
                              type="checkbox"
                              checked={displayedGridData.length > 0 && selectedRows.length === displayedGridData.length}
                              onChange={toggleSelectAll}
                            />
                          </th>
                          
                          {/* Columns headers */}
                          {[
                            { key: 'name', label: 'Nama Mobil & Tipe' },
                            { key: 'brand', label: 'Brand / Merek' },
                            { key: 'price', label: 'Harga OTR' },
                            { key: 'status', label: 'Status' },
                            { key: 'agent', label: 'Sales Agent' },
                          ].map((col) => (
                            <th 
                              key={col.key}
                              onClick={() => handleSort(col.key)}
                              className="px-5 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer select-none hover:text-blue-500"
                            >
                              <div className="flex items-center gap-1">
                                {col.label}
                                {gridSort.column === col.key && (
                                  gridSort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                )}
                              </div>
                            </th>
                          ))}
                          <th className="px-5 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center w-28">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {displayedGridData.length > 0 ? (
                          displayedGridData.map((row) => {
                            const isSelected = selectedRows.includes(row.id);
                            return (
                              <tr 
                                key={row.id} 
                                className={`transition-colors duration-150 ${
                                  isSelected 
                                    ? 'bg-blue-50/20 dark:bg-blue-900/5 hover:bg-blue-50/30' 
                                    : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                                }`}
                              >
                                {/* Checkbox Select */}
                                <td className="px-5 py-3.5 text-center">
                                  <input 
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectRow(row.id)}
                                  />
                                </td>
                                
                                {/* Mobil Name */}
                                <td className="px-5 py-3.5">
                                  <div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">{row.name}</p>
                                    <p className="text-[10px] text-gray-400">{row.type}</p>
                                  </div>
                                </td>

                                {/* Brand */}
                                <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-300 font-semibold">
                                  {row.brand}
                                </td>

                                {/* Price */}
                                <td className="px-5 py-3.5 text-xs text-blue-600 dark:text-blue-400 font-black font-mono">
                                  Rp {row.price.toLocaleString('id-ID')}
                                </td>

                                {/* Status Badge */}
                                <td className="px-5 py-3.5">
                                  <span className={`badge ${
                                    row.status === 'Tersedia' ? 'badge-green' :
                                    row.status === 'Booking' ? 'badge-yellow' : 'badge-red'
                                  }`}>
                                    <span className="w-1 h-1 rounded-full bg-current mr-1.5" />
                                    {row.status}
                                  </span>
                                </td>

                                {/* Agent */}
                                <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">
                                  {row.agent}
                                </td>

                                {/* Actions */}
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button title="Detail" className="btn-edit text-gray-400 hover:text-blue-600">
                                      <Eye size={14} />
                                    </button>
                                    <button title="Ubah" className="btn-edit">
                                      <Edit size={14} />
                                    </button>
                                    <button title="Hapus" className="btn-delete">
                                      <Trash size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-5 py-12 text-center text-gray-400 italic text-xs">
                              Tidak ada data mobil yang cocok dengan pencarian Anda.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedGridData.length > 0 ? (
                    displayedGridData.map((row) => {
                      const isSelected = selectedRows.includes(row.id);
                      return (
                        <motion.div
                          layout
                          key={row.id}
                          className={`card p-5 relative overflow-hidden transition-all duration-200 border-l-4 ${
                            row.status === 'Tersedia' ? 'border-l-green-500' :
                            row.status === 'Booking' ? 'border-l-amber-500' : 'border-l-red-500'
                          } ${
                            isSelected 
                              ? 'bg-blue-50/10 dark:bg-blue-900/5 ring-1 ring-blue-500/30 shadow-md' 
                              : 'hover:bg-gray-50/40 dark:hover:bg-gray-800/20'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-start gap-3">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectRow(row.id)}
                                className="mt-1"
                              />
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 font-mono">
                                  {row.brand}
                                </span>
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{row.name}</h4>
                                <p className="text-[10px] text-gray-400">{row.type} • Sales: {row.agent}</p>
                              </div>
                            </div>
                            <span className={`badge ${
                              row.status === 'Tersedia' ? 'badge-green' :
                              row.status === 'Booking' ? 'badge-yellow' : 'badge-red'
                            }`}>
                              {row.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-5 pt-3 border-t border-gray-100 dark:border-gray-800/50">
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                              Rp {row.price.toLocaleString('id-ID')}
                            </span>
                            <div className="flex items-center gap-1">
                              <button title="Detail" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                                <Eye size={13} />
                              </button>
                              <button title="Ubah" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                                <Edit size={13} />
                              </button>
                              <button title="Hapus" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                                <Trash size={13} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 py-12 text-center text-gray-400 italic text-xs card">
                      Tidak ada data mobil yang cocok dengan pencarian Anda.
                    </div>
                  )}
                </div>
              )}

              {/* Grid Pagination Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                <p className="text-[11px] font-medium text-gray-500">
                  Menampilkan <span className="font-bold text-gray-900 dark:text-white">{displayedGridData.length}</span> dari <span className="font-bold text-gray-900 dark:text-white">{sortedGridData.length}</span> data mobil 
                  {selectedRows.length > 0 && (
                    <span className="ml-1.5 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                      {selectedRows.length} Terpilih
                    </span>
                  )}
                </p>

                {/* Pagination Controls */}
                {totalGridPages > 1 && (
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 p-1 border border-gray-200 dark:border-gray-800 rounded-xl">
                    <button
                      onClick={() => setGridPage(Math.max(1, gridPage - 1))}
                      disabled={gridPage === 1}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                    >
                      <ChevronRight size={14} className="rotate-180" />
                    </button>
                    
                    {Array.from({ length: totalGridPages }).map((_, i) => {
                      const pNum = i + 1;
                      return (
                        <button
                          key={pNum}
                          onClick={() => setGridPage(pNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                            gridPage === pNum
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {pNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setGridPage(Math.min(totalGridPages, gridPage + 1))}
                      disabled={gridPage === totalGridPages}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Code viewer */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={() => toggleCode('grid')} 
                  className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  <Code size={14} /> 
                  {showCode['grid'] ? 'Sembunyikan Kode' : 'Lihat Contoh Kode'}
                </button>
                {showCode['grid'] && (
                  <CodeView code={`// Template Tabel / Grid Premium Standard Admin Panel
import { useState } from 'react';
import { Search, ChevronUp, ChevronDown, Eye, Edit, Trash } from 'lucide-react';

const DataTable = () => {
  const [sort, setSort] = useState({ column: 'name', dir: 'asc' });

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900/40 overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
              <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Nama Mobil
              </th>
              <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Harga
              </th>
              <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Status
              </th>
              <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
              <td className="px-5 py-3.5">
                <div className="text-xs font-bold text-gray-900 dark:text-white">Toyota Avanza</div>
                <div className="text-[10px] text-gray-400">MPV</div>
              </td>
              <td className="px-5 py-3.5 text-xs text-blue-600 dark:text-blue-400 font-bold font-mono">
                Rp 235.000.000
              </td>
              <td className="px-5 py-3.5">
                <span className="badge badge-green">Tersedia</span>
              </td>
              <td className="px-5 py-3.5 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <button className="btn-edit"><Edit size={14} /></button>
                  <button className="btn-delete"><Trash size={14} /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};`} />
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. CARDS & VISUAL LAYOUTS */}
          {/* ========================================================================= */}
          {activeTab === 'cards' && (
            <div className="space-y-6">
              
              {/* Stat Cards Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Metric stat with glow */}
                <div className="card-hover p-6 relative overflow-hidden group shadow-md">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-all duration-300" />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Total Kendaraan</p>
                      <h4 className="text-2xl font-black text-gray-900 dark:text-white mt-1">4,289</h4>
                    </div>
                    <span className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform duration-200">
                      <Star size={16} />
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <span className="text-green-500 font-bold flex items-center">+12%</span> dari bulan lalu
                  </p>
                </div>

                {/* Card 2: Interactive Lift Action Card */}
                <div className="card-interactive card p-6 cursor-pointer shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 font-mono">Akun Tim Sales</p>
                      <h4 className="text-2xl font-black text-gray-900 dark:text-white mt-1">84 Active</h4>
                    </div>
                    <span className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                      <User size={16} />
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 group-hover:text-blue-600">
                    Buka manajemen tim <ArrowRight size={10} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                  </p>
                </div>

                {/* Card 3: Status Summary Card */}
                <div className="card-hover p-6 border-l-4 border-l-amber-500 shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Booking Aktif</p>
                      <h4 className="text-2xl font-black text-gray-900 dark:text-white mt-1">32 Unit</h4>
                    </div>
                    <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                      <Clock size={16} />
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/10 px-2 py-0.5 rounded w-fit">
                    Menunggu Verifikasi Keuangan
                  </p>
                </div>

              </div>

              {/* Sliding Tab Grid Showcase */}
              <div className="card p-6 space-y-6 shadow-md">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Sliding Tabs & Animated Navigation</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Tab indikator dinamis dengan border-gradient hover dan transisi sliding yang premium.</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/60 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                  <span className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase">Live Example Tab Panel:</span>
                  
                  {/* Sliding Tabs Indicator */}
                  <div className="flex border-b border-gray-200 dark:border-gray-800 w-fit">
                    {['Informasi Umum', 'Kontak Hubung', 'Setelan SEO'].map((tabName, idx) => {
                      const isTabActive = idx === 0; // Static demo first tab active
                      return (
                        <button
                          key={tabName}
                          className={`px-5 py-2.5 text-xs font-bold relative transition-all cursor-pointer ${
                            isTabActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-700'
                          }`}
                        >
                          {tabName}
                          {isTabActive && (
                            <motion.div 
                              layoutId="slidingLine"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/30 text-xs text-gray-600 dark:text-gray-300">
                    Konten Tab Aktif: Tab <b>Informasi Umum</b>.
                  </div>
                </div>

                {/* Code view */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={() => toggleCode('cards')} 
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    <Code size={14} /> 
                    {showCode['cards'] ? 'Sembunyikan Kode' : 'Lihat Contoh Kode'}
                  </button>
                  {showCode['cards'] && (
                    <CodeView code={`// 1. Stats Card standard (Dengan hover scale & shadow glow)
<div className="card-hover p-6 relative overflow-hidden group shadow-md">
  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-all duration-300" />
  
  <div className="flex justify-between items-start mb-4">
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Transaksi</p>
      <h4 className="text-2xl font-black text-gray-900 mt-1">Rp 1.4M</h4>
    </div>
    <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:rotate-12 transition-transform duration-200">
      <DollarSign size={16} />
    </span>
  </div>
</div>

// 2. Sliding Indicator Tab (Framer Motion)
const [activeTab, setActiveTab] = useState(0);

<div className="flex border-b border-gray-200 w-fit">
  {['Tab A', 'Tab B'].map((name, idx) => (
    <button
      key={name}
      onClick={() => setActiveTab(idx)}
      className={\`px-5 py-2.5 text-xs font-bold relative \${activeTab === idx ? 'text-blue-600' : 'text-gray-400'}\`}
    >
      {name}
      {activeTab === idx && (
        <motion.div 
          layoutId="activeUnderline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
        />
      )}
    </button>
  ))}
</div>`} />
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. MODALS & POPUPS */}
          {/* ========================================================================= */}
          {activeTab === 'modals' && (
            <div className="card p-6 space-y-6 shadow-md">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Modals, Slide-overs & Confirmation Popups</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Mekanisme dialog interaksi kritikal, form input modal, dan laci geser samping.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                
                {/* Trigger 1: Standard Popup Modal */}
                <div className="p-5 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex flex-col justify-between min-h-[160px]">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase">Popup Dialog Modal</h4>
                    <p className="text-[10px] text-gray-400 mt-1">Modal standard di tengah layar dengan animasi fade-scale untuk form entry detail.</p>
                  </div>
                  <button 
                    onClick={() => setIsPopupOpen(true)}
                    className="btn-primary w-full text-xs font-bold h-9 mt-4 rounded-xl cursor-pointer"
                  >
                    Buka Popup Modal
                  </button>
                </div>

                {/* Trigger 2: Slide-Over Side Drawer */}
                <div className="p-5 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex flex-col justify-between min-h-[160px]">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase">Slide-over Panel</h4>
                    <p className="text-[10px] text-gray-400 mt-1">Laci geser samping (Drawer) dari kanan layar, ideal untuk menu filter kompleks / log data detail.</p>
                  </div>
                  <button 
                    onClick={() => setIsSlideOpen(true)}
                    className="btn w-full text-xs font-bold h-9 mt-4 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer"
                  >
                    Buka Slide Panel
                  </button>
                </div>

                {/* Trigger 3: Destructive Confirmation */}
                <div className="p-5 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex flex-col justify-between min-h-[160px]">
                  <div>
                    <h4 className="text-xs font-bold text-red-500 uppercase">Alert Konfirmasi</h4>
                    <p className="text-[10px] text-gray-400 mt-1">Popup peringatan bahaya/destructive aksi (misal hapus data permanen) dengan ikon penjelas.</p>
                  </div>
                  <button 
                    onClick={() => setIsConfirmOpen(true)}
                    className="btn-danger w-full text-xs font-bold h-9 mt-4 rounded-xl cursor-pointer"
                  >
                    Buka Alert Bahaya
                  </button>
                </div>

              </div>

              {/* Standard Modal Rendering */}
              <Modal 
                isOpen={isPopupOpen} 
                onClose={() => setIsPopupOpen(false)} 
                title="FORM ENTRI KENDARAAN BARU"
              >
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-[11px] text-blue-600 dark:text-blue-400 leading-relaxed">
                    Sistem akan menyinkronkan data mobil ini secara langsung ke setelan katalog online setelah disimpan.
                  </div>
                  <Input label="Nama Mobil" placeholder="cth. Toyota Avanza 1.3 G" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Merek / Brand" placeholder="cth. Toyota" />
                    <Input label="Harga OTR (Rp)" type="number" placeholder="cth. 235000000" />
                  </div>
                  <div className="flex gap-2 justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={() => setIsPopupOpen(false)} className="btn text-xs font-bold h-10 px-5 rounded-xl cursor-pointer">Batal</button>
                    <button onClick={() => { setIsPopupOpen(false); toast.success('Data berhasil disimpan'); }} className="btn-primary text-xs font-bold h-10 px-5 rounded-xl cursor-pointer">Simpan Data</button>
                  </div>
                </div>
              </Modal>

              {/* Side slide-over (Custom Framer Motion implementation) */}
              <AnimatePresence>
                {isSlideOpen && (
                  <div className="fixed inset-0 z-50 overflow-hidden">
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                      onClick={() => setIsSlideOpen(false)}
                    />
                    <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
                      <motion.div 
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="w-screen max-w-md bg-white dark:bg-[#12141c] border-l border-gray-200 dark:border-gray-800 p-6 flex flex-col h-full shadow-2xl"
                      >
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase flex items-center gap-1.5">
                            <Settings size={16} className="text-blue-500" /> Log Aktivitas Detail
                          </h3>
                          <button onClick={() => setIsSlideOpen(false)} className="btn-icon">
                            <X size={16} />
                          </button>
                        </div>
                        
                        <div className="flex-1 py-6 overflow-y-auto space-y-4 custom-scrollbar">
                          {[
                            { time: '10 mins ago', desc: 'Admin mengubah harga unit Civic RS dari 600jt ke 610jt' },
                            { time: '1 hour ago', desc: 'Booking dibuat oleh Dedi Setiadi untuk Suzuki XL7' },
                            { time: 'Yesterday', desc: 'Rian Wijaya mengunggah 3 foto baru untuk Pajero Sport' }
                          ].map((log, idx) => (
                            <div key={idx} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 text-xs">
                              <span className="text-[10px] text-gray-400 font-bold font-mono">{log.time}</span>
                              <p className="text-gray-700 dark:text-gray-300 mt-1 font-semibold">{log.desc}</p>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex gap-2">
                          <button onClick={() => setIsSlideOpen(false)} className="btn w-full text-xs font-bold h-10 rounded-xl cursor-pointer">
                            Tutup Panel
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}
              </AnimatePresence>

              {/* Destructive Warning Alert Modal */}
              <Modal 
                isOpen={isConfirmOpen} 
                onClose={() => setIsConfirmOpen(false)} 
                title="KONFIRMASI PENGHAPUSAN PERMANEN"
                maxWidth="max-w-md"
              >
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-md">
                    <AlertTriangle size={24} className="animate-bounce" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Apakah Anda Sangat Yakin?</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Aksi ini bersifat destruktif dan data mobil <b>Honda Civic RS</b> yang dihapus tidak dapat dipulihkan kembali dari database utama.
                    </p>
                  </div>

                  <div className="flex gap-2 justify-center pt-4">
                    <button onClick={() => setIsConfirmOpen(false)} className="btn text-xs font-bold h-10 px-5 rounded-xl cursor-pointer">
                      Batal
                    </button>
                    <button 
                      onClick={() => { setIsConfirmOpen(false); toast.error('Data berhasil dihapus selamanya!'); }} 
                      className="btn-danger text-xs font-bold h-10 px-5 rounded-xl cursor-pointer shadow-lg shadow-red-500/10"
                    >
                      Hapus Permanen
                    </button>
                  </div>
                </div>
              </Modal>

              {/* Code viewer */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={() => toggleCode('modals')} 
                  className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  <Code size={14} /> 
                  {showCode['modals'] ? 'Sembunyikan Kode' : 'Lihat Contoh Kode'}
                </button>
                {showCode['modals'] && (
                  <CodeView code={`// 1. Popup Modal (Menggunakan komponen Modal yang ada)
import Modal from '../components/Modal';
const [isOpen, setIsOpen] = useState(false);

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="JUDUL MODAL">
  <div>Konten Form Anda Di Sini</div>
</Modal>

// 2. Slide Over Side Drawer (Framer Motion)
const [isSlideOpen, setIsSlideOpen] = useState(false);

<AnimatePresence>
  {isSlideOpen && (
    <div className="fixed inset-0 z-50">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setIsSlideOpen(false)}
      />
      <div className="fixed inset-y-0 right-0 pl-10 flex">
        <motion.div 
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="w-screen max-w-md bg-white h-full p-6"
        >
          <h3>Log Detail</h3>
          <button onClick={() => setIsSlideOpen(false)}>Tutup</button>
        </motion.div>
      </div>
    </div>
  )}
</AnimatePresence>`} />
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. ALERTS & FEEDBACKS */}
          {/* ========================================================================= */}
          {activeTab === 'feedback' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Box 1: Alert Banners */}
              <div className="card p-6 space-y-6 shadow-md">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Inline Alert Banners</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Notifikasi spanduk dalam halaman untuk menginformasikan status operasional.</p>
                </div>

                <div className="space-y-3.5">
                  {/* Success Alert */}
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-xl text-green-700 dark:text-green-400 flex items-start gap-3">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold uppercase">Berhasil Disinkronkan</h4>
                      <p className="text-[10px] opacity-90 mt-0.5">Integrasi data stock kendaraan dengan katalog online terhubung 100%.</p>
                    </div>
                  </div>

                  {/* Info Alert */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl text-blue-700 dark:text-blue-400 flex items-start gap-3">
                    <Info size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold uppercase">Sesi Sinkronisasi</h4>
                      <p className="text-[10px] opacity-90 mt-0.5">Sistem secara otomatis mengosongkan log audit yang berumur lebih dari 30 hari.</p>
                    </div>
                  </div>

                  {/* Warning Alert */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-xl text-amber-700 dark:text-amber-400 flex items-start gap-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold uppercase">Peringatan Kuota Media</h4>
                      <p className="text-[10px] opacity-90 mt-0.5">Penyimpanan disk server catalog terpakai 85%. Disarankan menghapus file sampah.</p>
                    </div>
                  </div>

                  {/* Danger Alert */}
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 flex items-start gap-3">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold uppercase">Gagal Menyambung Database</h4>
                      <p className="text-[10px] opacity-90 mt-0.5">Koneksi API showroom timeout. Harap hubungi super administrator segera.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={() => toggleCode('alerts')} 
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    <Code size={14} /> 
                    {showCode['alerts'] ? 'Sembunyikan Kode' : 'Lihat Contoh Kode'}
                  </button>
                  {showCode['alerts'] && (
                    <CodeView code={`// Spanduk Banner Sukses (Tailwind soft color)
<div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-xl text-green-700 dark:text-green-400 flex items-start gap-3">
  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
  <div>
    <h4 className="text-xs font-bold uppercase">Judul Sukses</h4>
    <p className="text-[10px] opacity-90 mt-0.5">Penjelasan aksi yang berhasil dilakukan di sini.</p>
  </div>
</div>`} />
                  )}
                </div>
              </div>

              {/* Box 2: Trigger Toast Alerts */}
              <div className="card p-6 space-y-6 shadow-md">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Global Toast Trigger Notifications</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Notifikasi floating melayang dinamis, terintegrasi penuh dengan <b>react-hot-toast</b> global.</p>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Gunakan global toaster untuk interaksi aksi instan tanpa mengganggu fokus tata letak admin panel. Klik tombol di bawah untuk melihat wujud aslinya:
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => triggerToast('success')}
                      className="h-11 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-green-500/10"
                    >
                      <CheckCircle2 size={15} /> Toast Sukses
                    </button>

                    <button 
                      onClick={() => triggerToast('error')}
                      className="h-11 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-500/10"
                    >
                      <AlertCircle size={15} /> Toast Gagal
                    </button>

                    <button 
                      onClick={() => triggerToast('info')}
                      className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      <Info size={15} /> Toast Info
                    </button>

                    <button 
                      onClick={() => triggerToast('loading')}
                      className="h-11 px-4 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-gray-500/10"
                    >
                      <RefreshCw size={15} className="animate-spin" /> Toast Loading
                    </button>
                  </div>

                  {/* soft status badges list */}
                  <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Variasi Badge Status Standard:</span>
                    <div className="flex flex-wrap gap-2.5">
                      <span className="badge badge-blue">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5" />
                        Aktif
                      </span>
                      <span className="badge badge-green">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
                        Tersedia
                      </span>
                      <span className="badge badge-yellow">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5" />
                        Booking
                      </span>
                      <span className="badge badge-red">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5" />
                        Suspended
                      </span>
                      <span className="badge badge-gray">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5" />
                        Draf
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={() => toggleCode('toasts')} 
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    <Code size={14} /> 
                    {showCode['toasts'] ? 'Sembunyikan Kode' : 'Lihat Contoh Kode'}
                  </button>
                  {showCode['toasts'] && (
                    <CodeView code={`// Menggunakan react-hot-toast (Pastikan <Toaster /> terpasang di App.jsx)
import toast from 'react-hot-toast';

// 1. Toast Sukses
// 2. Toast Gagal
toast.error('Gagal memproses data!');

// 3. Toast Loading Dinamis (Auto dismiss setelah loading selesai)
const myToast = toast.loading('Memproses...');
try {
  await simpanKeDatabase();
  toast.dismiss(myToast);
  toast.success('Berhasil disimpan!');
} catch(err) {
  toast.dismiss(myToast);
  toast.error('Gagal disimpan!');
`} />
                  )}
                </div>
              </div>

              {/* Box 3: Dynamic Island Morphing Alerts */}
              <div className="card p-6 lg:col-span-2 space-y-6 shadow-md">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Dynamic Island Morphing Alerts</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Notifikasi mengambang interaktif ala Apple Dynamic Island yang membesar dan mengecil secara adaptif menggunakan Framer Motion spring physics.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      Sistem Dynamic Island menempel di bagian tengah atas layar dan memiliki transisi morfologi berdasar muatan datanya. Klik salah satu tombol di bawah untuk melihat live demo Dynamic Island mengambang di atas halaman ini:
                    </p>
                    
                    <div className="flex flex-wrap gap-2.5">
                      <button 
                        onClick={() => triggerIsland('success', 'Tindakan Berhasil!', 'Data stock kendaraan telah disinkronkan ke katalog.')}
                        className="px-4 py-2 bg-black hover:bg-gray-900 dark:hover:bg-gray-800 text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-lg cursor-pointer"
                      >
                        <CheckCircle2 size={13} className="text-green-400" /> Island Sukses
                      </button>
                      <button 
                        onClick={() => triggerIsland('error', 'Koneksi Gagal!', 'Gagal menghubungi server database pusat.')}
                        className="px-4 py-2 bg-black hover:bg-gray-900 dark:hover:bg-gray-800 text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-lg cursor-pointer"
                      >
                        <AlertCircle size={13} className="text-red-400" /> Island Gagal
                      </button>
                      <button 
                        onClick={() => triggerIsland('info', 'Pemberitahuan Baru', 'Ada update pembaruan sistem admin panel pukul 24:00.')}
                        className="px-4 py-2 bg-black hover:bg-gray-900 dark:hover:bg-gray-800 text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-lg cursor-pointer"
                      >
                        <Info size={13} className="text-blue-400" /> Island Info
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/60 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                    <span className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase font-mono">Mengapa menggunakan Dynamic Island?</span>
                    <ul className="text-[10px] text-gray-500 dark:text-gray-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                      <li><b>Visual Menakjubkan:</b> Menarik perhatian admin panel dan memberikan kesan premium modern instan kepada pengguna.</li>
                      <li><b>Transisi Fluida:</b> Menggunakan pegas spring Framer Motion untuk morfologi ukuran dinamis.</li>
                      <li><b>Responsif Adaptif:</b> Lebar menyesuaikan panjang teks secara organik.</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={() => toggleCode('island')} 
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    <Code size={14} /> 
                    {showCode['island'] ? 'Sembunyikan Kode' : 'Lihat Contoh Kode'}
                  </button>
                  {showCode['island'] && (
                    <CodeView code={`// Komponen Dynamic Island Alert (React + Framer Motion)
import { motion, AnimatePresence } from 'framer-motion';

const [island, setIsland] = useState({ isOpen: false, type: 'success', title: '', message: '' });

// Render di Root Layout bagian atas
<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
  <AnimatePresence>
    {island.isOpen && (
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: -20, width: '120px' }}
        animate={{ 
          scale: 1, opacity: 1, y: 0,
          width: 'auto', minWidth: '360px', maxWidth: '480px'
        }}
        exit={{ scale: 0.8, opacity: 0, y: -20, width: '120px' }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className="pointer-events-auto bg-black border border-white/10 text-white p-3.5 pl-4 pr-5 rounded-[28px] shadow-2xl flex items-center gap-3.5 backdrop-blur-xl"
      >
        {/* Icon status */}
        <div className="p-2 rounded-full bg-white/5 text-green-400 border border-white/10">
          <CheckCircle2 size={16} />
        </div>
        
        {/* Konten detail */}
        <div className="flex-1 min-w-0 pr-2">
          <span className="block text-[9px] font-black uppercase text-blue-400">BERHASIL</span>
          <h5 className="text-xs font-bold text-white truncate">{island.title}</h5>
          <p className="text-[10px] text-gray-400 truncate">{island.message}</p>
        </div>
        
        {/* Tombol Tutup */}
        <button onClick={() => setIsland(prev => ({ ...prev, isOpen: false }))}>
          <X size={10} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
</div>`} />
                  )}
                </div>
              </div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* --- GUIDELINES FOOTER --- */}
      <div className="card p-6 bg-slate-50 dark:bg-gray-900/30 border-dashed border-gray-200 dark:border-gray-800 shadow-md">
        <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
          <HelpCircle size={15} className="text-blue-500" /> Aturan Desain & Animasi Untuk Admin Panel
        </h4>
        <ul className="mt-3.5 space-y-2 text-[11px] text-gray-500 dark:text-gray-400 list-disc pl-5 leading-relaxed">
          <li>
            <b>Warna Aksen Konsisten:</b> Gunakan <span className="text-blue-600 font-bold">#2563eb (Blue-600)</span> sebagai warna utama untuk tombol primer, fokus input, status aktif, dan aksen navigasi.
          </li>
          <li>
            <b>Dark Mode Uniform:</b> Warna background halaman dark mode diset pada <span className="font-mono text-blue-400">#0a0b0f</span> dan card komponen menggunakan <span className="font-mono text-blue-400">#1c1f26</span>. Border menggunakan <code className="text-gray-400 text-[10px]">rgba(255, 255, 255, 0.12)</code> atau <code className="text-gray-400 text-[10px]">border-gray-800</code>.
          </li>
          <li>
            <b>Animasi Transisi:</b> Gunakan durasi hover seragam sebesar <code className="text-blue-400 font-mono">150ms - 200ms</code> dengan easing <code className="text-blue-400 font-mono">ease-in-out</code>. Modals/overtly WAJIB menggunakan pembungkus <code className="text-blue-400 font-mono">AnimatePresence</code> untuk kelancaran animasi keluar-masuk.
          </li>
          <li>
            <b>Micro-Interactions:</b> Sematkan hover lift transisi (<code className="text-blue-400">hover:-translate-y-0.5</code>) pada card tindakan interaktif, serta efek scaling mini (<code className="text-blue-400">active:scale-97</code>) pada seluruh tombol.
          </li>
        </ul>
      </div>

    </motion.div>
  );
};

export default UiGallery;
