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
  const isMetropolis = showroomInfo?.layout_template === 'metropolis' || showroomInfo?.layout_template === 'left-sidebar';
  const isMinimalist = showroomInfo?.layout_template === 'minimalist';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#0a0b0f]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const office = showroomInfo?.office;

  return (
    <div className={`min-h-screen ${isMetropolis ? 'bg-white dark:bg-neutral-950' : 'bg-gray-100 dark:bg-[#0a0b0f]'} transition-colors duration-500 overflow-x-hidden pb-10`}>
      <Helmet>
        <title>Kontak Kami | {showroomInfo?.title || 'Bursa Mobil'}</title>
      </Helmet>

      {isMetropolis ? (
        <div className="relative z-0 w-full overflow-hidden transition-all duration-700 bg-slate-900 dark:bg-zinc-950">
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
              // Premium Gradient Mesh for Minimalist Luxury
              <div className="w-full h-full bg-gradient-to-br from-slate-900 to-zinc-950 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[100%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[100%] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />
              </div>
            )}
            {/* Bottom fade blending into the page background */}
            <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-white dark:from-[#0a0a0c] to-transparent z-[1]" />
          </div>

          <ShowroomNavbar 
            showroomInfo={showroomInfo}
            isNeutral={false}
            isPublicMode={true}
            slug={slug}
            user={user}
            theme={theme}
            toggleTheme={toggleTheme}
          />

          <motion.header 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 flex flex-col gap-6 pt-10 md:pt-20 pb-36 px-5 md:px-10 lg:px-14 items-center text-center max-w-7xl mx-auto text-white"
          >
            <div className="text-[10px] font-black tracking-[0.25em] text-neutral-400 dark:text-neutral-500 uppercase">
              / HUBUNGI KAMI
            </div>
            <h1 className="text-4xl md:text-6xl font-light text-white tracking-tight leading-[1.05] uppercase font-mono">
              Kontak Kami
            </h1>
            <p className="text-xs md:text-sm text-white/80 font-light leading-relaxed max-w-md mx-auto">
              Ada pertanyaan atau butuh bantuan? Kami siap melayani kebutuhan kendaraan Anda dengan sepenuh hati.
            </p>
          </motion.header>
        </div>
      ) : isMinimalist ? (
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
            isPublicMode={true}
            slug={slug}
            user={user}
            theme={theme}
            toggleTheme={toggleTheme}
          />

          <motion.header 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 flex flex-col gap-5 pt-10 md:pt-20 pb-36 md:pb-40 max-w-7xl mx-auto items-center text-center text-white"
          >
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white">
              Kontak Kami
            </h1>
            <p className="text-sm md:text-base font-medium tracking-wide max-w-3xl text-white/80 leading-relaxed">
              Ada pertanyaan atau butuh bantuan? Kami siap melayani kebutuhan kendaraan Anda dengan sepenuh hati.
            </p>
          </motion.header>
        </div>
      ) : (
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
      )}

      {/* Main Content */}
      <div className={`relative z-10 max-w-5xl mx-auto px-5 ${isMetropolis ? 'mt-10' : '-mt-10 md:-mt-12'} mb-20`}>
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className={
            isMetropolis
              ? "bg-neutral-50/20 dark:bg-neutral-900/40 rounded-3xl p-8 md:p-16 border border-neutral-100 dark:border-neutral-900 shadow-none overflow-hidden"
              : isMinimalist
              ? "bg-white dark:bg-[#151722] rounded-3xl p-8 md:p-16 border border-gray-200 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] overflow-hidden"
              : "bg-white dark:bg-[#12141c] rounded-[40px] p-8 md:p-16 shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden"
          }
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
                  <h2 className={`text-2xl ${isMetropolis ? 'font-extrabold text-slate-900 dark:text-white' : isMinimalist ? 'font-black text-gray-900 dark:text-white tracking-tight' : 'font-black text-gray-900 dark:text-white'} mb-6 uppercase tracking-tight`}>Hubungi Kami</h2>
                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center shrink-0 ${
                        isMetropolis 
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl border border-neutral-300 dark:border-neutral-750 shadow-none'
                          : isMinimalist
                          ? 'bg-gray-50 dark:bg-white/5 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-2xl'
                      }`}>
                        <Building2 size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Kantor</p>
                        <p className={`text-base ${isMetropolis ? 'font-semibold text-slate-800 dark:text-slate-200' : 'font-bold text-gray-900 dark:text-white'} leading-tight`}>{office?.name || 'Kantor Pusat'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center shrink-0 ${
                        isMetropolis 
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl border border-neutral-300 dark:border-neutral-750 shadow-none'
                          : isMinimalist
                          ? 'bg-gray-50 dark:bg-white/5 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-2xl'
                      }`}>
                        <Phone size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Telepon</p>
                        <p className={`text-base ${isMetropolis ? 'font-semibold text-slate-800 dark:text-slate-200' : 'font-bold text-gray-900 dark:text-white'} leading-tight`}>{office?.phone || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center shrink-0 ${
                        isMetropolis 
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl border border-neutral-300 dark:border-neutral-750 shadow-none'
                          : isMinimalist
                          ? 'bg-gray-50 dark:bg-white/5 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-2xl'
                      }`}>
                        <Mail size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Email</p>
                        <p className={`text-base ${isMetropolis ? 'font-semibold text-slate-800 dark:text-slate-200' : 'font-bold text-gray-900 dark:text-white'} leading-tight`}>{office?.email || '-'}</p>
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
                  <h2 className={`text-2xl ${isMetropolis ? 'font-extrabold text-slate-900 dark:text-white' : isMinimalist ? 'font-black text-gray-900 dark:text-white tracking-tight' : 'font-black text-gray-900 dark:text-white'} mb-6 uppercase tracking-tight`}>Lokasi & Jam</h2>
                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center shrink-0 ${
                        isMetropolis 
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl border border-neutral-300 dark:border-neutral-750 shadow-none'
                          : isMinimalist
                          ? 'bg-gray-50 dark:bg-white/5 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-2xl'
                      }`}>
                        <MapPin size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Alamat</p>
                        <p className={`text-base ${isMetropolis ? 'font-semibold text-slate-800 dark:text-slate-200' : 'font-bold text-gray-900 dark:text-white'} leading-relaxed`}>
                          {showroomInfo?.address || office?.address || 'Jl. Contoh Alamat No. 123, Kota, Provinsi'}
                          {office?.location && <><br />{office.location.name}</>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center shrink-0 ${
                        isMetropolis 
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl border border-neutral-300 dark:border-neutral-750 shadow-none'
                          : isMinimalist
                          ? 'bg-gray-50 dark:bg-white/5 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-2xl'
                      }`}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Operasional</p>
                        <p className={`text-base ${isMetropolis ? 'font-semibold text-slate-800 dark:text-slate-200' : 'font-bold text-gray-900 dark:text-white'} leading-relaxed whitespace-pre-line`}>
                          {showroomInfo?.operational_hours || 'Senin - Sabtu: 08.00 - 17.00\nMinggu: Tutup'}
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
              className="prose dark:prose-invert max-w-none mb-12 text-gray-900 dark:text-gray-100 leading-[1.8]"
              dangerouslySetInnerHTML={{ __html: showroomInfo?.contact_content }}
            />
          )}

          {/* Map Integration */}
          {(showroomInfo?.latitude && showroomInfo?.longitude) && (
            <div className={`mt-12 pt-12 border-t ${isMetropolis ? 'border-slate-200 dark:border-slate-800/85' : isMinimalist ? 'border-gray-200 dark:border-white/10' : 'border-gray-100 dark:border-white/5'}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                 <div>
                    <h3 className={`text-lg ${isMetropolis ? 'font-extrabold text-slate-900 dark:text-white' : isMinimalist ? 'font-black text-gray-900 dark:text-white' : 'font-black text-gray-900 dark:text-white'} uppercase tracking-tight`}>Lokasi Google Maps</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Kunjungi showroom kami langsung melalui navigasi di bawah</p>
                 </div>
                 <a 
                  href={`https://www.google.com/maps?q=${showroomInfo.latitude},${showroomInfo.longitude}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    isMetropolis 
                      ? 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold text-xs tracking-wide px-5 py-2.5 rounded-xl border border-blue-500/20 shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] transition-all duration-300 hover:-translate-y-0.5'
                      : isMinimalist
                      ? 'bg-blue-600 hover:bg-blue-700 text-white rounded-xl hover:scale-[1.02] active:scale-98 shadow-sm transition-all duration-300 px-5 py-2.5 font-bold text-xs tracking-wide border border-blue-600/20'
                      : 'bg-blue-600 text-white rounded-xl hover:scale-105 transition-transform'
                  }`}
                 >
                   Buka di Google Maps
                 </a>
              </div>
              <div className={`w-full h-[300px] md:h-[400px] overflow-hidden ${
                isMetropolis 
                  ? 'border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xl'
                  : isMinimalist
                  ? 'rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm'
                  : 'rounded-3xl border border-gray-100 dark:border-white/5 shadow-inner'
              }`}>
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
