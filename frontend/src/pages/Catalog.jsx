import React, { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect, memo } from 'react';
import api from '../services/api';
import {
  Search, Filter, Car, Bike, X, Image as ImageIcon,
  ChevronRight, ChevronLeft, ChevronDown, Info, CheckCircle, ShoppingCart, Sparkles, TrendingUp,
  Sun, Moon, UserCircle, LogOut, MapPin, MessageCircle, Phone, ExternalLink,
  Globe, Tag, Building2, Calendar, Maximize2, ArrowUpRight, Heart
} from 'lucide-react';
import { encryptId } from '../utils/crypto';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, NavLink, useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { IMAGE_BASE_URL } from '../config';
import ShowroomNavbar from '../components/ShowroomNavbar';
import ClassicTemplate from '../components/catalog-templates/ClassicTemplate';
import MinimalistTemplate from '../components/catalog-templates/MinimalistTemplate';
import MinimalistLuxuryTemplate from '../components/catalog-templates/MinimalistLuxuryTemplate';
import LeftSidebarTemplate from '../components/catalog-templates/LeftSidebarTemplate';

// ----------------------------------------------------------------------
// 1. UTILITY HOOKS
// ----------------------------------------------------------------------
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const FILTER_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'Mobil', label: 'Mobil' },
  { value: 'Motor', label: 'Motor' },
];

// Isolated Location Selector Component to prevent Catalog re-renders on every keystroke
const LocationSelector = React.memo(({ selectedLocation, onSelectLocation }) => {
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
        const res = await api.get('/locations', { params: { search: locationSearch } });
        const formatted = res.data.map(loc => {
          const parent = res.data.find(p => p.id === loc.parent_id);
          const grandParent = parent ? res.data.find(gp => gp.id === parent.parent_id) : null;
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
});

// Isolated Search Input Component to prevent Catalog re-renders on every keystroke
const SearchInput = React.memo(({ onSearch, allSuggestions, initialValue }) => {
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 px-1 py-1"
          >
            {filteredSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => { setLocalSearch(s); onSearch(s); setShowSuggestions(false); }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors flex items-center justify-between group"
              >
                <span>{s}</span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {localSearch && (
          <button 
            onClick={() => { setLocalSearch(''); onSearch(''); setShowSuggestions(false); }}
            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        )}
        <button
          onClick={handleManualSearch}
          className="w-7 h-7 md:w-8 md:h-8 bg-gray-900 dark:bg-white text-white dark:text-gray-950 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          <Search size={12} className="md:w-[14px] md:h-[14px]" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
});

// ----------------------------------------------------------------------
// 3. MAIN COMPONENT
// ----------------------------------------------------------------------

const Catalog = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, loading: authLoading } = useAuth();
  const { slug: pathSlug } = useParams();
  
  // Subdomain Readiness Logic
  const getActiveSlug = () => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
      return pathSlug;
    }
    const parts = host.split('.');
    if (parts.length >= 3) return parts[0];
    return pathSlug;
  };

  const slug = getActiveSlug();
  const isPublicMode = !!slug;
  const [showroomInfo, setShowroomInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(isPublicMode);
  const [publicOffices, setPublicOffices] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Data States
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [finalSearchTerm, setFinalSearchTerm] = useState(() => new URLSearchParams(window.location.search).get('search') || '');
  const [filterType, setFilterType] = useState(() => new URLSearchParams(window.location.search).get('type') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500000000 });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({ brand: '', year: '', minPrice: '', maxPrice: '', officeId: '' });
  const [sortBy, setSortBy] = useState('Terbaru');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Meta States
  const [filterOptions, setFilterOptions] = useState({ brands: [], years: [] });
  const [masterBrands, setMasterBrands] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Handle Query Parameters from Landing Page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search') || '';
    const type = params.get('type') || '';
    setFinalSearchTerm(search);
    setFilterType(type);
  }, [location.search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [finalSearchTerm, filterType, filters, selectedLocation]);

  // Interaction States
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactAgents, setContactAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  // Promotions State
  const [promotions, setPromotions] = useState([]);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);

  // Infinite Scroll Observer
  const observer = useRef();
  const lastElementRef = useCallback(node => {
    if (loading || moreLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && page < totalPages) setPage(prev => prev + 1);
    }, { rootMargin: '100px' });
    if (node) observer.current.observe(node);
  }, [loading, moreLoading, page, totalPages]);

  // Pill Animation
  const filterContainerRef = useRef(null);
  const filterButtonRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const thumbRef = useRef(null);
  const scrollThumbs = (dir) => {
    if (thumbRef.current) {
      thumbRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  const updatePillPosition = useCallback(() => {
    const btn = filterButtonRefs.current[filterType || ''];
    const container = filterContainerRef.current;
    if (btn && container) {
      const cRect = container.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      setPillStyle({ left: bRect.left - cRect.left, width: bRect.width });
    }
  }, [filterType]);
  
  useLayoutEffect(() => { 
    updatePillPosition(); 
  }, [filterType, updatePillPosition, loading, infoLoading, showroomInfo]);

  // Extra safety update after mount and short delay
  useEffect(() => {
    updatePillPosition();
    const timer = setTimeout(updatePillPosition, 100);
    const timer2 = setTimeout(updatePillPosition, 500);
    return () => { clearTimeout(timer); clearTimeout(timer2); };
  }, [updatePillPosition]);

  useEffect(() => {
    const fetchPublicOffices = async () => {
      if (!isPublicMode) return;
      try {
        const res = await api.get(`/public/offices/${slug}`);
        setPublicOffices(res.data);
      } catch (err) { console.error(err); }
    };
    fetchPublicOffices();
  }, [isPublicMode, slug]);

  const fetchInit = useCallback(async () => {
    try {
      if (isPublicMode) {
        const [opt, brd] = await Promise.all([
          api.get(`/public/filter-options/${slug}`),
          api.get('/public/brands')
        ]);
        setFilterOptions(opt.data);
        setMasterBrands(brd.data);
        return;
      }

      const [opt, off, brd] = await Promise.all([
        api.get('/vehicles/filter-options'), 
        api.get('/offices'),
        api.get('/vehicles/brands')
      ]);
      
      setFilterOptions(opt.data);
      setOffices(off.data);
      
      const brandsData = Array.isArray(brd.data) ? brd.data : (brd.data.items || []);
      setMasterBrands(brandsData);
      
    } catch (err) { 
      console.error('Catalog Init Error:', err); 
    }
  }, [isPublicMode, slug]);

  useEffect(() => {
    fetchInit();
    
    const handleFocus = () => fetchInit();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchInit]);

  // Fetch Promotions
  const fetchPromotions = useCallback(async () => {
    try {
      setPromoLoading(true);
      if (isPublicMode) {
        const res = await api.get(`/public/promotions/${slug}`);
        setPromotions(res.data);
      } else {
        const res = await api.get('/promotions', {
          params: {
            status: 'true',
            office_id: filters.officeId || selectedLocation?.office_id || ''
          }
        });
        setPromotions(res.data);
      }
    } catch (err) {
      console.error('Error fetching promotions:', err);
    } finally {
      setPromoLoading(false);
    }
  }, [isPublicMode, slug, filters.officeId, selectedLocation]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  // 2. Fetch Showroom Info (Public Only)
  useEffect(() => {
    if (!isPublicMode) return;
    const fetchShowroomInfo = async () => {
      setInfoLoading(true);
      setNotFound(false);
      try {
        const res = await api.get(`/public/showroom/${slug}`);
        setShowroomInfo(res.data);
      } catch (err) {
        console.error('Error fetching showroom info:', err);
        if (err.response?.status === 404) {
          setNotFound(true);
        }
      } finally {
        setInfoLoading(false);
      }
    };
    fetchShowroomInfo();
  }, [isPublicMode, slug]);

  // Main Fetch Logic
  const fetchVehicles = useCallback(async () => {
    const isFirstPage = page === 1;
    if (isFirstPage) setLoading(true); else setMoreLoading(true);
    try {
      const endpoint = isPublicMode ? `/public/vehicles/${slug}` : '/vehicles';
      const res = await api.get(endpoint, {
        params: {
          status: 'Available', page, size: 15,
          search: finalSearchTerm, type: filterType,
          brand: filters.brand, year: filters.year,
          minPrice: filters.minPrice, maxPrice: filters.maxPrice,
          locationId: selectedLocation?.id, officeId: filters.officeId,
          sort: sortBy
        }
      });
      if (isFirstPage) setVehicles(res.data.items);
      else setVehicles(prev => {
        const ids = new Set(prev.map(v => v.id));
        return [...prev, ...res.data.items.filter(v => !ids.has(v.id))];
      });
      setTotalPages(res.data.totalPages);
      setTotalItems(res.data.totalItems);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setMoreLoading(false); }
  }, [isPublicMode, slug, page, finalSearchTerm, filterType, filters, selectedLocation, sortBy]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  // Memos
  const uniqueBrands = useMemo(() => {
    if (!masterBrands || masterBrands.length === 0) return filterOptions.brands;
    return masterBrands
      .filter(b => {
        if (filterType === 'Mobil') return b.for_car;
        if (filterType === 'Motor') return b.for_motorcycle;
        return true;
      })
      .map(b => b.name)
      .sort((a, b) => a.localeCompare(b));
  }, [masterBrands, filterType, filterOptions.brands]);
  const uniqueYears = useMemo(() => filterOptions.years, [filterOptions.years]);
  const hierarchicalOffices = useMemo(() => {
    const source = isPublicMode ? publicOffices : offices;
    if (!source || source.length === 0) return [];

    const result = [];
    // HO typically has type HEAD_OFFICE or no parent_id
    const heads = source.filter(o => o.type === 'HEAD_OFFICE' || !o.parent_id);
    
    heads.forEach(h => {
      result.push({ ...h, label: h.name });
      source.filter(o => o.parent_id === h.id).forEach(b => {
        result.push({ ...b, label: `\u00A0\u00A0\u00A0└── ${b.name}` });
      });
    });

    // Fallback for public mode if hierarchy logic fails
    if (isPublicMode && result.length === 0 && source.length > 0) {
      return source.map(o => ({ ...o, label: o.name }));
    }

    return result;
  }, [offices, publicOffices, isPublicMode]);
  const searchableOptions = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];
    return [...new Set([...vehicles.map(v => v.brand), ...vehicles.map(v => v.model)])];
  }, [vehicles]);

  // Handlers
  const handleLogout = () => { logout(); navigate('/login'); };
  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p || 0);
  const formatNumberDots = (val) => (!val && val !== 0) ? '' : parseInt(val).toLocaleString('id-ID');
  const parseNum = (str) => str.replace(/\./g, '').replace(/,/g, '');

  // Utility to strip HTML tags for previews
  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  };

  const handleContact = async (officeId) => {
    setShowContactModal(true); setAgentsLoading(true);
    try {
      const res = await api.get('/sales-agents/active', { params: { officeId } });
      setContactAgents(res.data);
    } catch (err) { console.error(err); }
    finally { setAgentsLoading(false); }
  };

  const openWA = (phone, model) => {
    if (!phone) return alert('No phone available');
    const msg = encodeURIComponent(`Halo, saya tertarik dengan unit ${model}. Bisa dibantu informasinya?`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  const handlePrice = (key, val) => {
    const raw = parseNum(val);
    if (raw === '' || /^\d+$/.test(raw)) { setFilters({ ...filters, [key]: raw }); setPage(1); }
  };

  const isNeutral = !isPublicMode || (showroomInfo && showroomInfo.theme_color === 'default' && !showroomInfo.header_image);

  if (infoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#0a0b0f]">
        <div className="w-10 h-10 border-4 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#0a0b0f] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-8">
          <Globe size={40} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">
          Katalog Tidak Tersedia
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md text-sm leading-relaxed mb-10">
          Maaf, halaman katalog yang Anda cari tidak ditemukan atau saat ini sedang tidak dipublikasi oleh pemilik showroom.
        </p>
        <button
          onClick={() => navigate('/')}
          className="h-12 px-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-900/20 dark:shadow-white/5"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const templateProps = {
    showroomInfo, isNeutral, isPublicMode, slug, user, theme, toggleTheme,
    setIsPromoModalOpen, promotions, finalSearchTerm, setFinalSearchTerm,
    filterType, setFilterType, showAdvanced, setShowAdvanced, filters, setFilters,
    selectedLocation, setSelectedLocation, sortBy, setSortBy, showSortDropdown,
    setShowSortDropdown, uniqueBrands, uniqueYears, hierarchicalOffices, searchableOptions,
    handlePrice, formatPrice, vehicles, loading, moreLoading, totalItems, setSelectedVehicle: (v) => { setSelectedVehicle(v); setActiveImageIndex(0); },
    setPage, fetchVehicles, lastElementRef
  };

  return (
    <>
      {showroomInfo?.layout_template === 'left-sidebar' ? (
        <LeftSidebarTemplate {...templateProps} />
      ) : showroomInfo?.layout_template === 'metropolis' ? (
        <MinimalistLuxuryTemplate {...templateProps} />
      ) : showroomInfo?.layout_template === 'minimalist' ? (
        <MinimalistTemplate {...templateProps} />
      ) : (
        <ClassicTemplate {...templateProps} />
      )}

        {/* MODALS */}
        <AnimatePresence>
          {selectedVehicle && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedVehicle(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-6xl bg-white dark:bg-[#0a0b0f] rounded-[24px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-white/10 flex flex-col lg:flex-row h-[90vh] lg:h-[85vh]"
              >
                <div className="w-full lg:w-[60%] h-[35vh] lg:h-full relative bg-gray-100 dark:bg-gray-950 flex items-center justify-center overflow-hidden border-r border-gray-200 dark:border-white/5 shrink-0">
                  {selectedVehicle.images?.[activeImageIndex] ? (
                    <>
                      {/* Cinematic Blurred Backdrop */}
                      <img
                        src={`${IMAGE_BASE_URL}${selectedVehicle.images[activeImageIndex].image_url}`}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 scale-125"
                      />
                      {/* Main Full Image (No Cropping) */}
                      <img
                        src={`${IMAGE_BASE_URL}${selectedVehicle.images[activeImageIndex].image_url}`}
                        alt={selectedVehicle.model}
                        className="relative z-10 w-full h-full object-contain p-4 lg:p-8"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-800"><ImageIcon size={100} /></div>
                  )}

                  {/* Navigation Thumbnails */}
                  {selectedVehicle.images?.length > 1 && (
                    <div className="absolute bottom-4 lg:bottom-8 left-0 right-0 px-6 z-20 flex justify-center group/thumbs">
                      <div className="relative max-w-full">
                        {/* Scroll Arrows */}
                        <button 
                          onClick={() => scrollThumbs('left')}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white opacity-100 lg:opacity-0 lg:group-hover/thumbs:opacity-100 transition-all z-40 hover:scale-110 active:scale-95 shadow-lg"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button 
                          onClick={() => scrollThumbs('right')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white opacity-100 lg:opacity-0 lg:group-hover/thumbs:opacity-100 transition-all z-40 hover:scale-110 active:scale-95 shadow-lg"
                        >
                          <ChevronRight size={16} />
                        </button>

                        <div 
                          ref={thumbRef}
                          className="flex gap-2 lg:gap-3 p-1.5 lg:p-2.5 bg-black/40 backdrop-blur-2xl rounded-[20px] lg:rounded-[28px] border border-white/10 shadow-2xl overflow-x-auto no-scrollbar scroll-smooth"
                        >
                          {selectedVehicle.images.map((img, idx) => (
                            <button
                               key={idx}
                               onClick={() => setActiveImageIndex(idx)}
                               className={`w-10 h-10 lg:w-16 lg:h-16 rounded-[12px] lg:rounded-[20px] overflow-hidden border-2 transition-all shrink-0 ${activeImageIndex === idx ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'}`}
                            >
                              <img src={`${IMAGE_BASE_URL}${img.image_url}`} className="w-full h-full object-cover" alt="" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                <div className="w-full lg:w-[40%] p-6 lg:p-8 flex flex-col overflow-hidden bg-[#f8fafc] dark:bg-[#0a0b0f]">
                  {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pt-16">
                    <div className="mb-6 bg-white dark:bg-white/[0.03] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em]">{selectedVehicle.brand} • {selectedVehicle.year}</p>
                        <span className="text-[10px] font-black text-gray-900 dark:text-gray-400 uppercase tracking-widest bg-gray-900/5 px-2 py-0.5 rounded-md border border-gray-900/10">{selectedVehicle.unit_code}</span>
                      </div>
                      <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4 leading-tight">{selectedVehicle.model}</h2>
                      <div className="text-2xl font-black text-gray-900 dark:text-gray-400 font-mono tracking-tighter">{formatPrice(selectedVehicle.price)}</div>
                    </div>

                    {/* Unified Vehicle Info Box */}
                    <div className="p-4 lg:p-5 bg-white dark:bg-white/5 rounded-[20px] lg:rounded-[24px] border border-gray-200 dark:border-white/5 mb-4 lg:mb-6 shadow-sm">
                      {/* Compact Specs Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-4 lg:gap-4 mb-4 lg:mb-5">
                        {[
                          { label: 'Odometer', val: `${parseInt(selectedVehicle.odometer || 0).toLocaleString()} KM` },
                          { label: 'Transmisi', val: selectedVehicle.transmission || '-' },
                          { label: 'Bahan Bakar', val: selectedVehicle.fuel_type || '-' },
                          { label: 'Warna', val: selectedVehicle.color || '-' }
                        ].map((spec, i) => (
                          <div key={i}>
                            <p className="text-[7px] lg:text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5 lg:mb-1">{spec.label}</p>
                            <p className="text-[10px] lg:text-[11px] font-bold text-gray-900 dark:text-white uppercase truncate">{spec.val}</p>
                          </div>
                        ))}
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gray-100 dark:bg-white/10 mb-4 lg:mb-5" />

                      {/* Location Info */}
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-gray-900 text-white flex items-center justify-center shrink-0 shadow-lg shadow-gray-900/20"> <MapPin size={16} className="lg:w-[18px] lg:h-[18px]" /> </div>
                        <div className="min-w-0">
                          <p className="text-[7px] lg:text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Lokasi</p>
                          <p className="text-xs lg:text-sm font-bold text-gray-900 dark:text-white truncate">{selectedVehicle.Office?.name}</p>
                          <p className="text-[9px] lg:text-[10px] text-gray-500 dark:text-gray-400 truncate">{selectedVehicle.Office?.location?.name || selectedVehicle.Office?.address}</p>
                        </div>
                      </div>
                    </div>

                      {(selectedVehicle.description || selectedVehicle.notes || selectedVehicle.note) && (
                        <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[24px] border border-gray-100 dark:border-white/10">
                          <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Info size={12} /> Deskripsi Unit
                          </p>
                          <p className="text-[12px] text-gray-600 dark:text-gray-300 italic leading-relaxed"> "{selectedVehicle.description || selectedVehicle.notes || selectedVehicle.note}" </p>
                        </div>
                      )}
                    </div>

                  {/* Fixed Footer with Contact Button */}
                  <div className="pt-2 lg:pt-4 pb-4 lg:pb-6 mt-auto border-t border-gray-100 dark:border-white/10">
                    <button
                      onClick={() => handleContact(selectedVehicle.office_id)}
                      className="w-full h-12 lg:h-14 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-gray-100 transition-all rounded-xl lg:rounded-[20px] font-black text-sm flex items-center justify-center gap-3 active:scale-95 shadow-2xl uppercase tracking-widest"
                    >
                      <MessageCircle size={20} /> <span>Hubungi Sales</span>
                    </button>
                  </div>
                </div>
                {/* Actions Header (Close & Maximize) */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-[70]">
                  <button
                    onClick={() => {
                      const encId = encryptId(selectedVehicle.id);
                      navigate(`/product/${encId}`);
                    }}
                    className="w-8 h-8 lg:w-9 lg:h-9 bg-black/40 hover:bg-black dark:hover:bg-white dark:hover:text-black backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white transition-all shadow-xl group"
                    title="Buka detail lengkap"
                  >
                    <Maximize2 size={14} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => setSelectedVehicle(null)}
                    className="w-8 h-8 lg:w-9 lg:h-9 bg-black/40 hover:bg-red-500 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white transition-all shadow-xl group"
                  >
                    <X size={18} className="group-hover:rotate-90 transition-transform" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showContactModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowContactModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white dark:bg-[#12141c] rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/10">
                <div className="p-8 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Pilih Sales</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Agent resmi cabang terkait</p>
                  </div>
                  <button onClick={() => setShowContactModal(false)} className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400"> <X size={24} /> </button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto no-scrollbar space-y-3">
                  {agentsLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
                      <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                      <p className="text-xs font-bold uppercase tracking-widest">Mencari Agent...</p>
                    </div>
                  ) : contactAgents.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 px-10"> <p className="text-sm font-bold uppercase tracking-widest">Tidak ada agen aktif</p> </div>
                  ) : (
                    contactAgents.map(agent => (
                      <div key={agent.id} className="group p-5 bg-gray-50 dark:bg-white/5 rounded-[30px] border border-transparent hover:border-gray-900/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-800 overflow-hidden shrink-0 shadow-md">
                            {agent.avatar ? <img src={`${IMAGE_BASE_URL}${agent.avatar}`} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">{agent.name.charAt(0)}</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-black text-gray-900 dark:text-white truncate uppercase">{agent.name}</p>
                            <p className="text-[9px] text-gray-900 font-black uppercase tracking-widest">{agent.sales_code || 'Official Agent'}</p>
                          </div>
                        </div>
                        <button onClick={() => openWA(agent.phone, selectedVehicle?.model)} className="w-full h-12 mt-5 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                          <Phone size={14} fill="currentColor" /> Chat via WhatsApp
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-8 bg-gray-50 dark:bg-black/20 text-center"> <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">Hubungi agent resmi kami untuk transaksi aman.</p> </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* PROMOTIONS MODAL */}
        <AnimatePresence>
          {isPromoModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setIsPromoModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-5xl max-h-[85vh] bg-white dark:bg-[#12141c] rounded-[40px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-white/10 flex flex-col"
              >
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-900/10 rounded-2xl flex items-center justify-center text-gray-900">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Penawaran Eksklusif</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Dapatkan unit impian dengan promo terbaik</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsPromoModalOpen(false)}
                    className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="p-8 overflow-y-auto no-scrollbar">
                  {promoLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[1,2].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-white/5 rounded-[32px] animate-pulse" />)}
                    </div>
                  ) : promotions.length === 0 ? (
                    <div className="text-center py-20">
                      <ImageIcon size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Belum ada promo tersedia untuk lokasi ini</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {promotions.map((promo) => (
                        <motion.div 
                          key={promo.id}
                          onClick={() => window.open(`/promotion/${promo.id}`, '_blank')}
                          className="group relative bg-gray-50 dark:bg-white/5 rounded-[32px] overflow-hidden border border-gray-100 dark:border-white/5 hover:shadow-2xl transition-all duration-500 cursor-pointer"
                        >
                          <div className="aspect-[16/9] overflow-hidden relative">
                            <img 
                              src={IMAGE_BASE_URL + promo.image_path} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                              alt={promo.title}
                            />
                            <div className="absolute top-4 left-4">
                              <span className="h-6 px-3 bg-gray-900 text-white text-[9px] font-black uppercase flex items-center rounded-full shadow-lg">
                                {promo.placement}
                              </span>
                            </div>
                          </div>
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-[10px] font-bold">
                                {promo.office_id === null ? (
                                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                    <Globe size={12} /> Nasional
                                  </span>
                                ) : promo.is_all_branches ? (
                                  <span className="text-gray-900 dark:text-gray-400 flex items-center gap-1.5">
                                    <Building2 size={12} /> {promo.Office?.name} (Regional)
                                  </span>
                                ) : (
                                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <MapPin size={12} /> {promo.Office?.name}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                                <Calendar size={12} />
                                Hingga {new Date(promo.end_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">{promo.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-6 italic">"{stripHtml(promo.description) || 'Syarat dan ketentuan berlaku'}"</p>
                            
                            <div className="w-full h-11 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-gray-900 group-hover:text-white transition-all shadow-xl">
                              <Sparkles size={14} /> Lihat Detail Promo
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </>
  );
};

export default Catalog;
