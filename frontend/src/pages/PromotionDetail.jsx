import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Calendar, MapPin, Globe, Building2, ChevronLeft, 
  ExternalLink, Sparkles, Share2, Clock, Info,
  MessageCircle, X, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IMAGE_BASE_URL } from '../config';

const PromotionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  useEffect(() => {
    const fetchPromoDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/promotions/${id}`);
        setPromo(res.data);
      } catch (err) {
        console.error('Error fetching promo detail:', err);
        setError('Promo tidak ditemukan atau sudah berakhir.');
      } finally {
        setLoading(false);
      }
    };

    fetchPromoDetail();
  }, [id]);

  const handleContact = async () => {
    try {
      setAgentsLoading(true);
      setIsContactModalOpen(true);
      const res = await api.get('/sales-agents', { 
        params: { office_id: promo.office_id || '' } 
      });
      setAgents(res.data);
    } catch (err) {
      console.error('Error fetching agents:', err);
    } finally {
      setAgentsLoading(false);
    }
  };

  const openWA = (phone, promoTitle) => {
    const message = `Halo, saya tertarik dengan promo "${promoTitle}" yang saya lihat di website. Mohon info lebih lanjut.`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: promo.title,
        text: promo.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link disalin ke clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b0f] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !promo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b0f] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6">
          <Info size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Oops! Terjadi Kesalahan</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-8">{error}</p>
        <button 
          onClick={() => window.close()} 
          className="px-8 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
        >
          Tutup Halaman
        </button>
      </div>
    );
  }

  const isExpired = new Date(promo.end_date) < new Date();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b0f] transition-colors duration-500 pb-10">
      {/* Dynamic Background Blur - Ultra Subtle */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-blue-500/[0.02] blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-6">
        {/* Navigation - Compact */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => window.close()}
            className="group flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-500 transition-colors"
          >
            <ChevronLeft size={14} /> Kembali
          </button>
          <button 
            onClick={handleShare}
            className="w-8 h-8 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-all"
          >
            <Share2 size={14} />
          </button>
        </div>

        {/* 1. HEADER: JUDUL & PERIODE - COMPACT */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest mb-3 border border-amber-500/20">
            <Sparkles size={10} /> Penawaran Eksklusif
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-4">
            {promo.title}
          </h1>

          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <Calendar size={14} className="text-blue-500" />
            Berlaku s/d {new Date(promo.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </motion.div>

        {/* 2. PHOTO SECTION - CINEMATIC COMPACT */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative aspect-[21/9] bg-white dark:bg-[#12141c] rounded-[32px] overflow-hidden border border-gray-100 dark:border-white/10 shadow-xl mb-6"
        >
          <img 
            src={IMAGE_BASE_URL + promo.image_path} 
            className="w-full h-full object-cover" 
            alt={promo.title} 
          />
          <div className="absolute top-4 left-4">
            <div className="h-7 px-4 bg-blue-600 text-white text-[8px] font-black uppercase flex items-center rounded-lg shadow-lg">
              {promo.placement}
            </div>
          </div>
        </motion.div>

        {/* 3. LOKASI & DETAIL - MINIMALIST INTEGRATED */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          {/* Simple Location Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6 text-gray-500 dark:text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Tersedia di: {promo.office_id === null ? 'Seluruh Indonesia' : promo.Office?.name}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          </div>

          {/* Single Detailed Description */}
          <div className="max-w-2xl mx-auto">
            <div className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed font-medium mb-10 px-4">
              {promo.description || 'Dapatkan penawaran eksklusif ini dengan menghubungi sales agent kami.'}
            </div>
          </div>

          {/* DIRECT CTA BUTTON */}
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={handleContact}
              className="h-14 px-12 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-600/20 cursor-pointer"
            >
              <Phone size={18} fill="currentColor" /> Hubungi Sales Sekarang
            </button>
            
            <div className="flex items-center gap-2 text-[8px] font-black text-emerald-500 uppercase tracking-widest opacity-60">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> 
              Agen Kami Sedang Online & Siap Membantu
            </div>
          </div>
        </motion.div>
      </div>

      {/* SALES AGENT MODAL */}
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
                    {promo.office_id ? 'Official Agent Cabang Terkait' : 'Official Agent (Pusat)'}
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
                    <p className="text-sm font-bold uppercase tracking-widest">Tidak ada agen aktif di cabang ini</p> 
                  </div>
                ) : (
                  (Array.isArray(agents) ? agents : []).map(agent => (
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
                        onClick={() => openWA(agent.phone, promo.title)} 
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

export default PromotionDetail;
