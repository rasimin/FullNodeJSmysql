import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Car, Bike, X, Image as ImageIcon,
  ChevronRight, ChevronDown, MapPin, ChevronRight as ChevronRightIcon
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

export const MinimalistLocationSelector = ({ selectedLocation, onSelectLocation }) => {
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
        className={`flex items-center gap-2 px-3 h-10 w-full md:w-auto rounded-xl transition-all border ${showLocSuggestions ? 'bg-white dark:bg-white/10 border-blue-500 shadow-sm' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300'}`}
      >
        <MapPin size={13} className="text-gray-400" />
        <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
          {selectedLocation ? selectedLocation.name : 'Pilih Lokasi'}
        </span>
        <ChevronDown size={11} className="text-gray-400" />
      </button>

      <AnimatePresence>
        {showLocSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 mt-2 w-[240px] bg-white dark:bg-[#151722] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 p-2"
          >
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              <input
                autoFocus
                type="text"
                placeholder="Cari lokasi..."
                className="w-full h-8 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-8 pr-3 text-[11px] outline-none"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-0.5">
              {selectedLocation && (
                <button
                  onClick={() => { onSelectLocation(null); setLocationSearch(''); setShowLocSuggestions(false); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-500 text-[10px] font-bold uppercase"
                >
                  <X size={12} /> Hapus Filter
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
                    className="w-full text-left px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg"
                  >
                    <p className="text-[11px] font-bold text-gray-800 dark:text-white">{loc.name}</p>
                  </button>
                ))
              ) : (
                <p className="text-center py-3 text-[9px] text-gray-400 font-bold uppercase tracking-wider">Cari kota/lokasi</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {showLocSuggestions && <div className="fixed inset-0 z-40" onClick={() => setShowLocSuggestions(false)} />}
    </div>
  );
};

export const MinimalistSearchInput = ({ onSearch, allSuggestions, initialValue }) => {
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
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
      <input
        type="text"
        placeholder="Cari unit (Brand, Model)..."
        className="w-full h-10 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-4 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none"
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
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#151722] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-[100] p-1 space-y-0.5"
          >
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setLocalSearch(s);
                  onSearch(s);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300"
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

const MinimalistTemplate = ({
  showroomInfo, isNeutral, isPublicMode, slug, user, theme, toggleTheme,
  setIsPromoModalOpen, promotions, finalSearchTerm, setFinalSearchTerm,
  filterType, setFilterType, showAdvanced, setShowAdvanced, filters, setFilters,
  selectedLocation, setSelectedLocation, sortBy, setSortBy, showSortDropdown,
  setShowSortDropdown, uniqueBrands, uniqueYears, hierarchicalOffices, searchableOptions,
  handlePrice, formatPrice, vehicles, loading, moreLoading, totalItems, setSelectedVehicle,
  setPage, fetchVehicles, lastElementRef
}) => {

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-[#0f1115] overflow-x-hidden overflow-y-scroll pb-10">
      <Helmet>
        <title>{showroomInfo?.title || 'Catalog'} | Clean Minimalist</title>
        <meta name="description" content={showroomInfo?.description || 'Temukan unit impian.'} />
      </Helmet>

      {/* Top Navbar */}
      {/* Top Navbar & Elegant Edge-to-Edge Hero Banner */}
      <div 
        className="relative z-0 w-full overflow-hidden transition-all duration-700 bg-slate-900 dark:bg-zinc-950"
      >
        <div className="absolute inset-0 z-0">
          {showroomInfo?.header_image ? (
            <div className="relative w-full h-full">
              <img 
                src={`${IMAGE_BASE_URL}${showroomInfo.header_image}`} 
                className="w-full h-full object-cover" 
                alt="Header" 
              />
              <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </div>
          ) : (
            // Premium Gradient Mesh for Minimalist
            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-zinc-950 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />
              <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[100%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
              <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[100%] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />
            </div>
          )}
          {/* Bottom fade blending into the page background */}
          <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-gray-50 dark:from-[#0f1115] to-transparent z-[1]" />
        </div>

        <ShowroomNavbar 
          showroomInfo={showroomInfo}
          isNeutral={false}
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
              className="relative z-10 flex flex-col gap-6 pt-10 md:pt-20 pb-36 px-5 md:px-10 lg:px-14 items-center text-center max-w-7xl mx-auto text-white"
            >
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white">
                {showroomInfo?.title || 'Katalog Showroom'}
              </h1>
              <p className="text-sm md:text-base font-medium tracking-wide max-w-3xl text-white/80 leading-relaxed">
                {showroomInfo?.description || 'Temukan unit impian Anda dengan standar kualitas terbaik.'}
              </p>
              {promotions.length > 0 && (
                <button 
                  onClick={() => setIsPromoModalOpen(true)}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-white text-gray-950 hover:bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xl transition-all hover:scale-105 active:scale-98 cursor-pointer mt-2"
                >
                  Lihat Promo
                </button>
              )}
            </motion.header>
          )}
        </AnimatePresence>
      </div>

      {/* Clean Search & Filter Panel */}
      <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-14 -mt-12 md:-mt-14 space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
          <div className="flex flex-col md:flex-row items-center gap-2 flex-1 w-full">
            {!isPublicMode && (
              <MinimalistLocationSelector selectedLocation={selectedLocation} onSelectLocation={(loc) => { setSelectedLocation(loc); setPage(1); }} />
            )}
            <MinimalistSearchInput onSearch={(val) => { setFinalSearchTerm(val); setPage(1); }} allSuggestions={searchableOptions} initialValue={finalSearchTerm} />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex gap-1 p-1 bg-gray-200/50 dark:bg-white/5 rounded-xl overflow-x-auto no-scrollbar">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setFilterType(opt.value); setPage(1); }}
                  className={`h-8 rounded-lg text-[10px] font-black uppercase tracking-wider px-4 transition-all ${filterType === opt.value ? 'bg-white dark:bg-white/10 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${showAdvanced ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10'}`}
            >
              Filter Detail
            </button>
          </div>
        </div>

        {/* Dynamic Advanced Filters Panel */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-[#151722] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Merk</label>
                <select value={filters.brand} onChange={(e) => { setFilters({ ...filters, brand: e.target.value }); setPage(1); }} className="w-full h-10 border border-gray-200 dark:border-white/10 rounded-lg px-3 text-xs outline-none bg-transparent text-gray-900 dark:text-white dark:bg-[#151722]">
                  <option value="" className="bg-white dark:bg-[#151722] text-gray-900 dark:text-white">Semua Merk</option>
                  {uniqueBrands.map(b => <option key={b} value={b} className="bg-white dark:bg-[#151722] text-gray-900 dark:text-white">{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Tahun</label>
                <select value={filters.year} onChange={(e) => { setFilters({ ...filters, year: e.target.value }); setPage(1); }} className="w-full h-10 border border-gray-200 dark:border-white/10 rounded-lg px-3 text-xs outline-none bg-transparent text-gray-900 dark:text-white dark:bg-[#151722]">
                  <option value="" className="bg-white dark:bg-[#151722] text-gray-900 dark:text-white">Semua Tahun</option>
                  {uniqueYears.map(y => <option key={y} value={y} className="bg-white dark:bg-[#151722] text-gray-900 dark:text-white">{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Cabang</label>
                <select value={filters.officeId} onChange={(e) => { setFilters({ ...filters, officeId: e.target.value }); setPage(1); }} className="w-full h-10 border border-gray-200 dark:border-white/10 rounded-lg px-3 text-xs outline-none bg-transparent text-gray-900 dark:text-white dark:bg-[#151722]">
                  <option value="" className="bg-white dark:bg-[#151722] text-gray-900 dark:text-white">Semua Cabang</option>
                  {hierarchicalOffices.map(o => <option key={o.id} value={o.id} className="bg-white dark:bg-[#151722] text-gray-900 dark:text-white">{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Range Harga</label>
                <div className="flex gap-2">
                  <input type="text" value={filters.minPrice ? formatNumberDots(filters.minPrice) : ''} onChange={(e) => handlePrice('minPrice', e.target.value)} placeholder="Min" className="w-full h-10 border border-gray-200 dark:border-white/10 rounded-lg px-3 text-xs outline-none bg-transparent" />
                  <input type="text" value={filters.maxPrice ? formatNumberDots(filters.maxPrice) : ''} onChange={(e) => handlePrice('maxPrice', e.target.value)} placeholder="Max" className="w-full h-10 border border-gray-200 dark:border-white/10 rounded-lg px-3 text-xs outline-none bg-transparent" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vehicles Grid list (Clean minimalist cards) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{totalItems} Unit Tersedia</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase font-black">Urut:</span>
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className="text-[10px] font-black bg-transparent border-none outline-none uppercase text-gray-700 dark:text-white cursor-pointer dark:bg-[#0f1115]">
                {['Terbaru', 'Harga Terendah', 'Harga Tertinggi', 'Tahun Terbaru'].map(opt => (
                  <option key={opt} value={opt} className="bg-white dark:bg-[#0f1115] text-gray-900 dark:text-white">{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[...Array(6)].map((_, i) => <div key={i} className="aspect-[16/11] bg-gray-200 dark:bg-white/5 rounded-2xl" />)}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-20 text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                <ImageIcon size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-[10px] font-black uppercase tracking-wider">Unit tidak ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((v) => (
                  <article 
                    key={v.id} 
                    onClick={() => setSelectedVehicle(v)} 
                    className="group bg-white dark:bg-[#151722] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Section */}
                      <div className="aspect-[16/10] overflow-hidden bg-gray-50 dark:bg-gray-950 relative border-b border-gray-100 dark:border-white/5">
                        {v.images?.[0] ? (
                          <img src={`${IMAGE_BASE_URL}${v.images.find(img => img.is_primary)?.image_url || v.images[0].image_url}`} alt={v.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={32} /></div>
                        )}
                        <div className="absolute top-3 left-3 z-10 flex gap-2">
                          <span className="bg-white/95 dark:bg-black/90 backdrop-blur px-2.5 py-1 rounded-md text-[9px] font-black text-gray-800 dark:text-white border border-gray-200/20">{v.year}</span>
                          <span className="bg-blue-600 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase">{v.brand}</span>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-5 space-y-4">
                        <div>
                          <p className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">{v.type} • {v.transmission}</p>
                          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase truncate group-hover:text-blue-600 transition-colors">{v.model}</h3>
                        </div>

                        {/* Specs Strip */}
                        <div className="flex flex-wrap gap-1.5">
                          {v.odometer && <span className="bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md text-[9px] font-bold text-gray-500 dark:text-gray-400">{parseInt(v.odometer).toLocaleString()} KM</span>}
                          {v.fuel_type && <span className="bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md text-[9px] font-bold text-gray-500 dark:text-gray-400">{v.fuel_type}</span>}
                          {v.color && <span className="bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md text-[9px] font-bold text-gray-500 dark:text-gray-400 truncate max-w-[80px]">{v.color}</span>}
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <MapPin size={10} />
                          <p className="text-[10px] font-extrabold uppercase tracking-wider truncate">{v.Office?.location?.name || v.Office?.name || 'Cabang'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">Harga Terbaik</p>
                        <p className="text-base font-black text-gray-900 dark:text-white">{formatPrice(v.price)}</p>
                      </div>
                      <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-white/10 group-hover:border-blue-500 group-hover:bg-blue-500 group-hover:text-white rounded-lg text-[9px] font-black uppercase transition-all duration-300 dark:text-white">
                        Detail Unit <ChevronRightIcon size={10} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        <div ref={lastElementRef} className="h-20 flex items-center justify-center">
          {moreLoading && <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>
    </div>
  );
};

export default MinimalistTemplate;
