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

  const isNeutral = !showroomInfo?.header_image || showroomInfo?.theme_color === 'default';

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

      {/* Hero Section (Same as Catalog) */}
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
        {!isNeutral && (
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

        <header className="relative z-10 flex flex-col items-center text-center px-5 pt-10 md:pt-20 pb-32 max-w-7xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] ${isNeutral ? 'text-gray-900 dark:text-white' : 'text-white'}`}
          >
            Tentang Kami
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className={`mt-6 text-lg md:text-xl font-medium tracking-wide max-w-2xl leading-relaxed ${isNeutral ? 'text-gray-600 dark:text-gray-400' : 'text-white/80'}`}
          >
            Kenali lebih dekat visi dan dedikasi kami dalam menghadirkan unit kendaraan terbaik untuk Anda.
          </motion.p>
        </header>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-5 -mt-20 mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="bg-white dark:bg-[#12141c] rounded-[40px] p-8 md:p-16 shadow-2xl border border-gray-100 dark:border-white/5"
        >
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center text-gray-900 dark:text-white shrink-0 shadow-inner"
            >
              <Building2 size={40} />
            </motion.div>
            
            <div className="flex-1">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="text-3xl font-black text-gray-900 dark:text-white mb-8 uppercase tracking-tight"
              >
                {showroomInfo?.title || 'Profil Perusahaan'}
              </motion.h2>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 leading-[1.8] space-y-6 text-base md:text-lg"
              >
                {showroomInfo?.description ? (
                  <p className="whitespace-pre-line">{showroomInfo.description}</p>
                ) : (
                  <>
                    <p>
                      Selamat datang di platform showroom kendaraan kami. Kami berdedikasi untuk memberikan layanan terbaik dalam memenuhi kebutuhan kendaraan impian Anda.
                    </p>
                    <p>
                      Dengan standar kualitas yang ketat dan proses yang transparan, kami memastikan setiap unit yang kami tawarkan telah melewati inspeksi menyeluruh demi kepuasan dan ketenangan pikiran Anda.
                    </p>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
