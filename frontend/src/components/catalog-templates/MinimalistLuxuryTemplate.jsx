import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Image as ImageIcon,
  ChevronDown, MapPin
} from 'lucide-react';
import { IMAGE_BASE_URL } from '../../config';
import ShowroomNavbar from '../ShowroomNavbar';

// Subcomponents helper
const formatNumberDots = (val) => {
  if (!val) return '';
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const FILTER_OPTIONS = [
  { value: '', label: 'Semua Unit' },
  { value: 'Mobil', label: 'Mobil' },
  { value: 'Motor', label: 'Motor' },
];

export const MetropolisLocationSelector = ({ selectedLocation, onSelectLocation }) => {
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!locationSearch || locationSearch.length < 2) {
        setLocationSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/locations?search=${locationSearch}`).then(r => r.json());
        const formatted = res.map(loc => {
          const parent = res.find(p => p.id === loc.parent_id);
          const grandParent = parent ? res.find(gp => gp.id === parent.parent_id) : null;
          return {
            ...loc,
            displayName: [loc.name, parent?.name, grandParent?.name].filter(Boolean).join(', ')
          };
        }).filter(loc => loc.name.toLowerCase().includes(locationSearch.toLowerCase()));

        setLocationSuggestions(formatted.slice(0, 8));
      } catch (err) {
        console.error('Error fetching locations:', err);
      }
    };

    const timer = setTimeout(fetchLocations, 300);
    return () => clearTimeout(timer);
  }, [locationSearch]);

  return (
    <div className="relative w-full md:w-auto">
      <button
        onClick={() => setShowLocSuggestions(!showLocSuggestions)}
        className="flex items-center gap-2.5 px-4 h-10 w-full md:w-auto border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 font-bold text-[10px] uppercase tracking-widest transition-all duration-300 rounded-none hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-98 cursor-pointer"
      >
        <MapPin size={13} className="text-neutral-450 dark:text-neutral-500" />
        <span>{selectedLocation ? selectedLocation.name : 'Pilih Lokasi'}</span>
        <ChevronDown size={11} className="text-neutral-400 dark:text-neutral-500 transition-transform duration-300" style={{ transform: showLocSuggestions ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      <AnimatePresence>
        {showLocSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-[260px] bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 z-50 p-3 rounded-none shadow-xl"
          >
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" size={12} />
              <input
                autoFocus
                type="text"
                placeholder="CARI KOTA..."
                className="w-full h-8 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 pl-8 pr-3 text-[10px] outline-none rounded-none text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-neutral-900 dark:focus:border-white transition-all uppercase tracking-wider font-bold"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-0.5">
              {selectedLocation && (
                <button
                  onClick={() => { onSelectLocation(null); setLocationSearch(''); setShowLocSuggestions(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-950 text-red-500 text-[9px] font-black uppercase tracking-wider rounded-none transition-colors"
                >
                  Hapus Filter
                </button>
              )}

              {locationSuggestions.length > 0 ? (
                locationSuggestions.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      onSelectLocation(loc);
                      setLocationSearch('');
                      setShowLocSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white text-[10px] font-bold text-neutral-700 dark:text-neutral-300 rounded-none transition-all duration-150 uppercase tracking-wider"
                  >
                    {loc.name}
                  </button>
                ))
              ) : (
                <p className="text-center py-4 text-[9px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">Tulis nama kota...</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {showLocSuggestions && <div className="fixed inset-0 z-40" onClick={() => setShowLocSuggestions(false)} />}
    </div>
  );
};

export const MetropolisSearchInput = ({ onSearch, allSuggestions, initialValue }) => {
  const [localSearch, setLocalSearch] = useState(initialValue || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleManualSearch = () => {
    onSearch(localSearch);
    setShowSuggestions(false);
  };

  const filteredSuggestions = useMemo(() => {
    if (!localSearch) return [];
    const lower = localSearch.toLowerCase();
    return allSuggestions.filter(s => s.toLowerCase().includes(lower)).slice(0, 5);
  }, [allSuggestions, localSearch]);

  return (
    <div className="relative w-full md:flex-1 min-w-0">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" size={14} />
      <input
        type="text"
        placeholder="CARI UNIT (BRAND, MODEL)..."
        className="w-full h-10 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 pl-10 pr-4 text-[10px] uppercase tracking-widest font-bold text-neutral-900 dark:text-white placeholder:text-neutral-450 outline-none focus:border-neutral-900 dark:focus:border-white transition-all rounded-none shadow-sm"
        value={localSearch}
        onChange={(e) => { setLocalSearch(e.target.value); setShowSuggestions(true); }}
        onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
        onFocus={() => { setShowSuggestions(true); }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />

      <AnimatePresence>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 z-[100] p-2 space-y-0.5 rounded-none shadow-xl"
          >
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setLocalSearch(s);
                  onSearch(s);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white text-[10px] font-bold text-neutral-700 dark:text-neutral-300 rounded-none transition-all duration-150 uppercase tracking-wider"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MinimalistLuxuryTemplate = ({
  showroomInfo, isNeutral, isPublicMode, slug, user, theme, toggleTheme,
  setIsPromoModalOpen, promotions, finalSearchTerm, setFinalSearchTerm,
  filterType, setFilterType, showAdvanced, setShowAdvanced, filters, setFilters,
  selectedLocation, setSelectedLocation, sortBy, setSortBy, showSortDropdown,
  setShowSortDropdown, uniqueBrands, uniqueYears, hierarchicalOffices, searchableOptions,
  handlePrice, formatPrice, vehicles, loading, moreLoading, totalItems, setSelectedVehicle,
  setPage, fetchVehicles, lastElementRef
}) => {

  return (
    <div className="relative min-h-screen bg-white dark:bg-neutral-950 overflow-x-hidden overflow-y-scroll pb-10 transition-colors duration-500">
      <Helmet>
        <title>{showroomInfo?.title || 'Katalog'} | Premium Minimalist</title>
        <meta name="description" content={showroomInfo?.description || 'Temukan unit kendaraan impian Anda.'} />
      </Helmet>

      {/* Dynamic Minimalist Navbar */}
      <ShowroomNavbar 
        showroomInfo={showroomInfo}
        isNeutral={true}
        isPublicMode={isPublicMode}
        slug={slug}
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        setIsPromoModalOpen={setIsPromoModalOpen}
      />

      {/* Super Minimalist Luxury Hero Section (Alpine Benchmark) */}
      <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-14 mb-14 mt-4 relative z-10">
        <div 
          className={`relative w-full rounded-3xl p-8 md:p-14 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden transition-all duration-500 ${
            showroomInfo?.theme_color?.startsWith('#') ? 'border' :
            showroomInfo?.theme_color === 'indigo' ? 'bg-indigo-500/[0.03] dark:bg-indigo-950/20 border border-indigo-500/20 dark:border-indigo-500/10' :
            showroomInfo?.theme_color === 'purple' ? 'bg-purple-500/[0.03] dark:bg-purple-950/20 border border-purple-500/20 dark:border-purple-500/10' :
            showroomInfo?.theme_color === 'slate' ? 'bg-slate-500/[0.03] dark:bg-slate-900/20 border border-slate-500/20 dark:border-slate-500/10' :
            showroomInfo?.theme_color === 'emerald' ? 'bg-emerald-500/[0.03] dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-500/10' :
            showroomInfo?.theme_color === 'rose' ? 'bg-rose-500/[0.03] dark:bg-rose-950/20 border border-rose-500/20 dark:border-rose-500/10' :
            showroomInfo?.theme_color === 'default' ? 'bg-neutral-100/60 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-900/80' :
            'bg-blue-500/[0.03] dark:bg-blue-950/20 border border-blue-500/20 dark:border-blue-500/10' // default blue
          }`}
          style={showroomInfo?.theme_color?.startsWith('#') ? {
            backgroundColor: `${showroomInfo.theme_color}08`,
            borderColor: `${showroomInfo.theme_color}33`
          } : {}}
        >
          {/* Ambient Glow */}
          {showroomInfo?.theme_color !== 'default' && (
            <div 
              className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-30 ${
                showroomInfo?.theme_color?.startsWith('#') ? '' :
                showroomInfo?.theme_color === 'indigo' ? 'bg-indigo-500' :
                showroomInfo?.theme_color === 'purple' ? 'bg-purple-500' :
                showroomInfo?.theme_color === 'slate' ? 'bg-slate-400' :
                showroomInfo?.theme_color === 'emerald' ? 'bg-emerald-500' :
                showroomInfo?.theme_color === 'rose' ? 'bg-rose-500' : 'bg-blue-500'
              }`}
              style={showroomInfo?.theme_color?.startsWith('#') ? { backgroundColor: showroomInfo.theme_color } : {}}
            />
          )}
          
          {/* Left Column (Details) */}
          <div className="flex-1 space-y-6 text-left max-w-xl relative z-10 pt-4">
            <h1 className="text-4xl md:text-6xl font-light text-neutral-900 dark:text-white tracking-tight leading-[1.05] uppercase font-mono">
              {showroomInfo?.title || 'Katalog Showroom'}
            </h1>
            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 font-light leading-relaxed max-w-md">
              {showroomInfo?.description || 'Temukan unit impian Anda dengan kualitas pelayanan profesional standar tinggi.'}
            </p>
            
            {promotions.length > 0 ? (
              <button 
                onClick={() => setIsPromoModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-6 py-3 border border-neutral-900 dark:border-white text-neutral-900 dark:text-white hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 rounded-none cursor-pointer mt-4"
              >
                PROMO HARI INI
              </button>
            ) : (
              <button 
                onClick={() => {
                  const target = document.getElementById('catalog-list');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-6 py-3 border border-neutral-900 dark:border-white text-neutral-900 dark:text-white hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 rounded-none cursor-pointer mt-4"
              >
                JELAJAHI UNIT
              </button>
            )}
          </div>

          {/* Right Column (Hero Image Studio-look) */}
          <div className="flex-1 w-full md:w-auto relative z-10 flex justify-center items-center">
            <div className="relative aspect-[16/10] w-full max-w-md rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 p-4 border border-neutral-300/30 dark:border-neutral-700/30 shadow-sm flex items-center justify-center">
              {showroomInfo?.header_image ? (
                <img 
                  src={`${IMAGE_BASE_URL}${showroomInfo.header_image}`} 
                  className="w-full h-full object-cover rounded-xl transition-transform duration-700 hover:scale-105" 
                  alt="Header Banner" 
                />
              ) : vehicles?.[0]?.images?.[0] ? (
                <img 
                  src={`${IMAGE_BASE_URL}${vehicles[0].images.find(img => img.is_primary)?.image_url || vehicles[0].images[0].image_url}`} 
                  className="w-full h-full object-contain rounded-xl transition-transform duration-700 hover:scale-105" 
                  alt="Katalog" 
                />
              ) : (
                <div className="text-neutral-300 dark:text-neutral-600"><ImageIcon size={48} strokeWidth={1} /></div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Metropolis Search & Filters (Clean Elegant Panels) */}
      <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-14 space-y-10 relative z-10">
        
        {/* Category centered filter strip with 'x' separators */}
        <div id="catalog-list" className="flex items-center justify-center flex-wrap gap-y-2 py-4 border-t border-b border-neutral-100 dark:border-neutral-900">
          {FILTER_OPTIONS.map((opt, idx) => (
            <React.Fragment key={opt.value}>
              <button
                onClick={() => { setFilterType(opt.value); setPage(1); }}
                className={`text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 px-3 cursor-pointer py-1.5 ${
                  filterType === opt.value 
                    ? 'text-neutral-900 dark:text-white border-b border-neutral-900 dark:border-white font-black' 
                    : 'text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white font-medium'
                }`}
              >
                {opt.label}
              </button>
              {idx < FILTER_OPTIONS.length - 1 && (
                <span className="text-neutral-300 dark:text-neutral-700 text-[8px] font-light tracking-[0.2em] px-1 select-none">✕</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Toolbar row with search & detailed filters toggle */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full justify-between">
          <div className="flex flex-col md:flex-row items-center gap-3 flex-1 w-full">
            {!isPublicMode && (
              <MetropolisLocationSelector selectedLocation={selectedLocation} onSelectLocation={(loc) => { setSelectedLocation(loc); setPage(1); }} />
            )}
            <MetropolisSearchInput onSearch={(val) => { setFinalSearchTerm(val); setPage(1); }} allSuggestions={searchableOptions} initialValue={finalSearchTerm} />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`h-10 px-5 border text-[10px] font-bold uppercase tracking-widest transition-all duration-300 rounded-none cursor-pointer active:scale-98 ${
                showAdvanced 
                  ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900 shadow-sm' 
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              FILTER DETAIL {showAdvanced ? '✕' : '↓'}
            </button>
          </div>
        </div>

        {/* Dynamic Advanced Flat Filters Panel */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -8 }}
              className="bg-white dark:bg-neutral-900 p-6 border border-neutral-200 dark:border-neutral-800 rounded-none grid grid-cols-1 md:grid-cols-4 gap-4 transition-all"
            >
              <div>
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 block ml-1">MERK</label>
                <select value={filters.brand} onChange={(e) => { setFilters({ ...filters, brand: e.target.value }); setPage(1); }} className="w-full h-10 border border-neutral-200 dark:border-neutral-800 px-3 text-[10px] font-bold tracking-wider uppercase outline-none bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 rounded-none focus:border-neutral-900 dark:focus:border-white transition-all">
                  <option value="" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">Semua Merk</option>
                  {uniqueBrands.map(b => <option key={b} value={b} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">{b.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 block ml-1">TAHUN</label>
                <select value={filters.year} onChange={(e) => { setFilters({ ...filters, year: e.target.value }); setPage(1); }} className="w-full h-10 border border-neutral-200 dark:border-neutral-800 px-3 text-[10px] font-bold tracking-wider uppercase outline-none bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 rounded-none focus:border-neutral-900 dark:focus:border-white transition-all">
                  <option value="" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">Semua Tahun</option>
                  {uniqueYears.map(y => <option key={y} value={y} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 block ml-1">CABANG</label>
                <select value={filters.officeId} onChange={(e) => { setFilters({ ...filters, officeId: e.target.value }); setPage(1); }} className="w-full h-10 border border-neutral-200 dark:border-neutral-800 px-3 text-[10px] font-bold tracking-wider uppercase outline-none bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 rounded-none focus:border-neutral-900 dark:focus:border-white transition-all">
                  <option value="" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">Semua Cabang</option>
                  {hierarchicalOffices.map(o => <option key={o.id} value={o.id} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 block ml-1">RANGE HARGA</label>
                <div className="flex gap-2">
                  <input type="text" value={filters.minPrice ? formatNumberDots(filters.minPrice) : ''} onChange={(e) => handlePrice('minPrice', e.target.value)} placeholder="MIN (RP)" className="w-full h-10 border border-neutral-200 dark:border-neutral-800 px-3 text-[10px] font-bold tracking-wider uppercase outline-none bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 rounded-none focus:border-neutral-900 dark:focus:border-white transition-all placeholder:text-neutral-400" />
                  <input type="text" value={filters.maxPrice ? formatNumberDots(filters.maxPrice) : ''} onChange={(e) => handlePrice('maxPrice', e.target.value)} placeholder="MAX (RP)" className="w-full h-10 border border-neutral-200 dark:border-neutral-800 px-3 text-[10px] font-bold tracking-wider uppercase outline-none bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 rounded-none focus:border-neutral-900 dark:focus:border-white transition-all placeholder:text-neutral-400" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vehicles Metropolis Grid Tiles */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 pb-3">
            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">{totalItems} UNIT TERSEDIA</span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-neutral-400 uppercase font-black tracking-[0.15em]">URUTKAN:</span>
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className="text-[9px] font-black bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-none px-2.5 py-1.5 outline-none text-neutral-800 dark:text-neutral-200 cursor-pointer tracking-widest uppercase focus:border-neutral-900 dark:focus:border-white transition-all dark:bg-neutral-900">
                {['Terbaru', 'Harga Terendah', 'Harga Tertinggi', 'Tahun Terbaru'].map(opt => (
                  <option key={opt} value={opt} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">{opt.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-4 animate-pulse">
                    <div className="aspect-[16/10] bg-neutral-100 dark:bg-neutral-900" />
                    <div className="space-y-2">
                      <div className="h-4 bg-neutral-100 dark:bg-neutral-900 w-3/4" />
                      <div className="h-3 bg-neutral-100 dark:bg-neutral-900 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-none bg-neutral-50/50 dark:bg-neutral-900/20">
                <ImageIcon size={32} className="mx-auto mb-3 opacity-20 text-neutral-500" strokeWidth={1.5} />
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Maaf, unit tidak ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {vehicles.map((v) => (
                  <article 
                    key={v.id} 
                    onClick={() => setSelectedVehicle(v)} 
                    className="group cursor-pointer flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Studio Shot Background Block */}
                      <div className="aspect-[16/10] overflow-hidden bg-neutral-200 dark:bg-neutral-800 relative flex items-center justify-center p-6 border border-neutral-200/40 dark:border-neutral-800/30 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors duration-300">
                        {v.images?.[0] ? (
                          <img 
                            src={`${IMAGE_BASE_URL}${v.images.find(img => img.is_primary)?.image_url || v.images[0].image_url}`} 
                            alt={v.model} 
                            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-103" 
                          />
                        ) : (
                          <div className="text-neutral-300 dark:text-neutral-700"><ImageIcon size={32} strokeWidth={1} /></div>
                        )}
                        
                        {/* Year Badge */}
                        <div className="absolute top-3 left-3 bg-neutral-900/95 dark:bg-white/95 text-white dark:text-neutral-950 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] rounded-none">
                          {v.year}
                        </div>
                      </div>

                      {/* Details Row */}
                      <div className="pt-2 space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="text-xs md:text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider truncate">
                            {v.brand} {v.model}
                          </h3>
                          <p className="text-xs md:text-sm font-black text-neutral-900 dark:text-white whitespace-nowrap">
                            {formatPrice(v.price)}
                          </p>
                        </div>
                        
                        {/* Muted Single-Line Specifications */}
                        <div className="flex items-center justify-between text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-medium">
                          <div className="flex items-center gap-1.5 truncate">
                            <span>{v.type || 'Kendaraan'}</span>
                            <span>•</span>
                            <span>{v.transmission || 'Manual'}</span>
                            {v.odometer && (
                              <>
                                <span>•</span>
                                <span>{parseInt(v.odometer).toLocaleString()} KM</span>
                              </>
                            )}
                          </div>
                          <span className="shrink-0 ml-2">{v.Office?.location?.name || v.Office?.name || 'Cabang'}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading trigger element */}
        <div ref={lastElementRef} className="h-20 flex items-center justify-center">
          {moreLoading && (
            <div className="flex items-center gap-2.5 text-neutral-900 dark:text-white">
              <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-[9px] font-black tracking-widest uppercase">MEMUAT LEBIH BANYAK UNIT...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinimalistLuxuryTemplate;
