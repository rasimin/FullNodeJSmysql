import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Info, Building2 } from 'lucide-react';
import api from '../services/api';
import { IMAGE_BASE_URL } from '../config';
import ShowroomNavbar from '../components/ShowroomNavbar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import { motion } from 'framer-motion';

const AboutUs = () => {
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
        console.error('Error fetching about us info:', err);
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0a0b0f] transition-colors duration-500 overflow-x-hidden">
      <Helmet>
        <title>Tentang Kami | {showroomInfo?.title || 'Bursa Mobil'}</title>
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

        {/* Hero Spacing (Exact match with Catalog's header including text height compensation) */}
        <header className="relative z-10 flex flex-col items-center text-center px-5 pt-10 md:pt-20 pb-36 md:pb-40 max-w-7xl mx-auto min-h-[160px] md:min-h-[280px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-5 -mt-10 md:-mt-12 mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="bg-white dark:bg-[#12141c] rounded-[40px] px-8 md:px-16 pt-10 md:pt-12 pb-12 md:pb-16 shadow-xl border border-gray-100 dark:border-white/10"
        >
          <div className="flex flex-col gap-16">
            <div className="w-full">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="prose dark:prose-invert max-w-none text-gray-900 dark:text-gray-100 leading-[1.8] text-base md:text-lg"
              >
                <style>{`
                  .prose, .about-content-rich, .about-content-rich * {
                    word-break: normal !important;
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                    white-space: normal !important;
                    hyphens: none !important;
                  }
                  .about-content-rich .ql-align-center { text-align: center !important; }
                  .about-content-rich .ql-align-right { text-align: right !important; }
                  .about-content-rich .ql-align-justify { text-align: justify !important; }
                  .about-content-rich h1, .about-content-rich h2, .about-content-rich h3 { 
                    color: inherit; 
                    font-weight: 900; 
                    text-transform: uppercase; 
                    letter-spacing: -0.025em;
                    margin-top: 1.5em;
                    margin-bottom: 0.5em;
                  }
                  .about-content-rich p { margin-bottom: 1em; }
                  .about-content-rich ul, .about-content-rich ol { 
                    padding-left: 1.5em; 
                    margin-bottom: 1em; 
                  }
                  .about-content-rich li { margin-bottom: 0.5em; }
                `}</style>
                {showroomInfo?.about_content ? (
                  <div 
                    className="about-content-rich"
                    dangerouslySetInnerHTML={{ __html: showroomInfo.about_content }} 
                  />
                ) : (
                  <div className="text-center space-y-6">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Profil Showroom</h2>
                    <p>
                      Selamat datang di platform showroom kendaraan kami. Kami berdedikasi untuk memberikan layanan terbaik dalam memenuhi kebutuhan kendaraan impian Anda.
                    </p>
                    <p>
                      Dengan standar kualitas yang ketat dan proses yang transparan, kami memastikan setiap unit yang kami tawarkan telah melewati inspeksi menyeluruh demi kepuasan dan ketenangan pikiran Anda.
                    </p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Premium Gallery Section */}
            {[
              showroomInfo?.about_image_1, showroomInfo?.about_image_2, 
              showroomInfo?.about_image_3, showroomInfo?.about_image_4, 
              showroomInfo?.about_image_5
            ].some(img => img) && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-6 pt-10 border-t border-gray-100 dark:border-white/5">
                {[
                  showroomInfo.about_image_1, showroomInfo.about_image_2, 
                  showroomInfo.about_image_3, showroomInfo.about_image_4, 
                  showroomInfo.about_image_5
                ].filter(Boolean).map((img, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 * idx }}
                    className={`relative rounded-[24px] md:rounded-[32px] overflow-hidden bg-gray-100 dark:bg-white/5 group shadow-xl ${
                      idx === 0 ? 'col-span-2 md:col-span-4 md:row-span-2 aspect-[4/3] md:aspect-auto' : 
                      idx === 1 ? 'col-span-1 md:col-span-2 aspect-square' :
                      idx === 2 ? 'col-span-1 md:col-span-2 aspect-square' :
                      idx === 3 ? 'col-span-1 md:col-span-3 aspect-video md:aspect-square' :
                      'col-span-1 md:col-span-3 aspect-video md:aspect-square'
                    }`}
                  >
                    <img 
                      src={`${IMAGE_BASE_URL}${img}`} 
                      alt={`Gallery ${idx + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
