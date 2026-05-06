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

  return (
    <div className={`relative min-h-screen bg-gray-100 dark:bg-[#0a0b0f] ${mounted ? 'transition-colors duration-500' : ''} overflow-x-hidden overflow-y-scroll pb-10`}>
      <Helmet>
        <title>{showroomInfo?.title || 'Katalog Showroom'} | Bursa Mobil</title>
        <meta name="description" content={showroomInfo?.description || 'Temukan unit impian Anda dengan standar kualitas terbaik.'} />
        {/* Open Graph Tags */}
        <meta property="og:title" content={showroomInfo?.title || 'Katalog Showroom'} />
        <meta property="og:description" content={showroomInfo?.description || 'Temukan unit impian Anda.'} />
        <meta property="og:type" content="website" />
      </Helmet>
      <div 
        className={`relative z-0 w-full overflow-hidden transition-all duration-700 ${
          infoLoading ? 'h-[120px] md:h-[200px]' :
          finalSearchTerm ? 'h-[180px] md:h-[240px]' : // Shorter height during search
          isNeutral ? 'bg-transparent pb-4 md:pb-6' : 
          `${
            showroomInfo?.theme_color?.startsWith('#') ? '' :
            showroomInfo?.theme_color === 'indigo' ? 'bg-indigo-900' :
            showroomInfo?.theme_color === 'purple' ? 'bg-purple-900' :
            showroomInfo?.theme_color === 'slate' ? 'bg-slate-900' :
            showroomInfo?.theme_color === 'emerald' ? 'bg-emerald-900' :
            showroomInfo?.theme_color === 'rose' ? 'bg-rose-900' : 'bg-blue-900'
          }`
        }`}
        style={!infoLoading && !isNeutral && showroomInfo?.theme_color?.startsWith('#') ? { backgroundColor: showroomInfo.theme_color } : {}}
      >
        {/* Content Wrapper with Fade */}
        <div className={`transition-opacity duration-500 ${infoLoading ? 'opacity-0' : 'opacity-100'}`}>
          {!infoLoading && (
            <>
              {/* Dynamic Background */}
                {!isNeutral && (
                  <div className="absolute inset-0 z-0">
                    {showroomInfo?.header_image ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={`${IMAGE_BASE_URL}${showroomInfo.header_image}`} 
                          className={`w-full h-full object-cover transition-all duration-1000 ${finalSearchTerm ? 'blur-md scale-110' : ''}`} 
                          alt="Header" 
                        />
                        {/* Color Tone Overlay - Only if not default */}
                        {showroomInfo?.theme_color && showroomInfo?.theme_color !== 'default' ? (
                          <div className={`absolute inset-0 mix-blend-multiply ${
                            showroomInfo?.theme_color?.startsWith('#') ? '' : showroomInfo?.theme_color === 'indigo' ? 'bg-indigo-950/70' :
                            showroomInfo?.theme_color === 'purple' ? 'bg-purple-950/70' :
                            showroomInfo?.theme_color === 'slate' ? 'bg-slate-950/70' :
                            showroomInfo?.theme_color === 'emerald' ? 'bg-emerald-950/70' :
                            showroomInfo?.theme_color === 'rose' ? 'bg-rose-950/70' : 'bg-blue-950/70'
                          }`} style={showroomInfo?.theme_color?.startsWith('#') ? { background: `linear-gradient(135deg, ${showroomInfo.theme_color}, ${showroomInfo.theme_color}dd)` } : {}}></div>
                        ) : (
                          // Subtle dark overlay to ensure text is readable even without tone color
                          <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/60 to-transparent" style={showroomInfo?.theme_color?.startsWith('#') ? { backgroundColor: `${showroomInfo.theme_color}b3` } : {}}></div>
                        )}
                        
                        {/* Search Mode Extra Overlay */}
                        {finalSearchTerm && <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm transition-all duration-500" />}
                      </div>
                    ) : (
                      <div className={`absolute inset-0 opacity-90 bg-gradient-to-br transition-all duration-500 ${finalSearchTerm ? 'blur-xl scale-110' : ''} ${
                        showroomInfo?.theme_color?.startsWith('#') ? '' : showroomInfo?.theme_color === 'indigo' ? 'from-[#1e1b4b] via-[#3730a3] to-[#6366f1]' :
                        showroomInfo?.theme_color === 'purple' ? 'from-[#3b0764] via-[#6b21a8] to-[#a855f7]' :
                        showroomInfo?.theme_color === 'slate' ? 'from-[#0f172a] via-[#334155] to-[#64748b]' :
                        showroomInfo?.theme_color === 'emerald' ? 'from-[#022c22] via-[#047857] to-[#10b981]' :
                        showroomInfo?.theme_color === 'rose' ? 'from-[#4c0519] via-[#be123c] to-[#f43f5e]' :
                        'from-[#0f172a] via-[#1e3a8a] to-[#3b82f6]'
                      }`} style={showroomInfo?.theme_color?.startsWith('#') ? { background: `linear-gradient(135deg, ${showroomInfo.theme_color}, ${showroomInfo.theme_color}dd)` } : {}}></div>
                    )}
                    {/* Massive Elegant Bottom Fade Gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-gray-100 dark:from-[#0a0b0f] via-gray-100/40 dark:via-[#0a0b0f]/40 to-transparent z-[1]" />
                </div>
              )}
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

        {/* Header Content - Hidden during search for focus */}
        <AnimatePresence>
          {!finalSearchTerm && (
            <motion.header 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className={`relative z-10 flex flex-col gap-5 pt-10 md:pt-20 ${isNeutral ? 'pb-24' : 'pb-36'} px-5 md:px-10 lg:px-14 items-center text-center max-w-7xl mx-auto animate-in fade-in duration-700`}
            >
              <h1 className={`text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] ${isNeutral ? 'text-gray-900 dark:text-white' : 'text-white'}`}>
                {showroomInfo?.title || 'Katalog Showroom'}
              </h1>
              <p className={`text-lg md:text-xl font-medium tracking-wide max-w-3xl leading-relaxed ${isNeutral ? 'text-gray-600 dark:text-gray-400' : 'text-white/80'}`}>
                {showroomInfo?.description || 'Temukan unit impian Anda dengan standar kualitas terbaik dan proses yang transparan.'}
                {promotions.length > 0 && (
                  <button 
                    onClick={() => setIsPromoModalOpen(true)}
                    className={`inline-flex items-center gap-1.5 ml-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                      isNeutral 
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-lg shadow-gray-900/20 dark:shadow-white/5' 
                        : 'bg-white text-gray-950 hover:bg-gray-100 shadow-xl shadow-black/20'
                    }`}
                  >
                    <Sparkles size={12} /> Lihat Promo
                  </button>
                )}
              </p>
            </motion.header>
          )}
        </AnimatePresence>
          </>
        )}
      </div>
    </div>

      {/* CATALOG CONTENT (Constrained) */}
      <div className={`relative z-10 w-full max-w-7xl mx-auto px-5 md:px-10 lg:px-14 ${finalSearchTerm ? 'pt-2 space-y-8' : 'space-y-12'}`}>
        <div className={`sticky ${finalSearchTerm ? 'top-1 md:top-2 -mt-24 md:-mt-32' : 'top-4 md:top-8 -mt-10 md:-mt-12'} z-40 transition-all duration-300`}>
          <div className="relative z-10 bg-white/95 dark:bg-[#12141c]/95 border border-gray-200 dark:border-white/10 p-2 md:p-2.5 rounded-[32px] md:rounded-[36px] shadow-2xl transition-all backdrop-blur-md">
            <div className="flex flex-wrap md:flex-nowrap items-center gap-x-2 gap-y-2">
              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 flex-1 w-full">
                {!isPublicMode && (
                  <LocationSelector selectedLocation={selectedLocation} onSelectLocation={(loc) => { setSelectedLocation(loc); setPage(1); }} />
                )}
                
                <SearchInput
                  onSearch={(val) => { setFinalSearchTerm(val); setPage(1); }}
                  allSuggestions={searchableOptions}
                  initialValue={finalSearchTerm}
                />
              </div>

              <div className="flex items-center justify-between gap-2 w-full md:w-auto mt-0.5 md:mt-0">
                <div ref={filterContainerRef} className="relative flex-1 md:flex-none flex items-center gap-1 p-1 bg-gray-100 dark:bg-black/20 rounded-full overflow-x-auto no-scrollbar">
                  <motion.div className="absolute top-1 bottom-1 rounded-full bg-gray-900 dark:bg-white shadow-xl z-0" animate={{ left: pillStyle.left, width: pillStyle.width }} transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
                  {FILTER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      ref={el => filterButtonRefs.current[opt.value] = el}
                      onClick={() => { setFilterType(opt.value); setPage(1); }}
                      className={`relative z-10 whitespace-nowrap h-9 rounded-full text-[11px] font-bold transition-colors duration-200 flex items-center justify-center gap-2 ${!opt.value ? 'px-6 flex-1 md:flex-none' : 'w-11 md:w-12 flex-shrink-0'} ${filterType === opt.value ? 'text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                      {opt.value === 'Mobil' && <Car size={16} />}
                      {opt.value === 'Motor' && <Bike size={18} />}
                      {!opt.value && opt.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`h-9 w-[80px] md:w-auto px-0 md:px-6 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${showAdvanced ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                >
                  <Filter size={14} /> <span className="md:hidden">Filter</span>
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
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden bg-white/80 dark:bg-[#12141c]/80 backdrop-blur-xl rounded-b-[40px] border-x border-b border-gray-200 dark:border-white/5 shadow-2xl relative z-0"
              >
                <div className="pt-10 pb-6 px-8">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                  <div className="md:col-span-3 relative">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block px-1">Merk / Brand</label>
                    <div className="relative">
                      <select 
                        value={filters.brand} 
                        onChange={(e) => { setFilters({ ...filters, brand: e.target.value }); setPage(1); }} 
                        className="w-full h-11 bg-gray-100 dark:bg-[#1a1c26] border-none rounded-2xl px-4 text-xs font-bold text-gray-900 dark:text-white outline-none ring-1 ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-gray-900 transition-all appearance-none cursor-pointer [&>option]:dark:bg-[#1a1c26] [&>option]:dark:text-white"
                      >
                        <option value="" className="dark:bg-[#1a1c26]">Semua Merk</option>
                        {uniqueBrands.map(b => <option key={b} value={b} className="dark:bg-[#1a1c26]">{b}</option>)}
                      </select>
                      <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block px-1">Tahun</label>
                    <div className="relative">
                      <select 
                        value={filters.year} 
                        onChange={(e) => { setFilters({ ...filters, year: e.target.value }); setPage(1); }} 
                        className="w-full h-11 bg-gray-100 dark:bg-[#1a1c26] border-none rounded-2xl px-4 text-xs font-bold text-gray-900 dark:text-white outline-none ring-1 ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-gray-900 transition-all appearance-none cursor-pointer [&>option]:dark:bg-[#1a1c26] [&>option]:dark:text-white"
                      >
                        <option value="" className="dark:bg-[#1a1c26]">Semua Tahun</option>
                        {uniqueYears.map(y => <option key={y} value={y} className="dark:bg-[#1a1c26]">{y}</option>)}
                      </select>
                      <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block px-1">Kantor Cabang</label>
                    <div className="relative">
                      <select 
                        value={filters.officeId} 
                        onChange={(e) => { setFilters({ ...filters, officeId: e.target.value }); setPage(1); }} 
                        className="w-full h-11 bg-gray-100 dark:bg-[#1a1c26] border-none rounded-2xl px-4 text-xs font-bold text-gray-900 dark:text-white outline-none ring-1 ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-gray-900 transition-all appearance-none cursor-pointer [&>option]:dark:bg-[#1a1c26] [&>option]:dark:text-white"
                      >
                        <option value="" className="dark:bg-[#1a1c26]">Semua Cabang</option>
                        {hierarchicalOffices.map(o => (
                          <option key={o.id} value={o.id} className={`dark:bg-[#1a1c26] ${o.type === 'HEAD_OFFICE' ? 'font-bold' : ''}`}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <div className="flex justify-between items-center mb-2 px-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Range Harga</label>
                      <span className="text-[10px] font-bold text-gray-900">{filters.minPrice ? formatPrice(filters.minPrice) : 'Rp 0'} - {filters.maxPrice ? formatPrice(filters.maxPrice) : '∞'}</span>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">MIN</span>
                        <input 
                          type="text" 
                          value={filters.minPrice ? formatNumberDots(filters.minPrice) : ''} 
                          onChange={(e) => handlePrice('minPrice', e.target.value)} 
                          placeholder="0" 
                          className="w-full h-11 bg-gray-100 dark:bg-white/5 border-none rounded-2xl pl-10 pr-3 text-[11px] font-bold text-gray-900 dark:text-white outline-none ring-1 ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-gray-900" 
                        />
                      </div>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">MAX</span>
                        <input 
                          type="text" 
                          value={filters.maxPrice ? formatNumberDots(filters.maxPrice) : ''} 
                          onChange={(e) => handlePrice('maxPrice', e.target.value)} 
                          placeholder="Max" 
                          className="w-full h-11 bg-gray-100 dark:bg-white/5 border-none rounded-2xl pl-10 pr-3 text-[11px] font-bold text-gray-900 dark:text-white outline-none ring-1 ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-gray-900" 
                        />
                      </div>
                    </div>
                    {/* Visual Slider */}
                    <div className="relative h-6 flex items-center px-2">
                      <div className="absolute left-2 right-2 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full bg-gray-900"
                          style={{ 
                            left: `${(filters.minPrice / 500000000) * 100}%`, 
                            right: `${100 - (filters.maxPrice / 500000000) * 100}%` 
                          }}
                        />
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="500000000" 
                        step="1000000"
                        value={filters.minPrice || 0}
                        onChange={(e) => {
                          const val = Math.min(parseInt(e.target.value), (filters.maxPrice || 500000000) - 10000000);
                          setFilters({ ...filters, minPrice: val });
                          setPage(1);
                        }}
                        className="absolute left-0 w-full h-2 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:cursor-pointer"
                      />
                      <input 
                        type="range" 
                        min="0" 
                        max="500000000" 
                        step="1000000"
                        value={filters.maxPrice || 500000000}
                        onChange={(e) => {
                          const val = Math.max(parseInt(e.target.value), (parseInt(filters.minPrice) || 0) + 10000000);
                          setFilters({ ...filters, maxPrice: val });
                          setPage(1);
                        }}
                        className="absolute left-0 w-full h-2 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    onClick={() => {
                      setFilters({ brand: '', year: '', minPrice: '', maxPrice: '', officeId: '' });
                      setPage(1);
                    }}
                    className="h-9 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Reset Filter
                  </button>
                  <button 
                    onClick={() => { setShowAdvanced(false); fetchVehicles(); }}
                    className="h-9 px-8 bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                  >
                    Terapkan Filter
                  </button>
                </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="min-h-[400px]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em] opacity-70 pl-4">{totalItems} unit premium siap dikirim</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Urutkan:</span>
              <div className="relative">
                <button 
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-4 bg-gray-100 dark:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white transition-all shadow-sm active:scale-95"
                >
                  {sortBy}
                  <ChevronDown size={14} className={`transition-transform duration-300 ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showSortDropdown && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#12141c] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden z-[100] p-1.5"
                      >
                        {['Terbaru', 'Harga Terendah', 'Harga Tertinggi', 'Tahun Terbaru'].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setSortBy(opt);
                              setPage(1);
                              setShowSortDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest text-left rounded-xl transition-all ${sortBy === opt ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-950 shadow-xl' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </motion.div>
                      <div className="fixed inset-0 z-[90]" onClick={() => setShowSortDropdown(false)} />
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] bg-gray-200/50 dark:bg-white/5 rounded-[32px] animate-pulse" />)}
              </motion.div>
            ) : vehicles.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 text-gray-400">
                <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">Belum ada unit yang tersedia.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {vehicles.map((v) => (
                  <article 
                    key={v.id} 
                    onClick={() => { setSelectedVehicle(v); setActiveImageIndex(0); }} 
                    className="group relative bg-white dark:bg-[#12141c] rounded-[32px] p-2 border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-500 cursor-pointer"
                  >
                    {/* Image Section */}
                    <div className="aspect-[4/3] rounded-[24px] overflow-hidden bg-gray-50 dark:bg-gray-800 relative">
                      {v.images?.[0] ? (
                        <img 
                          src={`${IMAGE_BASE_URL}${v.images.find(img => img.is_primary)?.image_url || v.images[0].image_url}`} 
                          alt={v.model} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ImageIcon size={40} />
                        </div>
                      )}
                      
                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 z-10">
                        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                          <p className="text-[9px] font-black text-white uppercase tracking-widest">{v.brand} {v.year}</p>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 pt-6">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2 leading-tight group-hover:text-black dark:group-hover:text-white transition-colors">{v.model}</h3>
                      
                      {/* Location & Details */}
                      <div className="flex items-center gap-2 mb-6 text-gray-400 group-hover:text-gray-500 transition-colors">
                        <MapPin size={12} className="shrink-0" />
                        <p className="text-[10px] font-bold uppercase tracking-widest truncate">
                          {v.Office?.location?.name || v.Office?.name || 'Setiabudi'} • {v.type || 'Mobil'}
                        </p>
                      </div>

                      {/* Footer: Price & Action */}
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Harga</p>
                          <p className="text-xl font-black text-gray-950 dark:text-white tracking-tight">{formatPrice(v.price)}</p>
                        </div>
                        <div className="w-11 h-11 rounded-full bg-black dark:bg-white text-white dark:text-gray-950 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-[-10deg] transition-all">
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

        {/* MODALS */}
        <AnimatePresence>
          {selectedVehicle && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedVehicle(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-6xl bg-white dark:bg-[#0a0b0f] rounded-[24px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-white/10 flex flex-col md:flex-row h-[90vh] md:h-[85vh]"
              >
                <div className="w-full md:w-[60%] h-[35vh] md:h-full relative bg-gray-100 dark:bg-gray-950 flex items-center justify-center overflow-hidden border-r border-gray-200 dark:border-white/5 shrink-0">
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
                        className="relative z-10 w-full h-full object-contain p-4 md:p-8"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-800"><ImageIcon size={100} /></div>
                  )}

                  {/* Navigation Thumbnails */}
                  {selectedVehicle.images?.length > 1 && (
                    <div className="absolute bottom-4 md:bottom-8 left-0 right-0 px-6 z-20 flex justify-center group/thumbs">
                      <div className="relative max-w-full">
                        {/* Scroll Arrows */}
                        <button 
                          onClick={() => scrollThumbs('left')}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white opacity-100 md:opacity-0 md:group-hover/thumbs:opacity-100 transition-all z-40 hover:scale-110 active:scale-95 shadow-lg"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button 
                          onClick={() => scrollThumbs('right')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white opacity-100 md:opacity-0 md:group-hover/thumbs:opacity-100 transition-all z-40 hover:scale-110 active:scale-95 shadow-lg"
                        >
                          <ChevronRight size={16} />
                        </button>

                        <div 
                          ref={thumbRef}
                          className="flex gap-2 md:gap-3 p-1.5 md:p-2.5 bg-black/40 backdrop-blur-2xl rounded-[20px] md:rounded-[28px] border border-white/10 shadow-2xl overflow-x-auto no-scrollbar scroll-smooth"
                        >
                          {selectedVehicle.images.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveImageIndex(idx)}
                              className={`w-10 h-10 md:w-16 md:h-16 rounded-[12px] md:rounded-[20px] overflow-hidden border-2 transition-all shrink-0 ${activeImageIndex === idx ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'}`}
                            >
                              <img src={`${IMAGE_BASE_URL}${img.image_url}`} className="w-full h-full object-cover" alt="" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                <div className="w-full md:w-[40%] p-6 md:p-8 flex flex-col overflow-hidden bg-[#f8fafc] dark:bg-[#0a0b0f]">
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
                    <div className="p-4 md:p-5 bg-white dark:bg-white/5 rounded-[20px] md:rounded-[24px] border border-gray-200 dark:border-white/5 mb-4 md:mb-6 shadow-sm">
                      {/* Compact Specs Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-4 md:gap-4 mb-4 md:mb-5">
                        {[
                          { label: 'Odometer', val: `${parseInt(selectedVehicle.odometer || 0).toLocaleString()} KM` },
                          { label: 'Transmisi', val: selectedVehicle.transmission || '-' },
                          { label: 'Bahan Bakar', val: selectedVehicle.fuel_type || '-' },
                          { label: 'Warna', val: selectedVehicle.color || '-' }
                        ].map((spec, i) => (
                          <div key={i}>
                            <p className="text-[7px] md:text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5 md:mb-1">{spec.label}</p>
                            <p className="text-[10px] md:text-[11px] font-bold text-gray-900 dark:text-white uppercase truncate">{spec.val}</p>
                          </div>
                        ))}
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gray-100 dark:bg-white/10 mb-4 md:mb-5" />

                      {/* Location Info */}
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gray-900 text-white flex items-center justify-center shrink-0 shadow-lg shadow-gray-900/20"> <MapPin size={16} className="md:w-[18px] md:h-[18px]" /> </div>
                        <div className="min-w-0">
                          <p className="text-[7px] md:text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Lokasi</p>
                          <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">{selectedVehicle.Office?.name}</p>
                          <p className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 truncate">{selectedVehicle.Office?.location?.name || selectedVehicle.Office?.address}</p>
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
                  <div className="pt-2 md:pt-4 pb-4 md:pb-6 mt-auto border-t border-gray-100 dark:border-white/10">
                    <button
                      onClick={() => handleContact(selectedVehicle.office_id)}
                      className="w-full h-12 md:h-14 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-gray-100 transition-all rounded-xl md:rounded-[20px] font-black text-sm flex items-center justify-center gap-3 active:scale-95 shadow-2xl uppercase tracking-widest"
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
                    className="w-8 h-8 md:w-9 md:h-9 bg-black/40 hover:bg-black dark:hover:bg-white dark:hover:text-black backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white transition-all shadow-xl group"
                    title="Buka detail lengkap"
                  >
                    <Maximize2 size={14} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => setSelectedVehicle(null)}
                    className="w-8 h-8 md:w-9 md:h-9 bg-black/40 hover:bg-red-500 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white transition-all shadow-xl group"
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
      </div>
    </div>
  );
};

export default Catalog;
