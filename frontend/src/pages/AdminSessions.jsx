import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, Monitor, Smartphone, Globe, LogOut, 
  Clock, MapPin, CheckCircle, Shield, Search,
  Filter, Building2, User as UserIcon, X
} from 'lucide-react';
import DynamicIsland from '../components/DynamicIsland';
import { motion, AnimatePresence } from 'framer-motion';
import { IMAGE_BASE_URL } from '../config';

const AdminSessions = () => {
  const [userSessions, setUserSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const notify = (status, message) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), 3000);
  };

  const fetchAllSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/admin/sessions');
      setUserSessions(res.data);
    } catch (err) {
      console.error(err);
      notify('error', 'Gagal memuat data sesi');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllSessions();
  }, []);

  const handleRevokeSession = async (sessionId) => {
    if (!window.confirm('Hapus sesi perangkat ini?')) return;
    notify('loading', 'Menghentikan sesi...');
    try {
      await api.delete(`/auth/admin/sessions/${sessionId}`);
      notify('success', 'Sesi berhasil dihentikan');
      fetchAllSessions();
    } catch (err) {
      notify('error', 'Gagal menghentikan sesi');
    }
  };

  const filteredData = userSessions.filter(item => 
    item.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <DynamicIsland status={notification.status} message={notification.message} />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Active Users Monitor</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Memantau seluruh pengguna yang sedang login</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 text-gray-400">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Cari User..."
              className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 dark:text-gray-200 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="h-8 w-px bg-gray-100 dark:bg-white/10 hidden md:block" />
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase">
            {userSessions.length} Total Users
          </div>
        </div>
      </div>

      {/* Compact List Layout */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
             [...Array(6)].map((_, i) => (
               <div key={i} className="card h-16 animate-pulse bg-gray-50 dark:bg-white/5 border-none" />
             ))
          ) : filteredData.length === 0 ? (
            <div className="card p-20 text-center border-dashed border-2 border-gray-200 dark:border-white/10">
              <Users className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-400 font-bold uppercase tracking-widest">Tidak ada pengguna aktif ditemukan</p>
            </div>
          ) : (
            filteredData.map((item) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={item.user.id} 
                className="card bg-white dark:bg-gray-900 overflow-hidden group hover:shadow-lg transition-all border-none shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center">
                  {/* User Section - Fixed Width on Desktop */}
                  <div className="p-4 flex items-center gap-3 lg:w-72 lg:border-r border-gray-100 dark:border-white/5 shrink-0">
                    <div className="relative shrink-0">
                      {item.user.avatar ? (
                        <img 
                          src={item.user.avatar.startsWith('http') ? item.user.avatar : `${IMAGE_BASE_URL.replace('/uploads', '')}${item.user.avatar}`} 
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100 dark:ring-white/5" 
                          alt="" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">
                          {item.user.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white text-xs uppercase truncate leading-none mb-1">{item.user.name}</h3>
                      <p className="text-[9px] text-gray-400 font-bold uppercase truncate">{item.user.Role?.name} • {item.user.Office?.name || 'Central'}</p>
                    </div>
                  </div>

                  {/* Sessions Section - Scrollable on mobile, flex on desktop */}
                  <div className="flex-1 p-3 bg-gray-50/30 dark:bg-gray-800/20 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-2">
                       {item.sessions.map((session) => {
                         const isMobile = session.user_agent?.toLowerCase().includes('mobile');
                         return (
                           <div 
                             key={session.id} 
                             className="flex items-center gap-2.5 bg-white dark:bg-gray-900 pl-2 pr-1 py-1 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm min-w-max group/sess transition-all hover:border-blue-500/30"
                           >
                             <div className="p-1.5 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-400 group-hover/sess:text-blue-500">
                               {isMobile ? <Smartphone size={12} /> : <Monitor size={12} />}
                             </div>
                             <div className="min-w-0">
                                <p className="text-[9px] font-black text-gray-700 dark:text-gray-200 uppercase leading-none">{session.ip_address || '0.0.0.0'}</p>
                                <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">
                                  {new Date(session.last_activity || session.createdAt).toLocaleString('id-ID', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                             </div>
                             <button 
                               onClick={() => handleRevokeSession(session.id)}
                               className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors ml-1"
                             >
                               <X size={12} />
                             </button>
                           </div>
                         );
                       })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminSessions;
