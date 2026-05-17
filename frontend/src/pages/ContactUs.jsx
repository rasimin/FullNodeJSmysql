import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Mail, Clock, Building2, Globe } from 'lucide-react';
import api from '../services/api';
import { IMAGE_BASE_URL } from '../config';
import ShowroomNavbar from '../components/ShowroomNavbar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import { motion } from 'framer-motion';

const ContactUs = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [showroomInfo, setShowroomInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        if (slug) {
          const res = await api.get(`/public/showroom/${slug}`);
          setShowroomInfo(res.data);
        }
      } catch (err) {
        console.error('Error fetching contact info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [slug]);

  const isNeutral = !showroomInfo?.header_image && (!showroomInfo?.theme_color || showroomInfo?.theme_color === 'default');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#0a0b0f]">
        <div className="w-10 h-10 border-4 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const office = showroomInfo?.office;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0a0b0f] transition-colors duration-500 overflow-x-hidden">
      <Helmet>
        <title>Kontak Kami | {showroomInfo?.title || 'Bursa Mobil'}</title>
      </Helmet>

      {/* Hero Section (Synchronized with Catalog) */}
      <div 
        className={`relative z-0 w-full overflow-hidden transition-all duration-700 ${
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
        style={!isNeutral && showroomInfo?.theme_color?.startsWith('#') ? { backgroundColor: showroomInfo.theme_color } : {}}
      >
        {/* Dynamic Background */}
        {(showroomInfo?.header_image || (!isNeutral && showroomInfo?.theme_color)) && (
          <div className="absolute inset-0 z-0 transition-opacity duration-1000">
            {showroomInfo?.header_image ? (
              <>
                <img src={`${IMAGE_BASE_URL}${showroomInfo.header_image}`} className="w-full h-full object-cover" alt="Header" />
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
              </>
            ) : (
              <div className={`absolute inset-0 opacity-90 bg-gradient-to-br ${
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
          isPublicMode={true}
          slug={slug}
          user={user}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <header className="relative z-10 flex flex-col items-center text-center px-5 pt-10 md:pt-20 pb-36 md:pb-40 max-w-7xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] ${isNeutral ? 'text-gray-900 dark:text-white' : 'text-white'}`}
          >
            Kontak Kami
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className={`mt-6 text-lg md:text-xl font-medium tracking-wide max-w-2xl leading-relaxed ${isNeutral ? 'text-gray-600 dark:text-gray-400' : 'text-white/80'}`}>
            Ada pertanyaan atau butuh bantuan? Kami siap melayani kebutuhan kendaraan Anda dengan sepenuh hati.
          </motion.p>
        </header>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-5 -mt-10 md:-mt-12 mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="bg-white dark:bg-[#12141c] rounded-[40px] p-8 md:p-16 shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden"
        >
          {showroomInfo?.use_default_contact ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="space-y-10"
              >
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight">Hubungi Kami</h2>
                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-900 dark:text-white shrink-0">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kantor</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{office?.name || 'Kantor Pusat'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-900 dark:text-white shrink-0">
                        <Phone size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Telepon</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{office?.phone || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-900 dark:text-white shrink-0">
                        <Mail size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{office?.email || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="space-y-10"
              >
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight">Lokasi & Jam</h2>
                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-900 dark:text-white shrink-0">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alamat</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white leading-relaxed">
                          {office?.address || 'Jl. Contoh Alamat No. 123, Kota, Provinsi'}
                          {office?.location && <><br />{office.location.name}</>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-900 dark:text-white shrink-0">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Operasional</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white leading-relaxed">
                          Senin - Sabtu: 08.00 - 17.00<br/>Minggu: Tutup
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose dark:prose-invert max-w-none mb-12"
              dangerouslySetInnerHTML={{ __html: showroomInfo?.contact_content }}
            />
          )}

          {/* Map Integration */}
          {(showroomInfo?.latitude && showroomInfo?.longitude) && (
            <div className="mt-12 pt-12 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Lokasi Google Maps</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Kunjungi showroom kami langsung melalui navigasi di bawah</p>
                 </div>
                 <a 
                  href={`https://www.google.com/maps?q=${showroomInfo.latitude},${showroomInfo.longitude}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                 >
                   Buka di Google Maps
                 </a>
              </div>
              <div className="w-full h-[300px] md:h-[400px] rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-inner">
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  style={{ border: 0 }} 
                  src={`https://maps.google.com/maps?q=${showroomInfo.latitude},${showroomInfo.longitude}&z=15&output=embed`} 
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ContactUs;
