import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Car, Bike, X, Image as ImageIcon,
  ChevronRight, ChevronDown, Sparkles, MapPin, ArrowUpRight
} from 'lucide-react';
import { IMAGE_BASE_URL } from '../../config';
import ShowroomNavbar from '../ShowroomNavbar';

// Subcomponents helper
const formatNumberDots = (val) => {
  if (!val) return '';
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const FILTER_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'Mobil', label: 'Mobil' },
  { value: 'Motor', label: 'Motor' },
];

export const ClassicLocationSelector = ({ selectedLocation, onSelectLocation }) => {
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
        className={`flex items-center gap-2.5 px-4 h-11 md:h-12 w-full md:w-auto rounded-full transition-all duration-300 border ${showLocSuggestions ? 'bg-white dark:bg-white/10 border-gray-900 shadow-lg' : 'bg-gray-100 dark:bg-white/5 border-transparent hover:border-gray-300 dark:hover:border-white/10'}`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${selectedLocation ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
          <MapPin size={14} />
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">Lokasi</p>
          <p className="text-[10px] font-extrabold text-gray-900 dark:text-white truncate max-w-[150px] md:max-w-[90px] leading-none">
            {selectedLocation ? selectedLocation.name : 'Semua Lokasi'}
          </p>
        </div>
        <ChevronRight size={10} className={`text-gray-400 transition-transform duration-300 ${showLocSuggestions ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {showLocSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-3 w-[280px] bg-white dark:bg-[#12141c] border border-gray-100 dark:border-white/10 rounded-[28px] shadow-2xl overflow-hidden z-50 p-3"
          >
            <div className="relative mb-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                autoFocus
                type="text"
                placeholder="Cari lokasi..."
                className="w-full h-10 bg-gray-50 dark:bg-white/5 border-none rounded-full pl-10 pr-4 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-gray-900"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
              {selectedLocation && (
                <button
                  onClick={() => { onSelectLocation(null); setLocationSearch(''); setShowLocSuggestions(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors text-red-500"
                >
                  <X size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Hapus Filter Lokasi</span>
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
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all group"
                  >
                    <p className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-gray-900">{loc.name}</p>
                    <p className="text-[8px] text-gray-400 font-medium truncate uppercase tracking-widest mt-0.5">{loc.displayName}</p>
                  </button>
                ))
              ) : locationSearch.length >= 2 ? (
                <p className="text-center py-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tidak ada hasil</p>
              ) : (
                <p className="text-center py-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ketik minimal 2 huruf...</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {showLocSuggestions && <div className="fixed inset-0 z-40" onClick={() => setShowLocSuggestions(false)} />}
    </div>
  );
};

export const ClassicSearchInput = ({ onSearch, allSuggestions, initialValue }) => {
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
    <div className="relative w-full md:flex-1 min-w-0 md:min-w-[200px]">
      <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-gray-400 md:w-4 md:h-4" size={14} />
      <input
        type="text"
        placeholder="Cari unit (Brand, Model, No Plat)..."
        className={`w-full h-11 md:h-12 bg-gray-100 dark:bg-white/5 border-none rounded-full pl-10 md:pl-12 ${localSearch ? 'pr-20 md:pr-24' : 'pr-11 md:pr-12'} text-[11px] md:text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:ring-1 focus:ring-gray-300 dark:focus:ring-white/20 transition-all outline-none`}
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
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#12141c] border border-gray-100 dark:border-white/10 rounded-[20px] shadow-2xl overflow-hidden z-[100] p-1.5 space-y-0.5"
          >
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setLocalSearch(s);
                  onSearch(s);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <Search size={12} className="text-gray-400" />
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ClassicTemplate = ({
  showroomInfo, isNeutral, isPublicMode, slug, user, theme, toggleTheme,
  setIsPromoModalOpen, promotions, finalSearchTerm, setFinalSearchTerm,
  filterType, setFilterType, showAdvanced, setShowAdvanced, filters, setFilters,
  selectedLocation, setSelectedLocation, sortBy, setSortBy, showSortDropdown,
  setShowSortDropdown, uniqueBrands, uniqueYears, hierarchicalOffices, searchableOptions,
  handlePrice, formatPrice, vehicles, loading, moreLoading, totalItems, setSelectedVehicle,
  setPage, fetchVehicles, lastElementRef
}) => {

  const filterContainerRef = useRef(null);
  const filterButtonRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  const updatePillPosition = () => {
    const btn = filterButtonRefs.current[filterType || ''];
    const container = filterContainerRef.current;
    if (btn && container) {
      const cRect = container.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      setPillStyle({ left: bRect.left - cRect.left, width: bRect.width });
    }
  };

  useEffect(() => {
    updatePillPosition();
    const timer = setTimeout(updatePillPosition, 100);
    return () => clearTimeout(timer);
  }, [filterType, vehicles]);

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-[#0a0b0f] overflow-x-hidden overflow-y-scroll pb-10">
      <Helmet>
        <title>{showroomInfo?.title || 'Katalog Showroom'} | Bursa Mobil</title>
        <meta name="description" content={showroomInfo?.description || 'Temukan unit impian Anda dengan standar kualitas terbaik.'} />
      </Helmet>

      {/* Hero Banner Section */}
      <div 
        className={`relative z-0 w-full overflow-hidden transition-all duration-700 ${
          finalSearchTerm ? 'h-[180px] md:h-[240px]' : isNeutral ? 'bg-transparent pb-4 md:pb-6' : 
          `${
            showroomInfo?.theme_color?.startsWith('#') ? '' :
            showroomInfo?.theme_color === 'indigo' ? 'bg-indigo-900' :
            showroomInfo?.theme_color === 'purple' ? 'bg-purple-900' :
            showroomInfo?.theme_color === 'slate' ? 'bg-slate-900' :
            showroomInfo?.theme_color === 'emerald' ? 'bg-emerald-900' :
            showroomInfo?.theme_color === 'rose' ? 'bg-rose-900' : 'bg-blue-900'
          }`
        }`}
        style={!isNeutral && showroomInfo?.theme_color?.startsWith('#') ? { backgroundColor: showroomInfo.theme_color } : {}}
      >
        <div className="absolute inset-0 z-0">
          {!isNeutral && showroomInfo?.header_image && (
            <div className="relative w-full h-full">
              <img 
                src={`${IMAGE_BASE_URL}${showroomInfo.header_image}`} 
                className={`w-full h-full object-cover transition-all duration-1000 ${finalSearchTerm ? 'blur-md scale-110' : ''}`} 
                alt="Header" 
              />
              <div className="absolute inset-0 bg-black/35 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-gray-100 dark:from-[#0a0b0f] via-gray-100/40 dark:via-[#0a0b0f]/40 to-transparent z-[1]" />
        </div>

        <ShowroomNavbar 
          showroomInfo={showroomInfo}
          isNeutral={isNeutral}
          isPublicMode={isPublicMode}
          slug={slug}
          user={user}
          theme={theme}
          toggleTheme={toggleTheme}
          setIsPromoModalOpen={setIsPromoModalOpen}
        />

        <AnimatePresence>
          {!finalSearchTerm && (
            <motion.header 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative z-10 flex flex-col gap-5 pt-10 md:pt-20 pb-36 px-5 md:px-10 lg:px-14 items-center text-center max-w-7xl mx-auto"
            >
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white">
                {showroomInfo?.title || 'Katalog Showroom'}
              </h1>
              <p className="text-lg md:text-xl font-medium tracking-wide max-w-3xl text-white/80">
                {showroomInfo?.description || 'Temukan unit impian Anda.'}
                {promotions.length > 0 && (
                  <button 
                    onClick={() => setIsPromoModalOpen(true)}
                    className="inline-flex items-center gap-1.5 ml-3 px-3 py-1 rounded-full text-[10px] font-black bg-white text-gray-950 hover:bg-gray-100 uppercase tracking-widest shadow-xl"
                  >
                    <Sparkles size={12} /> Lihat Promo
                  </button>
                )}
              </p>
            </motion.header>
          )}
        </AnimatePresence>
      </div>

      {/* Catalog Search & Filters (Pill design) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-10 lg:px-14 -mt-12 md:-mt-14 space-y-12">
        <div className="sticky top-4 md:top-8 z-40">
          <div className="relative z-10 bg-white dark:bg-[#12141c] border border-gray-200 dark:border-white/10 p-2 md:p-2.5 rounded-[32px] md:rounded-[36px] shadow-xl">
            <div className="flex flex-wrap md:flex-nowrap items-center gap-x-2 gap-y-2">
              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 flex-1 w-full">
                {!isPublicMode && (
                  <ClassicLocationSelector selectedLocation={selectedLocation} onSelectLocation={(loc) => { setSelectedLocation(loc); setPage(1); }} />
                )}
                <ClassicSearchInput onSearch={(val) => { setFinalSearchTerm(val); setPage(1); }} allSuggestions={searchableOptions} initialValue={finalSearchTerm} />
              </div>

              <div className="flex items-center justify-between gap-2 w-full md:w-auto">
                <div ref={filterContainerRef} className="relative flex items-center gap-1 p-1 bg-gray-100 dark:bg-black/20 rounded-full overflow-x-auto no-scrollbar">
                  <motion.div className="absolute top-1 bottom-1 rounded-full bg-gray-900 dark:bg-white shadow-xl z-0" animate={{ left: pillStyle.left, width: pillStyle.width }} />
                  {FILTER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      ref={el => filterButtonRefs.current[opt.value] = el}
                      onClick={() => { setFilterType(opt.value); setPage(1); }}
                      className={`relative z-10 h-9 rounded-full text-[11px] font-bold px-6 ${filterType === opt.value ? 'text-white dark:text-gray-900' : 'text-gray-500'}`}
                    >
                      {opt.value === 'Mobil' && <Car size={16} className="inline mr-1" />}
                      {opt.value === 'Motor' && <Bike size={18} className="inline mr-1" />}
                      {!opt.value && opt.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="h-9 px-6 rounded-full text-[11px] font-extrabold uppercase bg-gray-100 dark:bg-white/5 text-gray-500 flex items-center gap-1.5"
                >
                  <Filter size={14} /> Filter
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                animate={{ opacity: 1, height: 'auto', marginTop: -24 }} 
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden bg-white/80 dark:bg-[#12141c]/80 backdrop-blur-xl rounded-b-[40px] border-x border-b border-gray-200 dark:border-white/5 shadow-2xl relative z-0"
              >
                <div className="pt-10 pb-6 px-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                  <div className="md:col-span-3 relative">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Merk / Brand</label>
                    <select 
                      value={filters.brand} 
                      onChange={(e) => { setFilters({ ...filters, brand: e.target.value }); setPage(1); }} 
                      className="w-full h-11 bg-gray-100 dark:bg-[#1a1c26] rounded-2xl px-4 text-xs font-bold outline-none"
                    >
                      <option value="">Semua Merk</option>
                      {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tahun</label>
                    <select 
                      value={filters.year} 
                      onChange={(e) => { setFilters({ ...filters, year: e.target.value }); setPage(1); }} 
                      className="w-full h-11 bg-gray-100 dark:bg-[#1a1c26] rounded-2xl px-4 text-xs font-bold outline-none"
                    >
                      <option value="">Semua Tahun</option>
                      {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Kantor Cabang</label>
                    <select 
                      value={filters.officeId} 
                      onChange={(e) => { setFilters({ ...filters, officeId: e.target.value }); setPage(1); }} 
                      className="w-full h-11 bg-gray-100 dark:bg-[#1a1c26] rounded-2xl px-4 text-xs font-bold outline-none"
                    >
                      <option value="">Semua Cabang</option>
                      {hierarchicalOffices.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Range Harga</label>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={filters.minPrice ? formatNumberDots(filters.minPrice) : ''} 
                        onChange={(e) => handlePrice('minPrice', e.target.value)} 
                        placeholder="Min (Rp)" 
                        className="w-full h-11 bg-gray-100 dark:bg-white/5 rounded-2xl px-3 text-[11px] font-bold outline-none" 
                      />
                      <input 
                        type="text" 
                        value={filters.maxPrice ? formatNumberDots(filters.maxPrice) : ''} 
                        onChange={(e) => handlePrice('maxPrice', e.target.value)} 
                        placeholder="Max (Rp)" 
                        className="w-full h-11 bg-gray-100 dark:bg-white/5 rounded-2xl px-3 text-[11px] font-bold outline-none" 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort & Grid */}
        <div className="min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{totalItems} unit premium siap dikirim</p>
            <div className="flex items-center gap-3 relative">
              <span className="text-[10px] font-black text-gray-400 uppercase">Urutkan:</span>
              <button 
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-4 bg-gray-100 dark:bg-white/5 rounded-xl px-5 py-2.5 text-[10px] font-black uppercase text-gray-900 dark:text-white"
              >
                {sortBy}
                <ChevronDown size={14} className={`transition-transform duration-300 ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showSortDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-[180px] bg-white dark:bg-[#12141c] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-1.5 space-y-0.5"
                  >
                    {['Terbaru', 'Harga Terendah', 'Harga Tertinggi', 'Tahun Terbaru'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSortBy(opt);
                          setPage(1);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${sortBy === opt ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {showSortDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-pulse">
                {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] bg-gray-200/50 dark:bg-white/5 rounded-[32px]" />)}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-32 text-gray-400">
                <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">Belum ada unit yang tersedia.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {vehicles.map((v) => (
                  <article 
                    key={v.id} 
                    onClick={() => setSelectedVehicle(v)} 
                    className="group relative bg-white dark:bg-[#12141c] rounded-[32px] p-2 border border-gray-100 dark:border-white/5 hover:border-gray-200 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-500 cursor-pointer"
                  >
                    <div className="aspect-[4/3] rounded-[24px] overflow-hidden bg-gray-50 dark:bg-gray-800 relative">
                      {v.images?.[0] ? (
                        <img src={`${IMAGE_BASE_URL}${v.images.find(img => img.is_primary)?.image_url || v.images[0].image_url}`} alt={v.model} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={40} /></div>
                      )}
                      <div className="absolute top-4 left-4 z-10 bg-black px-3 py-1.5 rounded-full">
                        <p className="text-[9px] font-black text-white uppercase tracking-widest">{v.brand} {v.year}</p>
                      </div>
                    </div>
                    <div className="p-5 pt-6">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-2 leading-tight">{v.model}</h3>
                      <div className="flex items-center gap-2 mb-6 text-gray-400">
                        <MapPin size={12} />
                        <p className="text-[10px] font-bold uppercase truncate">{v.Office?.location?.name || v.Office?.name || 'Cabang'} • {v.type}</p>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Harga</p>
                          <p className="text-xl font-black text-gray-955 dark:text-white">{formatPrice(v.price)}</p>
                        </div>
                        <div className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <ArrowUpRight size={20} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        <div ref={lastElementRef} className="h-20 flex items-center justify-center">
          {moreLoading && <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>
    </div>
  );
};

export default ClassicTemplate;
