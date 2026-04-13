import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, Users, Building2, ShieldCheck, LogOut,
  Menu, X, History, FileText, Sun, Moon, ChevronLeft, ChevronRight, UserCircle, Car, Tags, BarChart2, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ to, icon: Icon, label, onClick, collapsed }) => (
  <div className="relative group">
    <NavLink
      to={to}
      onClick={onClick}
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
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => { logout(); navigate('/login'); };

  const userRole = user?.role || user?.Role?.name;

  const getMenuItems = () => {
    const items = [
      { to: '/', icon: BarChart2, label: 'Reports & Analytics' },
      { to: '/vehicles', icon: Car, label: 'Vehicles' },
      { to: '/sales-agents', icon: Users, label: 'Sales Agent' },
      { to: '/brands', icon: Tags, label: 'Brand Management' },
      { to: '/offices', icon: Building2, label: 'Office Management' },
    ];

    if (userRole === 'Super Admin' || userRole === 'Admin Pusat') {
      items.push(
        { to: '/roles', icon: ShieldCheck, label: 'Role Management' },
        { to: '/activities', icon: FileText, label: 'Activity Logs' },
        { to: '/audit-trails', icon: History, label: 'Audit Trails' }
      );
    } else {
      items.push({ to: '/activities', icon: FileText, label: 'My Activities' });
    }

    // Move User Management / Dashboard to the bottom
    items.push({ to: '/users', icon: Users, label: 'User Management' });
    
    return items;
  };

  const menuItems = getMenuItems();
  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarW = isCollapsed ? 68 : 240;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-gray-950">

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
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {/* Search Menu */}
          {!isCollapsed && (
            <div className="px-1 mb-4">
              <div className="relative group/search">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {filteredMenuItems.map((item) => (
            <SidebarItem
              key={item.to} {...item}
              onClick={() => setSidebarOpen(false)}
              collapsed={isCollapsed}
            />
          ))}
          {filteredMenuItems.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-gray-400">No menu found</p>
            </div>
          )}
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
              <p className="text-sm leading-tight text-gray-500 dark:text-gray-400">
                Welcome back, <span className="font-bold text-gray-900 dark:text-white">{user?.name?.split(' ')[0]}</span>
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 font-medium mt-0.5">
                <Building2 size={10} className="text-blue-500" />
                {user?.Office?.name || 'Main Panel'}
                {user?.Office?.Parent?.name && (
                  <> <span className="text-gray-300 dark:text-gray-700">/</span> {user.Office.Parent.name}</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={toggleTheme} className="btn-icon" title="Toggle theme">
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* User Dropdown */}
            <div className="relative group flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{user?.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{userRole}</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white dark:ring-gray-900 overflow-hidden">
                {user?.avatar
                  ? <img src={`http://localhost:5001${user.avatar}`} alt="" className="w-full h-full object-cover" />
                  : (user?.name?.charAt(0)?.toUpperCase() || 'U')
                }
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-40 card shadow-lg py-1 
                              opacity-0 invisible translate-y-1
                              group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
                              z-50 transition-all duration-150">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 sm:hidden">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-400">{userRole}</p>
                </div>
                <NavLink to="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <UserCircle size={14} /> Profile
                </NavLink>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
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
