import React, { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import api from '../services/api';
import { 
  Search, Filter, Car, Bike, X, Image as ImageIcon, 
  ChevronRight, ChevronLeft, Info, CheckCircle, ShoppingCart, Sparkles, TrendingUp,
  Sun, Moon, UserCircle, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import { IMAGE_BASE_URL } from '../config';

// Debounce hook to prevent search input stuttering
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Mobil', label: 'Cars' },
  { value: 'Motor', label: 'Motorcycles' },
];

const Catalog = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const searchTerm = useDebounce(localSearch, 350);
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000000000 }); // Max 5 Billion
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    brand: '',
    year: '',
    minPrice: '',
    maxPrice: ''
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Refs for sliding pill indicator
  const filterContainerRef = useRef(null);
  const filterButtonRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  // Calculate pill indicator position
  const updatePillPosition = useCallback(() => {
    const activeKey = filterType || '';
    const btn = filterButtonRefs.current[activeKey];
    const container = filterContainerRef.current;
    if (btn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setPillStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [filterType]);

  useLayoutEffect(() => {
    updatePillPosition();
  }, [filterType, updatePillPosition]);

  useEffect(() => {
    window.addEventListener('resize', updatePillPosition);
    return () => window.removeEventListener('resize', updatePillPosition);
  }, [updatePillPosition]);

  // Run on mount after first render
  useEffect(() => {
    const t = setTimeout(updatePillPosition, 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [page, searchTerm, filterType, filters]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehicles', {
        params: { 
          status: 'Available', 
          page, 
          size: 12,
          search: searchTerm,
          type: filterType,
          brand: filters.brand,
          year: filters.year,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice
        }
      });
      setVehicles(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalItems(res.data.totalItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = v.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           v.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType ? v.type === filterType : true;
      const matchesBrand = filters.brand ? v.brand === filters.brand : true;
      const matchesYear = filters.year ? v.year.toString() === filters.year : true;
      const matchesMinPrice = filters.minPrice ? v.price >= parseInt(filters.minPrice) : true;
      const matchesMaxPrice = filters.maxPrice ? v.price <= parseInt(filters.maxPrice) : true;
      
      return matchesSearch && matchesType && matchesBrand && matchesYear && matchesMinPrice && matchesMaxPrice;
    });
  }, [vehicles, searchTerm, filterType, filters]);

  const uniqueBrands = useMemo(() => {
    return [...new Set(vehicles.map(v => v.brand))].sort();
  }, [vehicles]);

  const uniqueYears = useMemo(() => {
    return [...new Set(vehicles.map(v => v.year))].sort((a,b) => b-a);
  }, [vehicles]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const formatPrice = (p) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(p || 0);
  };

  // Format number with dots for display in price textbox
  const formatNumberDots = (val) => {
    if (!val && val !== 0) return '';
    return parseInt(val).toLocaleString('id-ID');
  };

  // Parse formatted number back to raw
  const parseFormattedNumber = (str) => {
    return str.replace(/\./g, '').replace(/,/g, '');
  };

  // Sync slider -> textbox and vice versa
  const handleMinPriceText = (e) => {
    const raw = parseFormattedNumber(e.target.value);
    if (raw === '' || /^\d+$/.test(raw)) {
      setFilters({...filters, minPrice: raw});
      setPage(1);
    }
  };
  const handleMaxPriceText = (e) => {
    const raw = parseFormattedNumber(e.target.value);
    if (raw === '' || /^\d+$/.test(raw)) {
      setFilters({...filters, maxPrice: raw});
      setPage(1);
    }
  };

  const userRole = user?.role || user?.Role?.name;

  // Card staggered animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.06,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }),
    exit: { 
      opacity: 0, 
      y: -10,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0a0b0f] p-5 md:p-10 lg:p-14 transition-colors duration-500 overflow-x-hidden overflow-y-scroll">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] -left-[10%] w-[500px] h-[500px] bg-indigo-600/10 dark:bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] -right-[10%] w-[500px] h-[500px] bg-emerald-600/10 dark:bg-emerald-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto space-y-12">
        <AnimatePresence>
          {!isSearchFocused && !localSearch && (
            <motion.header 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: '3rem' }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col gap-3 pt-8 px-2 md:items-center md:text-center"
            >
               <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
                 Product <span className="text-gray-400">Catalog</span>
               </h1>
               <p className="text-gray-500 dark:text-gray-400 text-lg font-light tracking-wide max-w-2xl">
                 Temukan unit impian Anda dengan standar kualitas terbaik dan proses yang transparan.
               </p>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Main Search & Filters Bar */}
        <div className="sticky top-4 z-40">
           <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-2 md:p-2.5 rounded-[32px] md:rounded-[36px] shadow-xl transition-all duration-500">
              <div className="flex flex-wrap md:flex-nowrap items-center gap-x-2 gap-y-3">
                {/* 1. Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Search by brand, model, or plate number..."
                    className="w-full h-12 bg-gray-100 dark:bg-white/5 border-none rounded-[24px] pl-12 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:ring-1 focus:ring-gray-300 dark:focus:ring-white/20 transition-all outline-none"
                    value={localSearch}
                    onChange={(e) => { setLocalSearch(e.target.value); setPage(1); }}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                </div>

                {/* 2. Filters (Pills with sliding indicator) */}
                <div className="flex items-center justify-between gap-2 w-full md:w-auto mt-1 md:mt-0 order-last md:order-none">
                  <div 
                    ref={filterContainerRef}
                    className="relative flex-1 md:flex-none flex items-center gap-1 p-1 bg-gray-100 dark:bg-black/20 rounded-full overflow-x-auto no-scrollbar"
                  >
                    {/* Sliding active pill background */}
                    <motion.div
                      className="absolute top-1 bottom-1 rounded-full bg-white dark:bg-white shadow-sm z-0"
                      animate={{
                        left: pillStyle.left,
                        width: pillStyle.width,
                      }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      style={{ position: 'absolute' }}
                    />

                    {FILTER_OPTIONS.map((opt) => (
                      <button 
                        key={opt.value}
                        ref={el => filterButtonRefs.current[opt.value] = el}
                        onClick={() => { setFilterType(opt.value); setPage(1); }} 
                        className={`relative z-10 whitespace-nowrap h-9 px-5 md:px-6 rounded-full text-[11px] font-bold transition-colors duration-200 flex items-center justify-center gap-1.5 flex-1 md:flex-none
                        ${filterType === opt.value ? 'text-gray-900 dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                      >
                        {opt.value === 'Mobil' && <Car size={14} />}
                        {opt.value === 'Motor' && <Bike size={14} />}
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`h-9 px-5 md:px-6 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 flex-shrink-0 
                    ${showAdvanced ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                  >
                    <Filter size={14} /> 
                    <span className="md:hidden">{showAdvanced ? 'Hide' : 'Filter'}</span>
                  </button>
                </div>

                {/* 3. Theme & Profile (pushed to far right) */}
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto order-first md:order-last">
                  <button onClick={toggleTheme} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 md:bg-gray-100 md:dark:bg-white/5 transition-colors">
                    {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-[10px] overflow-hidden border border-transparent hover:ring-2 hover:ring-gray-200 dark:hover:ring-white/10 transition-all"
                    >
                       {user?.avatar ? <img src={`${IMAGE_BASE_URL}${user.avatar}`} alt="" className="w-full h-full object-cover" /> : (user?.name?.charAt(0)?.toUpperCase() || 'U')}
                    </button>
                    
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 top-full mt-3 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[20px] shadow-xl py-2 z-50 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
                            <p className="text-[10px] font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                            <p className="text-[8px] text-gray-400 uppercase tracking-widest mt-0.5">{userRole}</p>
                          </div>
                          <NavLink to="/profile" className="flex items-center gap-3 px-4 py-2 text-[10px] font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <UserCircle size={14} /> Profile
                          </NavLink>
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                            <LogOut size={14} /> Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {showUserMenu && <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />}
                  </div>
                </div>
              </div>

              {/* Advanced Filters Panel (Integrated) */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 pb-2 px-4 grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-gray-100 dark:border-white/5 mt-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Brand Selection</label>
                          <select 
                            value={filters.brand}
                            onChange={(e) => { setFilters({...filters, brand: e.target.value}); setPage(1); }}
                            className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/20 transition-all cursor-pointer"
                          >
                            <option value="" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">All Premium Brands</option>
                            {uniqueBrands.map(b => (
                              <option key={b} value={b} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{b}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Year Model</label>
                          <select 
                            value={filters.year}
                            onChange={(e) => { setFilters({...filters, year: e.target.value}); setPage(1); }}
                            className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/20 transition-all cursor-pointer"
                          >
                            <option value="" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">All Release Years</option>
                            {uniqueYears.map(y => (
                              <option key={y} value={y} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{y}</option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                           <div className="flex justify-between items-end px-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price Range</label>
                              <p className="text-[10px] font-black text-gray-900 dark:text-white">
                                {formatPrice(filters.minPrice || priceRange.min)} — {formatPrice(filters.maxPrice || priceRange.max)}
                              </p>
                           </div>
                           
                           {/* Dual Textboxes */}
                           <div className="grid grid-cols-2 gap-2">
                             <div className="space-y-1">
                               <p className="text-[8px] text-gray-400 font-bold uppercase">Min Price (IDR)</p>
                               <input 
                                 type="text"
                                 value={filters.minPrice ? formatNumberDots(filters.minPrice) : ''}
                                 onChange={handleMinPriceText}
                                 placeholder={formatNumberDots(priceRange.min)}
                                 className="w-full h-10 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-3 text-[10px] font-bold text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white/20 transition-all"
                               />
                             </div>
                             <div className="space-y-1">
                               <p className="text-[8px] text-gray-400 font-bold uppercase">Max Price (IDR)</p>
                               <input 
                                 type="text"
                                 value={filters.maxPrice ? formatNumberDots(filters.maxPrice) : ''}
                                 onChange={handleMaxPriceText}
                                 placeholder={formatNumberDots(priceRange.max)}
                                 className="w-full h-10 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-3 text-[10px] font-bold text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white/20 transition-all"
                               />
                             </div>
                           </div>

                           {/* Dual Range Slider (always visible, synced) */}
                           <div className="flex items-center gap-2">
                             <div className="flex-1 relative h-6 flex items-center px-1 group">
                                {/* Custom Dual Range Slider Rail */}
                                <div className="absolute inset-x-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-lg overflow-hidden">
                                  <div 
                                    className="absolute h-full bg-gray-950 dark:bg-white transition-all duration-300"
                                    style={{
                                      left: `${(( (parseInt(filters.minPrice) || priceRange.min) - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
                                      width: `${(((parseInt(filters.maxPrice) || priceRange.max) - (parseInt(filters.minPrice) || priceRange.min)) / (priceRange.max - priceRange.min)) * 100}%`
                                    }}
                                  />
                                </div>
                                
                                <input 
                                  type="range" 
                                  min={priceRange.min}
                                  max={priceRange.max}
                                  step="5000000"
                                  value={filters.minPrice || priceRange.min}
                                  onChange={(e) => {
                                    const val = Math.min(parseInt(e.target.value), (parseInt(filters.maxPrice) || priceRange.max) - 10000000);
                                    setFilters({...filters, minPrice: val.toString()});
                                    setPage(1);
                                  }}
                                  className="absolute inset-x-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white dark:[&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-900 dark:[&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-xl [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-125 z-20"
                                />
                                <input 
                                  type="range" 
                                  min={priceRange.min}
                                  max={priceRange.max}
                                  step="5000000"
                                  value={filters.maxPrice || priceRange.max}
                                  onChange={(e) => {
                                    const val = Math.max(parseInt(e.target.value), (parseInt(filters.minPrice) || priceRange.min) + 10000000);
                                    setFilters({...filters, maxPrice: val.toString()});
                                    setPage(1);
                                  }}
                                  className="absolute inset-x-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-900 dark:[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-gray-900 [&::-webkit-slider-thumb]:shadow-xl [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-125 z-30"
                                />
                             </div>
                           </div>
                        </div>

                        <div className="md:col-span-4 py-4 flex justify-between items-center border-t border-gray-50 dark:border-white/5 mt-2">
                           <p className="text-[10px] text-gray-400 font-medium">Found <span className="text-gray-900 dark:text-white font-bold">{filteredVehicles.length}</span> units matching your criteria</p>
                           <button 
                            onClick={() => setFilters({ brand: '', year: '', minPrice: priceRange.min.toString(), maxPrice: priceRange.max.toString() })}
                            className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950/30 px-4 py-2 rounded-xl transition-all"
                           >
                             Clear All
                           </button>
                        </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>

        {/* Grid Section with Smooth Transition */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
              >
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-white/5 rounded-[32px] animate-pulse border border-white/5" />
                ))}
              </motion.div>
            ) : filteredVehicles.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-32 space-y-4"
              >
                 <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-700">
                   <ImageIcon size={48} />
                 </div>
                 <p className="text-gray-500 text-xl">Belum ada unit tersedia untuk kategori ini.</p>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
              >
                {filteredVehicles.map((v, i) => (
                  <motion.article
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    key={v.id}
                    onClick={() => { setSelectedVehicle(v); setActiveImageIndex(0); }}
                    className="group relative bg-[#fcfcfd] dark:bg-gray-900 rounded-[24px] overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl dark:hover:shadow-black/50 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
                  >
                    {/* Visual Badge */}
                    <div className="absolute top-5 right-5 z-20">
                       {i % 3 === 0 ? (
                         <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                           <Sparkles size={10} /> NEW ARRIVAL
                         </span>
                       ) : (
                         <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-full shadow-lg">
                           <TrendingUp size={10} /> BEST PRICE
                         </span>
                       )}
                    </div>

                    <div className="p-4">
                      <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden bg-gray-50 dark:bg-gray-800">
                        {v.images && v.images.length > 0 ? (
                          <img 
                            src={`${IMAGE_BASE_URL}${v.images.find(img => img.is_primary)?.image_url || v.images[0].image_url}`} 
                            alt={v.model}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200">
                            <ImageIcon size={60} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 md:p-7 pt-2">
                      <header>
                        <p className="text-[8px] md:text-[10px] text-gray-400 font-light tracking-[0.2em] uppercase mb-1">{v.brand}</p>
                        <h3 className="text-sm md:text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2 uppercase tracking-tight line-clamp-1">{v.model}</h3>
                      </header>

                      <div className="flex flex-wrap items-center gap-1.5 md:gap-3 mb-4 md:mb-6">
                        <span className="text-[9px] md:text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 md:px-3 py-0.5 md:py-1 rounded-full">{v.year}</span>
                        <span className="text-[9px] md:text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 md:px-3 py-0.5 md:py-1 rounded-full">{parseInt(v.odometer || 0).toLocaleString()} km</span>
                      </div>

                      <footer className="pt-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                         <p className="text-sm md:text-lg font-extrabold text-gray-950 dark:text-white tracking-tight">
                           {formatPrice(v.price)}
                         </p>
                         <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-gray-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-gray-900 transition-all duration-300">
                           <ChevronRight size={16} />
                         </div>
                      </footer>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button 
              disabled={page === 1}
              onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 transition-all disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-full">
                Page {page} of {totalPages}
              </span>
            </div>
            <button 
              disabled={page === totalPages}
              onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 transition-all disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        <div className="h-20" />
      </div>

      <AnimatePresence>
        {selectedVehicle && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
          >
            <div className="absolute inset-0 bg-[#0a0b0f]/95 backdrop-blur-2xl" onClick={() => setSelectedVehicle(null)} />
            
            <motion.div
              layoutId={`card-${selectedVehicle.id}`}
              initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-7xl max-h-full bg-white dark:bg-gray-900 rounded-[40px] overflow-hidden flex flex-col lg:flex-row shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Showcase UI */}
              <div className="w-full lg:w-[65%] h-[350px] lg:h-auto bg-gray-50 dark:bg-gray-800/50 relative">
                {selectedVehicle.images && selectedVehicle.images.length > 0 ? (
                  <img src={`${IMAGE_BASE_URL}${selectedVehicle.images[activeImageIndex]?.image_url}`} 
                    className="w-full h-full object-cover" alt={selectedVehicle.model} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200"><ImageIcon size={120} /></div>
                )}
                
                {/* Close Button - High Contrast for mobile */}
                <button 
                  onClick={() => setSelectedVehicle(null)} 
                  className="absolute top-6 left-6 p-3 bg-gray-900/60 backdrop-blur-md rounded-full text-white lg:hidden z-30 border border-white/10 shadow-lg"
                >
                  <X size={20} />
                </button>

                {/* Thumbnails - Relative positioning on mobile to avoid overlap */}
                <div className="absolute inset-x-0 bottom-0 lg:bottom-8 flex justify-center p-4 lg:p-0 z-20 pointer-events-none">
                  <div className="flex gap-3 p-2 lg:p-3 bg-gray-900/40 lg:bg-white/10 backdrop-blur-xl rounded-[20px] lg:rounded-[24px] pointer-events-auto border border-white/5">
                    {selectedVehicle.images?.map((img, idx) => (
                      <button 
                        key={img.id} 
                        onClick={() => setActiveImageIndex(idx)} 
                        className={`w-12 h-12 lg:w-14 lg:h-14 rounded-[12px] lg:rounded-[16px] overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={`${IMAGE_BASE_URL}${img.image_url}`} className="w-full h-full object-cover" alt="" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[35%] p-10 md:p-14 overflow-y-auto bg-white dark:bg-gray-900 flex flex-col">
                <div className="hidden lg:flex justify-end mb-10">
                  <button onClick={() => setSelectedVehicle(null)} className="w-14 h-14 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-1.5 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white text-[11px] font-bold rounded-full uppercase tracking-widest">{selectedVehicle.type}</span>
                    <span className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-full uppercase tracking-widest"><CheckCircle size={12} /> Ready Stock</span>
                  </div>
                  <p className="text-gray-400 text-xs font-light tracking-[0.3em] uppercase mb-2">{selectedVehicle.brand}</p>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-none mb-6">{selectedVehicle.model}</h2>
                  <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-[24px] border border-gray-100 dark:border-white/5">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">CASH PRICE</p>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white leading-none font-mono">{formatPrice(selectedVehicle.price)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-white/5 rounded-[20px]">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Production</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedVehicle.year}</p>
                  </div>
                  <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-white/5 rounded-[20px]">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Odometer</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{parseInt(selectedVehicle.odometer || 0).toLocaleString()} km</p>
                  </div>
                </div>

                <div className="mt-auto pt-10 border-t border-gray-50 dark:border-white/5 space-y-4">
                   <button className="w-full h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-950 rounded-[20px] font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-black/10 dark:shadow-none">
                     <ShoppingCart size={20} /> Contact Sales Agent
                   </button>
                   <p className="text-center text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">Unit Location: {selectedVehicle.Office?.name}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Catalog;
