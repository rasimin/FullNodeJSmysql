import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Car, Bike, X, Image as ImageIcon,
  ChevronDown, MapPin, ArrowUpRight
} from 'lucide-react';
import { IMAGE_BASE_URL } from '../../config';
import ShowroomNavbar from '../ShowroomNavbar';

// Subcomponents helper
const formatNumberDots = (val) => {
  if (!val) return '';
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const FILTER_OPTIONS = [
  { value: '', label: 'SEMUA UNIT' },
  { value: 'Mobil', label: 'MOBIL' },
  { value: 'Motor', label: 'MOTOR' },
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
        className="flex items-center gap-2 px-4 h-11 w-full md:w-auto border-2 border-gray-950 dark:border-white bg-white dark:bg-black font-black uppercase tracking-widest text-[10px] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_rgba(255,255,255,1)] transition-all duration-200"
      >
        <MapPin size={13} strokeWidth={2.5} />
        <span>{selectedLocation ? selectedLocation.name : 'PILIH LOKASI'}</span>
        <ChevronDown size={12} />
      </button>

      <AnimatePresence>
        {showLocSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 mt-2 w-[240px] bg-white dark:bg-black border-2 border-gray-950 dark:border-white z-50 p-3"
          >
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              <input
                autoFocus
                type="text"
                placeholder="CARI LOKASI..."
                className="w-full h-8 bg-gray-50 dark:bg-neutral-900 border-2 border-gray-950 dark:border-white pl-8 pr-3 text-[10px] font-black uppercase tracking-widest outline-none"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-1">
              {selectedLocation && (
                <button
                  onClick={() => { onSelectLocation(null); setLocationSearch(''); setShowLocSuggestions(false); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 text-[10px] font-black uppercase"
                >
                  HAPUS LOKASI
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
                    className="w-full text-left px-2 py-1.5 hover:bg-gray-150 dark:hover:bg-neutral-900 text-[11px] font-black"
                  >
                    {loc.name.toUpperCase()}
                  </button>
                ))
              ) : (
                <p className="text-center py-3 text-[8px] text-gray-400 font-black uppercase">TULIS NAMA KOTA</p>
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
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-950 dark:text-white" size={14} strokeWidth={2.5} />
      <input
        type="text"
        placeholder="CARI KENDARAAN (BRAND, MODEL)..."
        className="w-full h-11 bg-white dark:bg-black border-2 border-gray-950 dark:border-white pl-10 pr-4 text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white placeholder:text-gray-400 outline-none hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_rgba(255,255,255,1)] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:focus:shadow-[4px_4px_0px_rgba(255,255,255,1)] transition-all duration-200"
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
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-black border-2 border-gray-950 dark:border-white z-[100] p-1 space-y-0.5"
          >
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setLocalSearch(s);
                  onSearch(s);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-900 text-xs font-black uppercase tracking-widest"
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

const MetropolisTemplate = ({
  showroomInfo, isNeutral, isPublicMode, slug, user, theme, toggleTheme,
  setIsPromoModalOpen, promotions, finalSearchTerm, setFinalSearchTerm,
  filterType, setFilterType, showAdvanced, setShowAdvanced, filters, setFilters,
  selectedLocation, setSelectedLocation, sortBy, setSortBy, showSortDropdown,
  setShowSortDropdown, uniqueBrands, uniqueYears, hierarchicalOffices, searchableOptions,
  handlePrice, formatPrice, vehicles, loading, moreLoading, totalItems, setSelectedVehicle,
  setPage, fetchVehicles, lastElementRef
}) => {

  return (
    <div className="relative min-h-screen bg-white dark:bg-neutral-950 overflow-x-hidden overflow-y-scroll pb-10">
      <Helmet>
        <title>{showroomInfo?.title || 'Catalog'} | Metropolis Metro</title>
        <meta name="description" content={showroomInfo?.description || 'Temukan unit impian.'} />
      </Helmet>

      {/* Dynamic Metro Navbar */}
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

      {/* Metropolis Solid Title Block */}
      <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-14 pt-12 pb-8 border-b-4 border-gray-950 dark:border-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-blue-600 text-white p-8 mb-8 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all duration-300">
        <div className="space-y-4">
          <span className="bg-gray-950 text-white dark:bg-white dark:text-gray-950 px-3 py-1 text-[8px] font-black uppercase tracking-[0.3em]">SHOWROOM METRO PORTAL</span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
            {showroomInfo?.title || 'Katalog Showroom'}
          </h1>
          <p className="text-xs font-black uppercase tracking-widest text-blue-100 max-w-2xl">
            {showroomInfo?.description || 'Temukan unit impian Anda dengan standar kualitas terbaik.'}
          </p>
        </div>
        {promotions.length > 0 && (
          <button 
            onClick={() => setIsPromoModalOpen(true)}
            className="px-6 py-3 bg-gray-950 text-white dark:bg-white dark:text-gray-950 font-black text-xs uppercase tracking-widest border-2 border-gray-950 dark:border-white hover:bg-white hover:text-gray-950 transition-all shadow-[4px_4px_0px_rgba(255,255,255,1)]"
          >
            PROMO HARI INI
          </button>
        )}
      </div>

      {/* Metropolis Search & Filters (Flat Sharp Tiles) */}
      <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-14 space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
          <div className="flex flex-col md:flex-row items-center gap-2 flex-1 w-full">
            {!isPublicMode && (
              <MetropolisLocationSelector selectedLocation={selectedLocation} onSelectLocation={(loc) => { setSelectedLocation(loc); setPage(1); }} />
            )}
            <MetropolisSearchInput onSearch={(val) => { setFinalSearchTerm(val); setPage(1); }} allSuggestions={searchableOptions} initialValue={finalSearchTerm} />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex border-2 border-gray-950 dark:border-white divide-x-2 divide-gray-950 dark:divide-white bg-white dark:bg-black overflow-x-auto no-scrollbar">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setFilterType(opt.value); setPage(1); }}
                  className={`h-9 px-4 text-[9px] font-black uppercase tracking-widest transition-all ${filterType === opt.value ? 'bg-gray-950 text-white dark:bg-white dark:text-black' : 'text-gray-500 hover:text-gray-950 dark:hover:text-white'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`h-9 px-4 border-2 border-gray-950 dark:border-white font-black text-[9px] uppercase tracking-widest transition-all ${showAdvanced ? 'bg-blue-600 text-white' : 'bg-white dark:bg-black text-gray-500 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]'}`}
            >
              FILTER DETIL
            </button>
          </div>
        </div>

        {/* Dynamic Advanced Flat Filters Panel */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -5 }}
              className="bg-white dark:bg-black p-6 border-2 border-gray-950 dark:border-white shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">MERK</label>
                <select value={filters.brand} onChange={(e) => { setFilters({ ...filters, brand: e.target.value }); setPage(1); }} className="w-full h-10 border-2 border-gray-950 dark:border-white px-3 text-xs outline-none bg-transparent font-black uppercase tracking-widest">
                  <option value="">SEMUA MERK</option>
                  {uniqueBrands.map(b => <option key={b} value={b}>{b.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">TAHUN</label>
                <select value={filters.year} onChange={(e) => { setFilters({ ...filters, year: e.target.value }); setPage(1); }} className="w-full h-10 border-2 border-gray-950 dark:border-white px-3 text-xs outline-none bg-transparent font-black uppercase tracking-widest">
                  <option value="">SEMUA TAHUN</option>
                  {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">CABANG</label>
                <select value={filters.officeId} onChange={(e) => { setFilters({ ...filters, officeId: e.target.value }); setPage(1); }} className="w-full h-10 border-2 border-gray-950 dark:border-white px-3 text-xs outline-none bg-transparent font-black uppercase tracking-widest">
                  <option value="">SEMUA CABANG</option>
                  {hierarchicalOffices.map(o => <option key={o.id} value={o.id}>{o.label.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">RANGE HARGA</label>
                <div className="flex gap-2">
                  <input type="text" value={filters.minPrice ? formatNumberDots(filters.minPrice) : ''} onChange={(e) => handlePrice('minPrice', e.target.value)} placeholder="MIN (RP)" className="w-full h-10 border-2 border-gray-950 dark:border-white px-3 text-xs outline-none bg-transparent font-black" />
                  <input type="text" value={filters.maxPrice ? formatNumberDots(filters.maxPrice) : ''} onChange={(e) => handlePrice('maxPrice', e.target.value)} placeholder="MAX (RP)" className="w-full h-10 border-2 border-gray-950 dark:border-white px-3 text-xs outline-none bg-transparent font-black" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vehicles Metropolis Grid Tiles */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-gray-950 dark:border-white pb-3">
            <span className="text-[10px] font-black text-gray-950 dark:text-white uppercase tracking-[0.2em]">{totalItems} UNIT TERSEDIA</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase font-black">SORT:</span>
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className="text-[10px] font-black bg-transparent border-none outline-none uppercase text-gray-950 dark:text-white cursor-pointer tracking-wider">
                {['Terbaru', 'Harga Terendah', 'Harga Tertinggi', 'Tahun Terbaru'].map(opt => (
                  <option key={opt} value={opt} className="dark:bg-neutral-950">{opt.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[...Array(6)].map((_, i) => <div key={i} className="aspect-[16/10] bg-gray-100 dark:bg-neutral-900 border-2 border-gray-950 dark:border-white animate-pulse" />)}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-20 border-2 border-gray-950 dark:border-white">
                <ImageIcon size={32} className="mx-auto mb-2 opacity-50 text-gray-950 dark:text-white" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-950 dark:text-white">MAAF, UNIT TIDAK TERSEDIA.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {vehicles.map((v, index) => {
                  const isFeatured = index % 4 === 0;

                  return (
                    <article 
                      key={v.id} 
                      onClick={() => setSelectedVehicle(v)} 
                      className={`group relative bg-white dark:bg-[#141414] border-2 ${
                        isFeatured ? 'border-blue-600 dark:border-blue-500' : 'border-gray-950 dark:border-white'
                      } transition-all duration-300 hover:-translate-x-1.5 hover:-translate-y-1.5 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_rgba(255,255,255,1)] cursor-pointer flex flex-col justify-between overflow-hidden`}
                    >
                      <div>
                        <div className={`h-1.5 w-full ${isFeatured ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-950 dark:bg-white'}`} />
                        
                        {/* Image Section */}
                        <div className="aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-neutral-900 relative border-b-2 border-gray-950 dark:border-white">
                          {v.images?.[0] ? (
                            <img src={`${IMAGE_BASE_URL}${v.images.find(img => img.is_primary)?.image_url || v.images[0].image_url}`} alt={v.model} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={36} strokeWidth={1.5} /></div>
                          )}
                          <div className="absolute top-0 left-0 bg-gray-950 text-white dark:bg-white dark:text-gray-950 px-3 py-1 text-[8px] font-black uppercase tracking-widest border-r-2 border-b-2 border-gray-950 dark:border-white">{v.year}</div>
                          <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest border-l-2 border-b-2 border-blue-600">{v.brand}</div>
                        </div>

                        {/* Content Section */}
                        <div className="p-6 space-y-4">
                          <div>
                            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                              <span className="text-[9px] font-black uppercase tracking-[0.25em]">{v.type || 'KENDARAAN'}</span>
                              <span className="text-[9px] text-gray-400">•</span>
                              <span className="text-[9px] font-black uppercase tracking-[0.25em]">{v.transmission || 'MANUAL'}</span>
                            </div>
                            <h3 className="text-2xl font-black text-gray-950 dark:text-white uppercase tracking-tighter leading-none group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">{v.model}</h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                            {v.odometer && <span>{parseInt(v.odometer).toLocaleString()} KM</span>}
                            {v.fuel_type && <><span className="text-gray-300 dark:text-neutral-700">|</span><span>{v.fuel_type}</span></>}
                            {v.color && <><span className="text-gray-300 dark:text-neutral-700">|</span><span className="truncate max-w-[90px]">{v.color}</span></>}
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800 text-gray-400">
                            <MapPin size={12} />
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] truncate">{v.Office?.location?.name || v.Office?.name || 'Cabang'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Metro Footer */}
                      <div className="flex border-t-2 border-gray-950 dark:border-white divide-x-2 divide-gray-950 dark:divide-white bg-gray-50 dark:bg-neutral-900/40">
                        <div className="flex-1 p-4">
                          <p className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">HARGA METROPOLIS</p>
                          <p className="text-lg font-black text-gray-955 dark:text-white tracking-tighter leading-none">{formatPrice(v.price)}</p>
                        </div>
                        <div className="w-14 shrink-0 flex items-center justify-center bg-gray-955 dark:bg-white text-white dark:text-gray-955 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                          <ArrowUpRight size={24} className="transition-transform group-hover:rotate-45 duration-300" strokeWidth={3} />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

        <div ref={lastElementRef} className="h-20 flex items-center justify-center">
          {moreLoading && <div className="w-6 h-6 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>
    </div>
  );
};

export default MetropolisTemplate;
