import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Image as ImageIcon,
  MapPin, Check, ChevronDown, Filter, SlidersHorizontal
} from 'lucide-react';
import { IMAGE_BASE_URL } from '../../config';
import ShowroomNavbar from '../ShowroomNavbar';

const formatNumberDots = (val) => {
  if (!val) return '';
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const LeftSidebarTemplate = ({
  showroomInfo, isNeutral, isPublicMode, slug, user, theme, toggleTheme,
  setIsPromoModalOpen, promotions, finalSearchTerm, setFinalSearchTerm,
  filterType, setFilterType, showAdvanced, setShowAdvanced, filters, setFilters,
  selectedLocation, setSelectedLocation, sortBy, setSortBy, showSortDropdown,
  setShowSortDropdown, uniqueBrands, uniqueYears, hierarchicalOffices, searchableOptions,
  handlePrice, formatPrice, vehicles, loading, moreLoading, totalItems, setSelectedVehicle,
  setPage, fetchVehicles, lastElementRef
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(finalSearchTerm || '');

  // Keep local search in sync with prop changes
  useEffect(() => {
    setLocalSearch(finalSearchTerm || '');
  }, [finalSearchTerm]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setFinalSearchTerm(localSearch);
    setPage(1);
    setMobileSidebarOpen(false);
  };

  const handleSearchClear = () => {
    setLocalSearch('');
    setFinalSearchTerm('');
    setPage(1);
  };

  return (
    <div className="relative min-h-screen bg-[#fcfcfc] dark:bg-neutral-950 overflow-x-hidden text-neutral-900 dark:text-neutral-100 transition-colors duration-500 pb-12">
      <Helmet>
        <title>{showroomInfo?.title || 'Katalog'} | Premium Sidebar Store</title>
        <meta name="description" content={showroomInfo?.description || 'Temukan unit kendaraan impian Anda.'} />
      </Helmet>

      {/* Showroom Navbar (Sticky on Top) */}
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

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 mt-6">
        
        {/* Breadcrumbs Row matching Reference design */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-6 font-mono">
          <span>Home</span>
          <span>/</span>
          <span className="text-neutral-800 dark:text-neutral-200">Products</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* ========================================================
              DESKTOP LEFT SIDEBAR
             ======================================================== */}
          <aside className="hidden lg:block w-[260px] lg:w-[280px] shrink-0 space-y-8 sticky top-24 self-start bg-white dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-900/50 p-6 rounded-2xl shadow-sm">
            
            {/* Search Widget */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800/80 pb-2">
                Cari Unit
              </h3>
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Cari brand, model..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 px-3.5 pr-10 text-[11px] font-bold uppercase tracking-wide placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-900 dark:focus:border-white outline-none transition-all rounded-xl"
                />
                {localSearch ? (
                  <button 
                    type="button" 
                    onClick={handleSearchClear}
                    className="absolute right-9 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                ) : null}
                <button 
                  type="submit"
                  className="absolute right-3 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Search size={14} />
                </button>
              </form>
            </div>

            {/* Category Filter Widget */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800/80 pb-2">
                Kategori
              </h3>
              <div className="flex flex-col gap-1.5">
                {[
                  { value: '', label: 'Semua Unit' },
                  { value: 'Mobil', label: 'Mobil' },
                  { value: 'Motor', label: 'Motor' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilterType(opt.value); setPage(1); }}
                    className={`text-left text-[11px] font-bold uppercase tracking-widest py-1.5 transition-all cursor-pointer ${
                      filterType === opt.value 
                        ? 'text-neutral-900 dark:text-white font-extrabold border-l-2 border-neutral-900 dark:border-white pl-2' 
                        : 'text-neutral-450 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white hover:pl-1'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands / Vendors Filter Widget */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800/80 pb-2">
                Merk / Brand
              </h3>
              <div className="max-h-[220px] overflow-y-auto pr-1 no-scrollbar space-y-2">
                <button
                  onClick={() => { setFilters({ ...filters, brand: '' }); setPage(1); }}
                  className={`w-full text-left text-[10px] font-bold uppercase tracking-wider flex items-center justify-between py-1 transition-colors cursor-pointer ${
                    !filters.brand 
                      ? 'text-neutral-900 dark:text-white font-extrabold' 
                      : 'text-neutral-450 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white'
                  }`}
                >
                  <span>Semua Merk</span>
                  {!filters.brand && <Check size={11} />}
                </button>
                {uniqueBrands.map((b) => (
                  <button
                    key={b}
                    onClick={() => { setFilters({ ...filters, brand: b }); setPage(1); }}
                    className={`w-full text-left text-[10px] font-bold uppercase tracking-wider flex items-center justify-between py-1 transition-colors cursor-pointer ${
                      filters.brand === b 
                        ? 'text-neutral-900 dark:text-white font-extrabold' 
                        : 'text-neutral-450 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white'
                    }`}
                  >
                    <span className="truncate">{b}</span>
                    {filters.brand === b && <Check size={11} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Filter Widget */}
            {!isPublicMode && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800/80 pb-2">
                  Cabang / Lokasi
                </h3>
                <div className="max-h-[180px] overflow-y-auto pr-1 no-scrollbar space-y-2">
                  <button
                    onClick={() => { setSelectedLocation(null); setFilters({ ...filters, officeId: '' }); setPage(1); }}
                    className={`w-full text-left text-[10px] font-bold uppercase tracking-wider flex items-center justify-between py-1 transition-colors cursor-pointer ${
                      !selectedLocation && !filters.officeId
                        ? 'text-neutral-900 dark:text-white font-extrabold' 
                        : 'text-neutral-450 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white'
                    }`}
                  >
                    <span>Semua Cabang</span>
                    {!selectedLocation && !filters.officeId && <Check size={11} />}
                  </button>
                  {hierarchicalOffices.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => { setFilters({ ...filters, officeId: o.id }); setPage(1); }}
                      className={`w-full text-left text-[10px] font-bold uppercase tracking-wider flex items-center justify-between py-1 transition-colors cursor-pointer ${
                        filters.officeId == o.id 
                          ? 'text-neutral-900 dark:text-white font-extrabold' 
                          : 'text-neutral-450 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white'
                      }`}
                    >
                      <span className="truncate">{o.label}</span>
                      {filters.officeId == o.id && <Check size={11} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range Filter Widget */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800/80 pb-2">
                Range Harga
              </h3>
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={filters.minPrice ? formatNumberDots(filters.minPrice) : ''} 
                  onChange={(e) => handlePrice('minPrice', e.target.value)} 
                  placeholder="MIN (RP)" 
                  className="w-full h-9 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 px-3 text-[10px] font-bold uppercase outline-none focus:border-neutral-900 dark:focus:border-white transition-all rounded-lg placeholder:text-neutral-400" 
                />
                <input 
                  type="text" 
                  value={filters.maxPrice ? formatNumberDots(filters.maxPrice) : ''} 
                  onChange={(e) => handlePrice('maxPrice', e.target.value)} 
                  placeholder="MAX (RP)" 
                  className="w-full h-9 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 px-3 text-[10px] font-bold uppercase outline-none focus:border-neutral-900 dark:focus:border-white transition-all rounded-lg placeholder:text-neutral-400" 
                />
              </div>
            </div>

            {/* Year Filter Widget */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800/80 pb-2">
                Tahun Rilis
              </h3>
              <select 
                value={filters.year} 
                onChange={(e) => { setFilters({ ...filters, year: e.target.value }); setPage(1); }} 
                className="w-full h-9 border border-neutral-200 dark:border-neutral-800 px-2 text-[10px] font-bold tracking-wider uppercase outline-none bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 rounded-lg focus:border-neutral-900 dark:focus:border-white transition-all"
              >
                <option value="" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">Semua Tahun</option>
                {uniqueYears.map(y => <option key={y} value={y} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">{y}</option>)}
              </select>
            </div>

          </aside>

          {/* ========================================================
              RIGHT COLUMN: BANNER, TOOLBAR, PRODUCT GRID
             ======================================================== */}
          <main className="flex-1 w-full space-y-6">
            
            {/* Top Promotional Banner (Inspired by Timekeeper watch banner) */}
            <div className="relative w-full aspect-[21/9] md:aspect-[16/6] bg-neutral-900 text-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100 dark:border-neutral-900">
              {showroomInfo?.header_image ? (
                <div className="absolute inset-0">
                  <img 
                    src={`${IMAGE_BASE_URL}${showroomInfo.header_image}`} 
                    className="w-full h-full object-cover" 
                    alt="Header Banner" 
                  />
                  <div className="absolute inset-0 bg-black/40 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
                </div>
              ) : (
                <div 
                  className={`absolute inset-0 flex items-center ${
                    showroomInfo?.theme_color?.startsWith('#') ? '' :
                    showroomInfo?.theme_color === 'indigo' ? 'bg-gradient-to-br from-indigo-900 to-zinc-950' :
                    showroomInfo?.theme_color === 'purple' ? 'bg-gradient-to-br from-purple-900 to-zinc-950' :
                    showroomInfo?.theme_color === 'slate' ? 'bg-gradient-to-br from-slate-800 to-zinc-950' :
                    showroomInfo?.theme_color === 'emerald' ? 'bg-gradient-to-br from-emerald-900 to-zinc-950' :
                    showroomInfo?.theme_color === 'rose' ? 'bg-gradient-to-br from-rose-900 to-zinc-950' :
                    showroomInfo?.theme_color === 'default' ? 'bg-gradient-to-br from-neutral-800 to-neutral-950' :
                    'bg-gradient-to-br from-blue-900 to-zinc-950' // blue default
                  }`}
                  style={showroomInfo?.theme_color?.startsWith('#') ? { background: `linear-gradient(135deg, ${showroomInfo.theme_color}, #09090b)` } : {}}
                >
                  <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />
                </div>
              )}
              
              {/* Banner Text overlay */}
              <div className="relative h-full flex flex-col justify-center px-8 md:px-12 space-y-2 md:space-y-3 text-left max-w-xl z-10">
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 font-mono">
                  {showroomInfo?.layout_template === 'left-sidebar' ? 'PREMIUM COLLECTION' : 'SHOWROOM STORE'}
                </span>
                <h2 className="text-2xl md:text-4xl font-light tracking-tight leading-tight uppercase font-mono">
                  {showroomInfo?.title || 'Katalog Showroom'}
                </h2>
                <p className="text-[10px] md:text-xs text-neutral-300 font-light max-w-sm line-clamp-2">
                  {showroomInfo?.description || 'Temukan unit kendaraan impian Anda dengan layanan profesional berkualitas tinggi.'}
                </p>
                {promotions.length > 0 ? (
                  <button 
                    onClick={() => setIsPromoModalOpen(true)}
                    className="inline-flex items-center w-fit px-4 py-2 border border-white text-white hover:bg-white hover:text-neutral-950 text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-300 rounded-lg cursor-pointer mt-1"
                  >
                    PROMO HARI INI
                  </button>
                ) : null}
              </div>
            </div>

            {/* Mobile Filter Trigger Button & Toolbar Row */}
            <div className="flex items-center justify-between border-t border-b border-neutral-100 dark:border-neutral-900 py-3">
              
              {/* Left Side: Mobile Filter button & Total count */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <SlidersHorizontal size={12} />
                  <span>Filter</span>
                </button>
                <span className="text-[9px] font-black text-neutral-450 dark:text-neutral-500 uppercase tracking-widest font-mono">
                  Showing 1 - {vehicles.length} of {totalItems} units
                </span>
              </div>

              {/* Right Side: Sorting Dropdown */}
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[9px] text-neutral-400 uppercase font-black tracking-widest font-mono">Sort by :</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }} 
                  className="text-[9px] font-black bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 outline-none text-neutral-800 dark:text-neutral-200 cursor-pointer tracking-widest uppercase focus:border-neutral-900 dark:focus:border-white transition-all shadow-sm"
                >
                  {['Terbaru', 'Harga Terendah', 'Harga Tertinggi', 'Tahun Terbaru'].map(opt => (
                    <option key={opt} value={opt} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">{opt.toUpperCase()}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Product Card Grid */}
            <AnimatePresence mode="wait">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col space-y-4 animate-pulse">
                      <div className="aspect-square bg-neutral-100 dark:bg-neutral-900 rounded-2xl" />
                      <div className="space-y-2">
                        <div className="h-4 bg-neutral-100 dark:bg-neutral-900 w-3/4 rounded" />
                        <div className="h-3 bg-neutral-100 dark:bg-neutral-900 w-1/2 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : vehicles.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-neutral-900/10">
                  <ImageIcon size={32} className="mx-auto mb-3 opacity-20 text-neutral-500" strokeWidth={1.5} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Maaf, unit tidak ditemukan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {vehicles.map((v) => (
                    <article 
                      key={v.id} 
                      onClick={() => setSelectedVehicle(v)} 
                      className="group bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-900/60 hover:shadow-xl hover:border-neutral-200 dark:hover:border-neutral-800 rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between transition-all duration-300"
                    >
                      <div className="p-3">
                        {/* Studio Shot Background Block (Perfectly aligned with reference design watch boxes) */}
                        <div className="aspect-square overflow-hidden bg-neutral-200 dark:bg-neutral-800 relative flex items-center justify-center p-6 rounded-xl transition-all duration-500">
                          {v.images?.[0] ? (
                            <img 
                              src={`${IMAGE_BASE_URL}${v.images.find(img => img.is_primary)?.image_url || v.images[0].image_url}`} 
                              alt={v.model} 
                              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" 
                            />
                          ) : (
                            <div className="text-neutral-300 dark:text-neutral-700"><ImageIcon size={32} strokeWidth={1} /></div>
                          )}
                          
                          {/* Year / Tag Badge (Top Left -15% Style) */}
                          <div className="absolute top-2.5 left-2.5 bg-neutral-900/95 dark:bg-white/95 text-white dark:text-neutral-950 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md shadow-sm">
                            {v.year}
                          </div>
                        </div>

                        {/* Details Area */}
                        <div className="pt-4 px-2 space-y-1.5">
                          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 uppercase tracking-wider truncate group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
                            {v.brand} {v.model}
                          </h3>
                          
                          {/* Muted Specs Row */}
                          <div className="flex items-center gap-1.5 text-[9px] text-neutral-450 dark:text-neutral-500 uppercase tracking-wider font-semibold">
                            <span>{v.transmission}</span>
                            <span>•</span>
                            <span>{v.fuel_type || 'Bensin'}</span>
                            {v.odometer && (
                              <>
                                <span>•</span>
                                <span>{parseInt(v.odometer).toLocaleString()} KM</span>
                              </>
                            )}
                          </div>

                          {/* Divider */}
                          <div className="h-[1px] bg-neutral-100 dark:bg-neutral-800/80 my-2" />

                          {/* Price & Cart row */}
                          <div className="flex items-center justify-between gap-4 pt-1">
                            <p className="text-xs md:text-sm font-black text-neutral-900 dark:text-white tracking-tighter">
                              {formatPrice(v.price)}
                            </p>
                            
                            {/* Action Icon mimicking Cart button in watch cards */}
                            <div className="w-7 h-7 bg-neutral-100 hover:bg-neutral-900 dark:bg-neutral-800 dark:hover:bg-white text-neutral-600 hover:text-white dark:text-neutral-300 dark:hover:text-neutral-900 rounded-lg flex items-center justify-center transition-all shadow-sm">
                              <Search size={12} strokeWidth={2.5} />
                            </div>
                          </div>

                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Loading trigger element */}
            <div ref={lastElementRef} className="h-20 flex items-center justify-center">
              {moreLoading && (
                <div className="flex items-center gap-2.5 text-neutral-900 dark:text-white">
                  <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                  <span className="text-[9px] font-black tracking-widest uppercase">MEMUAT LEBIH BANYAK UNIT...</span>
                </div>
              )}
            </div>

          </main>

        </div>

      </div>

      {/* ========================================================
          MOBILE BOTTOM / COLLAPSIBLE SIDEBAR PANEL
         ======================================================== */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black z-[9999]"
            />
            {/* Slide-out Sidebar Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[280px] bg-white dark:bg-neutral-950 z-[10000] p-6 overflow-y-auto no-scrollbar space-y-6 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 pb-3">
                <h2 className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-white flex items-center gap-2">
                  <Filter size={14} /> FILTER UNIT
                </h2>
                <button 
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-500 hover:text-neutral-900 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Mobile Search Widget */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-neutral-450 uppercase tracking-widest ml-1">Cari Nama</label>
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Brand, model..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full h-10 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3.5 pr-10 text-[11px] font-bold uppercase tracking-wide rounded-xl focus:border-neutral-900 outline-none"
                  />
                  {localSearch ? (
                    <button type="button" onClick={handleSearchClear} className="absolute right-9 text-neutral-400"><X size={12} /></button>
                  ) : null}
                  <button type="submit" className="absolute right-3 text-neutral-400"><Search size={13} /></button>
                </form>
              </div>

              {/* Mobile Category Widget */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-neutral-450 uppercase tracking-widest ml-1">Kategori</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: '', label: 'Semua' },
                    { value: 'Mobil', label: 'Mobil' },
                    { value: 'Motor', label: 'Motor' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setFilterType(opt.value); setPage(1); setMobileSidebarOpen(false); }}
                      className={`h-9 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                        filterType === opt.value
                          ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:text-neutral-950 dark:border-white'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Brands Widget */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-neutral-450 uppercase tracking-widest ml-1">Brand / Merk</label>
                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1 no-scrollbar">
                  <button
                    onClick={() => { setFilters({ ...filters, brand: '' }); setPage(1); setMobileSidebarOpen(false); }}
                    className={`h-9 px-2 text-left truncate text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                      !filters.brand
                        ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                        : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Semua Merk
                  </button>
                  {uniqueBrands.map((b) => (
                    <button
                      key={b}
                      onClick={() => { setFilters({ ...filters, brand: b }); setPage(1); setMobileSidebarOpen(false); }}
                      className={`h-9 px-2 text-left truncate text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                        filters.brand === b
                          ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Location Widget */}
              {!isPublicMode && (
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-neutral-450 uppercase tracking-widest ml-1">Cabang / Lokasi</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1 no-scrollbar">
                    <button
                      onClick={() => { setSelectedLocation(null); setFilters({ ...filters, officeId: '' }); setPage(1); setMobileSidebarOpen(false); }}
                      className={`h-9 px-2 text-left truncate text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                        !selectedLocation && !filters.officeId
                          ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      Semua Cabang
                    </button>
                    {hierarchicalOffices.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => { setFilters({ ...filters, officeId: o.id }); setPage(1); setMobileSidebarOpen(false); }}
                        className={`h-9 px-2 text-left truncate text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                          filters.officeId == o.id
                            ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                            : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {o.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Price Widget */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-neutral-450 uppercase tracking-widest ml-1">Range Harga (Rp)</label>
                <div className="flex gap-2">
                  <input type="text" value={filters.minPrice ? formatNumberDots(filters.minPrice) : ''} onChange={(e) => handlePrice('minPrice', e.target.value)} placeholder="MIN" className="w-full h-10 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3 text-[10px] font-bold uppercase rounded-xl outline-none" />
                  <input type="text" value={filters.maxPrice ? formatNumberDots(filters.maxPrice) : ''} onChange={(e) => handlePrice('maxPrice', e.target.value)} placeholder="MAX" className="w-full h-10 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3 text-[10px] font-bold uppercase rounded-xl outline-none" />
                </div>
              </div>

              {/* Mobile Year Widget */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-neutral-450 uppercase tracking-widest ml-1">Tahun Rilis</label>
                <select value={filters.year} onChange={(e) => { setFilters({ ...filters, year: e.target.value }); setPage(1); setMobileSidebarOpen(false); }} className="w-full h-10 border border-neutral-200 dark:border-neutral-800 px-2 text-[10px] font-bold rounded-xl outline-none bg-neutral-50 dark:bg-neutral-900">
                  <option value="">Semua Tahun</option>
                  {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="w-full h-11 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-black text-[10px] uppercase tracking-widest rounded-xl mt-auto shadow-lg"
              >
                Tampilkan {totalItems} Unit
              </button>

            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LeftSidebarTemplate;
