import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  return (
    <nav className={`sticky top-0 z-[100] transition-all duration-500 border-b ${
      isNeutral 
        ? 'bg-white/80 dark:bg-[#0a0b0f]/80 backdrop-blur-xl border-gray-200/50 dark:border-white/5' 
        : 'bg-black/20 backdrop-blur-xl border-white/10'
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-14 md:h-16">
        {/* Logo & Name Card */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden font-black text-[10px] ${
            isNeutral 
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-950 shadow-md' 
              : 'bg-white text-gray-950 shadow-lg'
          }`}>
            {showroomInfo?.office?.logo ? (
              <img src={`${IMAGE_BASE_URL}${showroomInfo.office.logo}`} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              (showroomInfo?.office?.name?.substring(0, 2).toUpperCase() || 'KJ')
            )}
          </div>
          <div className="hidden sm:block">
            <h2 className={`text-[10px] md:text-[11px] font-black leading-none uppercase tracking-tighter ${
              isNeutral ? 'text-gray-900 dark:text-white' : 'text-white'
            }`}>
              {showroomInfo?.office?.name || 'Kantor Pusat Jakarta'}
            </h2>
            <p className={`text-[7px] uppercase font-bold tracking-[0.2em] mt-1 ${
              isNeutral ? 'text-gray-400' : 'text-white/60'
            }`}>
              Showroom Platform
            </p>
          </div>
        </div>

        {/* Navigation Links (Pill Style) */}
        {isPublicMode && (
          <div className={`flex items-center gap-1 p-0.5 rounded-full ${
            isNeutral ? 'bg-gray-100/50 dark:bg-white/5 border border-gray-200/20' : 'bg-black/20 border border-white/10'
          }`}>
            {[
              { label: 'Katalog', to: `/c/${slug}` },
              { label: 'Tentang Kami', to: `/c/${slug}/about` },
              { label: 'Kontak', to: `/c/${slug}/contact` }
            ].map((link, idx) => (
              link.to ? (
                <NavLink 
                  key={idx} 
                  to={link.to} 
                  end={link.to === `/c/${slug}`}
                  className={({isActive}) => `px-3 md:px-5 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    isActive 
                      ? (isNeutral ? 'bg-white dark:bg-white/10 text-gray-950 dark:text-white shadow-md' : 'bg-white text-gray-950 shadow-lg') 
                      : (isNeutral ? 'text-gray-500 hover:text-gray-950 dark:hover:text-white' : 'text-white/70 hover:text-white')
                  }`}
                >
                  {link.label}
                </NavLink>
              ) : (
                <button 
                  key={idx}
                  onClick={link.onClick}
                  className={`px-3 md:px-5 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    isNeutral ? 'text-gray-500 hover:text-gray-950 dark:hover:text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              )
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
              isNeutral 
                ? 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-300 shadow-md hover:scale-105' 
                : 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 shadow-lg'
            }`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {user && (
            <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full border-2 flex items-center justify-center font-black text-[10px] transition-all duration-300 ${
              isNeutral ? 'bg-gray-900 text-white border-white dark:border-gray-800 shadow-md' : 'bg-gray-900 text-white border-white shadow-lg'
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
