import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Calendar, MapPin, Globe, Building2, ChevronLeft, ChevronRight,
  ExternalLink, Sparkles, Share2, Clock, Info,
  MessageCircle, X, Phone, Sun, Moon, Image as ImageIcon,
  CheckCircle, ShoppingCart, Tag, Fuel, Gauge, Shield, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IMAGE_BASE_URL } from '../config';
import { useTheme } from '../context/ThemeContext';
import { decryptId } from '../utils/crypto';

const ProductDetail = () => {
  const { theme, toggleTheme } = useTheme();
  const { id: encryptedId } = useParams();
  const navigate = useNavigate();
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  
  const thumbRef = useRef(null);
  const scrollThumbs = (dir) => {
    if (thumbRef.current) {
      thumbRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchVehicleDetail = async () => {
      try {
        setLoading(true);
        const realId = decryptId(encryptedId);
        if (!realId) throw new Error('ID tidak valid');
        
        const res = await api.get(`/vehicles/${realId}`);
        setVehicle(res.data);
      } catch (err) {
        console.error('Error fetching vehicle detail:', err);
        setError('Unit tidak ditemukan atau sudah tidak tersedia.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleDetail();
  }, [encryptedId]);

  const handleContact = async () => {
    try {
      setAgentsLoading(true);
      setIsContactModalOpen(true);
      const res = await api.get('/sales-agents/active', { 
        params: { officeId: vehicle.office_id || '' } 
      });
      setAgents(res.data);
    } catch (err) {
      console.error('Error fetching agents:', err);
    } finally {
      setAgentsLoading(false);
    }
  };

  const openWA = (phone, model) => {
    const message = `Halo, saya tertarik dengan unit "${model}" yang saya lihat di website. Mohon info lebih lanjut.`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
        text: `Cek unit ini di Katalog Showroom: ${vehicle.brand} ${vehicle.model}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link disalin ke clipboard!');
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Memuat Detail Unit...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b0f] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6">
          <Info size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Unit Tidak Ditemukan</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-8">{error}</p>
        <button 
          onClick={() => navigate('/catalog')} 
          className="px-8 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-950 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-transform active:scale-95"
        >
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0a0b0f] transition-colors duration-500 pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/[0.03] blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/[0.03] blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-6">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate('/catalog')}
            className="group flex items-center gap-2.5 px-5 h-11 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-full text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest hover:text-blue-500 dark:hover:text-blue-400 transition-all shadow-sm"
          >
            <ChevronLeft size={16} /> Kembali
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="w-11 h-11 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-all shadow-sm"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={handleShare}
              className="w-11 h-11 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-all shadow-sm"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* LEFT COLUMN: Gallery */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-video md:aspect-[16/10] bg-white dark:bg-[#12141c] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-xl flex items-center justify-center group"
            >
              {vehicle.images?.[activeImageIndex] ? (
                <>
                  <img 
                    src={`${IMAGE_BASE_URL}${vehicle.images[activeImageIndex].image_url}`} 
                    alt={vehicle.model} 
                    className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-110 group-hover:opacity-30 transition-opacity duration-700"
                  />
                  <img 
                    src={`${IMAGE_BASE_URL}${vehicle.images[activeImageIndex].image_url}`} 
                    alt={vehicle.model} 
                    className="relative z-10 w-full h-full object-contain p-6 md:p-12 transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-300">
                  <ImageIcon size={80} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Foto Tidak Tersedia</p>
                </div>
              )}
              <div className="absolute top-6 left-6 z-20">
                <div className={`h-8 px-5 ${vehicle.status === 'Sold' ? 'bg-red-500' : vehicle.status === 'Booking' ? 'bg-amber-500' : 'bg-blue-600'} text-white text-[9px] font-black uppercase flex items-center rounded-lg shadow-lg tracking-widest`}>
                  {vehicle.status === 'Sold' ? 'Terjual' : vehicle.status === 'Booking' ? 'Terbooking' : 'Ready Stock'}
                </div>
              </div>
            </motion.div>

            {/* Thumbnails */}
            {vehicle.images?.length > 1 && (
              <div className="relative group/thumbs px-1">
                {/* Scroll Arrows */}
                <button 
                  onClick={() => scrollThumbs('left')}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-100 dark:border-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-500 shadow-xl opacity-100 md:opacity-0 md:group-hover/thumbs:opacity-100 transition-all z-20"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => scrollThumbs('right')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-100 dark:border-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-500 shadow-xl opacity-100 md:opacity-0 md:group-hover/thumbs:opacity-100 transition-all z-20"
                >
                  <ChevronRight size={16} />
                </button>

                <div 
                  ref={thumbRef}
                  className="flex gap-4 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
                >
                  {vehicle.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-24 h-16 md:w-32 md:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${activeImageIndex === idx ? 'border-blue-500 scale-105 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100 hover:border-gray-200 dark:hover:border-white/20'}`}
                    >
                      <img src={`${IMAGE_BASE_URL}${img.image_url}`} className="w-full h-full object-cover" alt="" />
                      {activeImageIndex === idx && (
                        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[2px]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-3xl p-8 md:p-10 shadow-xl shadow-gray-200/50 dark:shadow-none backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Info size={20} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Informasi Unit</h3>
              </div>
              
              <div className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed font-medium space-y-4">
                {vehicle.description ? (
                  <div dangerouslySetInnerHTML={{ __html: vehicle.description }} className="prose dark:prose-invert max-w-full" />
                ) : (
                  <p>Unit ini dalam kondisi prima dan siap untuk Anda bawa pulang. Hubungi agen kami untuk mendapatkan detail spesifikasi lengkap dan jadwal test drive.</p>
                )}
              </div>

              {/* Badges/Features - Dummy for Aesthetic */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-10 border-t border-gray-100 dark:border-white/5">
                {[
                  { icon: ShieldCheck, label: 'Terjamin', sub: 'Kualitas OK' },
                  { icon: Tag, label: 'Harga', sub: 'Terbaik' },
                  { icon: Clock, label: 'Proses', sub: 'Cepat' },
                  { icon: Globe, label: 'Unit', sub: 'Lolos Cek' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                      <item.icon size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-wider">{item.label}</p>
                      <p className="text-[8px] text-gray-400 uppercase tracking-tighter">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Details & CTA */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-white/10 rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none sticky top-8"
            >
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                   <p className="px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-full text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border border-gray-200 dark:border-white/5">
                    {vehicle.type}
                  </p>
                  <p className={`px-3 py-1 ${vehicle.status === 'Sold' ? 'bg-red-500/10 text-red-600' : vehicle.status === 'Booking' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'} rounded-full text-[9px] font-black uppercase tracking-widest border ${vehicle.status === 'Sold' ? 'border-red-500/20' : vehicle.status === 'Booking' ? 'border-amber-500/20' : 'border-emerald-500/20'}`}>
                    {vehicle.status || 'Available'}
                  </p>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em]">{vehicle.brand} • {vehicle.year}</p>
                  <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-600/5 px-3 py-1 rounded-lg border border-blue-500/10 shadow-sm">{vehicle.unit_code}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-6">
                  {vehicle.model}
                </h1>
                <div className="h-px w-20 bg-blue-600 mb-8" />
                <p className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                  {formatPrice(vehicle.price)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="p-5 bg-gray-50/50 dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2 text-gray-500">
                    <Gauge size={16} strokeWidth={2.5} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Odometer</span>
                  </div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">
                    {vehicle.odometer ? `${parseInt(vehicle.odometer).toLocaleString('id-ID')} KM` : 'Low KM'}
                  </p>
                </div>
                <div className="p-5 bg-gray-50/50 dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2 text-gray-500">
                    <Fuel size={16} strokeWidth={2.5} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Bahan Bakar</span>
                  </div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{vehicle.fuel_type || 'Bensin'}</p>
                </div>
              </div>

              {/* Location Box */}
              <div className="p-6 bg-blue-50/50 dark:bg-blue-400/5 rounded-2xl border border-blue-200 dark:border-blue-500/10 mb-10 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
                    <MapPin size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Lokasi Unit</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white leading-tight mb-1 truncate">{vehicle.Office?.name || 'Cabang -'}</p>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{vehicle.Office?.location?.name || '-'}</p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-4">
                <button 
                  onClick={handleContact}
                  disabled={vehicle.status === 'Sold'}
                  className={`w-full h-16 ${vehicle.status === 'Sold' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-95'} text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg ${vehicle.status !== 'Sold' ? 'shadow-blue-600/20' : ''} cursor-pointer`}
                >
                  <Phone size={18} fill="currentColor" /> {vehicle.status === 'Sold' ? 'Unit Sudah Terjual' : 'Hubungi Sales Agent'}
                </button>
                <button 
                   onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(vehicle.Office?.name + ' ' + vehicle.Office?.location?.name)}`, '_blank')}
                  className="w-full h-16 bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-100 dark:border-white/10 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-white/10 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <ExternalLink size={18} /> Lihat Lokasi Cabang
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-3 py-4 border-t border-gray-100 dark:border-white/5">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-800" />
                  ))}
                </div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">5+ Orang melihat unit ini hari ini</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* SALES AGENT MODAL (Shared logic with Promo) */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsContactModalOpen(false)} 
              className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-md bg-white dark:bg-[#12141c] rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/10"
            >
              <div className="p-8 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Pilih Sales</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    Official Agent {vehicle.Office?.name}
                  </p>
                </div>
                <button onClick={() => setIsContactModalOpen(false)} className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"> <X size={24} /> </button>
              </div>

              <div className="p-4 max-h-[60vh] overflow-y-auto no-scrollbar space-y-3">
                {agentsLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-xs font-bold uppercase tracking-widest">Mencari Agent...</p>
                  </div>
                ) : (!Array.isArray(agents) || agents.length === 0) ? (
                  <div className="py-20 text-center text-gray-400 px-10"> 
                    <Info size={40} className="mx-auto mb-4 opacity-10" />
                    <p className="text-sm font-bold uppercase tracking-widest">Tidak ada agen aktif saat ini</p> 
                  </div>
                ) : (
                  agents.map(agent => (
                    <div key={agent.id} className="group p-5 bg-gray-50 dark:bg-white/5 rounded-[30px] border border-transparent hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-800 overflow-hidden shrink-0 shadow-md">
                          {agent.avatar ? <img src={`${IMAGE_BASE_URL}${agent.avatar}`} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">{agent.name.charAt(0)}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-black text-gray-900 dark:text-white truncate uppercase">{agent.name}</p>
                          <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest">{agent.sales_code || 'Official Agent'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => openWA(agent.phone, vehicle.model)} 
                        className="w-full h-12 mt-5 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 cursor-pointer"
                      >
                        <MessageCircle size={14} fill="currentColor" /> Chat via WhatsApp
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="p-8 bg-gray-50 dark:bg-black/20 text-center"> <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">Hubungi agen resmi kami untuk transaksi aman.</p> </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;
