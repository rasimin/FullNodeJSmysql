import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, Users, Building2, ShieldCheck, LogOut, Shield,
  Menu, X, History, FileText, Sun, Moon, ChevronLeft, ChevronRight, UserCircle, Car, Tags, BarChart2, BarChart3, Search, Rocket, MapPin, Activity, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IMAGE_BASE_URL } from '../config';

const SidebarItem = ({ to, icon: Icon, label, onClick, collapsed, target }) => (
  <div className="relative group">
    <NavLink
      to={to}
      onClick={onClick}
      target={target}
      className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
    >
      <Icon size={18} className="flex-shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
    {collapsed && (
      <span className="tooltip group-hover:opacity-100">{label}</span>
    )}
  </div>
);

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const officeLogo = user?.office_logo || user?.Office?.logo;

  // Dynamic Favicon logic
  useEffect(() => {
    if (officeLogo) {
      const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
      link.rel = 'icon';
      link.href = `${IMAGE_BASE_URL.replace('/uploads', '')}${officeLogo}`;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [officeLogo]);
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const userRole = user?.role || user?.Role?.name;

  const getMenuGroups = () => {
    const groups = [
      {
        title: 'LAPORAN & ANALITIK',
        items: [
          { to: '/', icon: Activity, label: 'Dashboard Utama' },
          { to: '/sales-report', icon: BarChart3, label: 'Laporan Penjualan' },
          { to: '/finance-report', icon: DollarSign, label: 'Laporan Keuangan' },
        ]
      },
      {
        title: 'DATA MASTER',
        items: [
          { to: '/brands', icon: Tags, label: 'Daftar Brand' },
          { to: '/vehicles', icon: Car, label: 'Stok Kendaraan' },
          { to: '/transactions', icon: FileText, label: 'Data Transaksi' },
          { to: '/offices', icon: Building2, label: 'Daftar Kantor' },
          { to: '/sales-agents', icon: Users, label: 'Tim Sales' },
          { to: '/locations', icon: MapPin, label: 'Lokasi & Wilayah' },
          { to: '/catalog', icon: LayoutDashboard, label: 'Katalog Showroom', target: '_blank' },
        ]
      },
      {
        title: 'ADMIN & KEAMANAN',
        items: []
      }
    ];

    // Add Security items based on role
    const securityItems = groups[2].items;
    securityItems.push({ to: '/users', icon: Users, label: 'Kelola User' });
    
    if (userRole === 'Super Admin' || userRole === 'Admin Pusat') {
      securityItems.push(
        { to: '/security-settings', icon: Shield, label: 'Setelan Keamanan' },
        { to: '/admin-sessions', icon: Users, label: 'Monitor Sesi' },
        { to: '/roles', icon: ShieldCheck, label: 'Hak Akses (Role)' },
        { to: '/activities', icon: FileText, label: 'Catatan Aktivitas' },
        { to: '/audit-trails', icon: History, label: 'Jejak Audit' }
      );
    } else {
      securityItems.push(
        { to: '/activities', icon: FileText, label: 'Aktivitas Saya' }
      );
    }
    
    return groups;
  };

  const menuGroups = getMenuGroups();

  const sidebarW = isCollapsed ? 68 : 240;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0a0b0f]">

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className="app-sidebar fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col overflow-hidden"
        initial={false}
        animate={{
          width: sidebarW,
          x: isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024) ? 0 : -sidebarW
        }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            A
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="font-bold text-gray-900 dark:text-white text-sm whitespace-nowrap"
            >
              AdminPanel
            </motion.span>
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="btn-icon ml-auto lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto overflow-x-hidden">
          {/* Search Menu */}
          {!isCollapsed && (
            <div className="px-1 mb-4">
              <div className="relative group/search">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Cari menu..."
                  className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {menuGroups.map((group, gIdx) => {
            const filteredItems = group.items.filter(item => 
              item.label.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                {!isCollapsed && (
                  <p className="px-4 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 opacity-80">
                    {group.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {filteredItems.map((item) => (
                    <SidebarItem
                      key={item.to} {...item}
                      onClick={() => setSidebarOpen(false)}
                      collapsed={isCollapsed}
                    />
                  ))}
                </div>
                {gIdx < menuGroups.length - 1 && (
                  <div className="mx-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800" />
                )}
              </div>
            );
          })}
          
          {searchQuery && menuGroups.every(g => g.items.filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase())).length === 0) && (
            <div className="px-4 py-8 text-center text-xs text-gray-400">
              Menu tidak ditemukan
            </div>
          )}
          {/* Landing Page Link at Bottom */}
          <div className="mt-auto px-1 pt-4 border-t border-gray-100 dark:border-gray-800">
             <SidebarItem 
               to="/landing-page" 
               icon={Rocket} 
               label="Lihat Showroom" 
               onClick={() => setSidebarOpen(false)}
               collapsed={isCollapsed}
               target="_blank"
             />
          </div>
        </nav>

        {/* Collapse Toggle */}
        <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800 hidden lg:flex justify-end flex-shrink-0">
          <button onClick={() => setCollapsed(!isCollapsed)} className="btn-icon">
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="app-header h-14 sticky top-0 z-30 px-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="btn-icon lg:hidden">
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <div className="flex items-center gap-3">
                {officeLogo && (
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm shrink-0 bg-white dark:bg-gray-800">
                    <img src={`${IMAGE_BASE_URL}${officeLogo}`} className="w-full h-full object-cover" alt="" />
                  </div>
                )}
                <div>
                  <p className="text-sm leading-tight text-gray-500 dark:text-gray-400">
                    Selamat datang kembali, <span className="font-bold text-gray-900 dark:text-white">{user?.name?.split(' ')[0]}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 font-medium mt-0.5">
                    <Building2 size={10} className="text-blue-500" />
                    {user?.Office?.name || user?.office || 'Main Panel'}
                    {user?.Office?.Parent?.name && (
                      <> <span className="text-gray-300 dark:text-gray-700">/</span> {user.Office.Parent.name}</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={toggleTheme} className="btn-icon" title="Toggle theme">
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* User Dropdown */}
            <div className="relative flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{user?.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{userRole}</p>
              </div>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white dark:ring-gray-900 overflow-hidden cursor-pointer active:scale-95 transition-transform"
              >
                {user?.avatar
                  ? <img src={`${IMAGE_BASE_URL}${user.avatar}`} alt="" className="w-full h-full object-cover" />
                  : (user?.name?.charAt(0)?.toUpperCase() || 'U')
                }
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl rounded-xl py-1 z-50"
                    >
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 sm:hidden">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                        <p className="text-xs text-gray-400">{userRole}</p>
                      </div>
                      <NavLink to="/profile" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <UserCircle size={14} /> Profil
                      </NavLink>
                      <NavLink to="/sessions" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <ShieldCheck size={14} /> Sesi Saya
                      </NavLink>
                      <button onClick={() => { handleLogout(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <LogOut size={14} /> Keluar
                      </button>
                    </motion.div>
                    
                    {/* Click Outside Overlay */}
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setShowUserMenu(false)}
                    />
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-5 lg:p-7 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
