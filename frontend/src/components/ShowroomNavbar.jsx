import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { IMAGE_BASE_URL } from '../config';

const ShowroomNavbar = ({ 
  showroomInfo, 
  isNeutral, 
  isPublicMode, 
  slug, 
  user, 
  theme, 
  toggleTheme, 
  setIsPromoModalOpen 
}) => {
  const isMinimalistLuxury = showroomInfo?.layout_template === 'metropolis';

  return (
    <nav className={`sticky top-0 z-[100] transition-all duration-500 border-b ${
      isMinimalistLuxury 
        ? 'bg-white/95 dark:bg-[#0a0a0c]/95 backdrop-blur-md border-neutral-100 dark:border-neutral-900/60'
        : isNeutral 
        ? 'bg-white/80 dark:bg-[#0a0b0f]/80 backdrop-blur-xl border-gray-200/50 dark:border-white/5' 
        : 'bg-black/20 backdrop-blur-xl border-white/10'
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-14 md:h-16">
        
        {/* Logo & Name Card */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center shrink-0 overflow-hidden font-black text-[10px] ${
            isMinimalistLuxury
              ? 'rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white'
              : isNeutral 
              ? 'rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-950 shadow-md' 
              : 'rounded-full bg-white text-gray-950 shadow-lg'
          }`}>
            {showroomInfo?.office?.logo ? (
              <img src={`${IMAGE_BASE_URL}${showroomInfo.office.logo}`} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              (showroomInfo?.office?.name?.substring(0, 2).toUpperCase() || 'KJ')
            )}
          </div>
          <div className="hidden sm:block">
            <h2 className={`text-[10px] md:text-[11px] font-black leading-none uppercase ${
              isMinimalistLuxury
                ? 'text-neutral-900 dark:text-white tracking-widest font-mono font-light'
                : isNeutral ? 'text-gray-900 dark:text-white tracking-tighter' : 'text-white tracking-tighter'
            }`}>
              {showroomInfo?.office?.name || 'Kantor Pusat Jakarta'}
            </h2>
            <p className={`text-[7px] uppercase font-bold tracking-[0.2em] mt-1.5 ${
              isMinimalistLuxury ? 'text-neutral-400 dark:text-neutral-500' : isNeutral ? 'text-gray-400' : 'text-white/60'
            }`}>
              Showroom Platform
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        {isPublicMode && (
          isMinimalistLuxury ? (
            <div className="flex items-center gap-1.5 md:gap-3">
              {[
                { label: 'Katalog', to: `/c/${slug}` },
                { label: 'Tentang Kami', to: `/c/${slug}/about` },
                { label: 'Kontak', to: `/c/${slug}/contact` }
              ].map((link, idx) => (
                <React.Fragment key={idx}>
                  <NavLink 
                    to={link.to} 
                    end={link.to === `/c/${slug}`}
                    className={({isActive}) => `text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 py-1 px-1.5 cursor-pointer ${
                      isActive 
                        ? 'text-neutral-900 dark:text-white border-b border-neutral-900 dark:border-white font-black' 
                        : 'text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white font-medium'
                    }`}
                  >
                    {link.label}
                  </NavLink>
                  {idx < 2 && (
                    <span className="text-neutral-300 dark:text-neutral-700 text-[8px] font-light tracking-[0.2em] px-0.5 select-none">✕</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className={`flex items-center gap-1 p-0.5 rounded-full ${
              isNeutral ? 'bg-gray-100/50 dark:bg-white/5 border border-gray-200/20' : 'bg-black/20 border border-white/10'
            }`}>
              {[
                { label: 'Katalog', to: `/c/${slug}` },
                { label: 'Tentang Kami', to: `/c/${slug}/about` },
                { label: 'Kontak', to: `/c/${slug}/contact` }
              ].map((link, idx) => (
                <NavLink 
                  key={idx} 
                  to={link.to} 
                  end={link.to === `/c/${slug}`}
                  className={({isActive}) => `px-3 md:px-5 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    isActive 
                      ? (isNeutral ? 'bg-white dark:bg-white/10 text-gray-950 dark:text-white shadow-md' : 'bg-white text-gray-950 shadow-lg') 
                      : (isNeutral ? 'text-gray-550 hover:text-gray-950 dark:hover:text-white' : 'text-white/70 hover:text-white')
                  }`}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          )
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center transition-all duration-300 ${
              isMinimalistLuxury
                ? 'rounded-none bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                : isNeutral 
                ? 'rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-300 shadow-md hover:scale-105' 
                : 'rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 shadow-lg'
            }`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {user && (
            <div className={`w-8 h-8 md:w-9 md:h-9 border-2 flex items-center justify-center font-black text-[10px] transition-all duration-300 ${
              isMinimalistLuxury
                ? 'rounded-none bg-neutral-950 text-white border-neutral-900 dark:bg-white dark:text-neutral-950 dark:border-white'
                : isNeutral ? 'rounded-full bg-gray-900 text-white border-white dark:border-gray-800 shadow-md' : 'rounded-full bg-gray-900 text-white border-white shadow-lg'
            }`}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default ShowroomNavbar;
