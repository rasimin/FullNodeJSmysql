import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, Monitor, Smartphone, Globe, LogOut, XCircle, Clock, MapPin, CheckCircle } from 'lucide-react';
import DynamicIsland from '../components/DynamicIsland';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ status: 'idle', message: '' });

  const notify = (status, message) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), 3000);
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (id) => {
    notify('loading', 'Revoking session...');
    try {
      await api.delete(`/auth/sessions/${id}`);
      notify('success', 'Session revoked');
      fetchSessions();
    } catch (err) {
      notify('error', 'Failed to revoke session');
    }
  };

  const handleRevokeOthers = async () => {
    if (!window.confirm('Keluar dari semua perangkat lain?')) return;
    notify('loading', 'Revoking other sessions...');
    try {
      await api.delete('/auth/sessions/all-others');
      notify('success', 'All other sessions revoked');
      fetchSessions();
    } catch (err) {
      notify('error', 'Failed to revoke sessions');
    }
  };

  const currentToken = localStorage.getItem('token');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <DynamicIsland status={notification.status} message={notification.message} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Sesi Saya</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Manage your logged-in devices</p>
        </div>
        <button 
          onClick={handleRevokeOthers}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-500/5"
        >
          <XCircle size={16} /> Logout Other Devices
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-20 text-center text-gray-400 animate-pulse font-bold uppercase tracking-widest">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="card p-10 text-center text-gray-400 font-bold uppercase tracking-widest">No active sessions found</div>
        ) : (
          sessions.map((s) => {
            const isCurrent = s.token === currentToken;
            const isMobile = s.user_agent?.toLowerCase().includes('mobile');
            
            return (
              <div key={s.id} className={`card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all border-l-4 ${isCurrent ? 'border-l-green-500 bg-green-50/10 shadow-xl shadow-green-500/5' : 'border-l-gray-200 dark:border-l-white/10 opacity-70 hover:opacity-100 hover:border-l-indigo-500'}`}>
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-3xl ${isCurrent ? 'bg-green-100 text-green-600' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                    {isMobile ? <Smartphone size={28} /> : <Monitor size={28} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-gray-900 dark:text-white uppercase text-sm tracking-tight">{isMobile ? 'Mobile Device' : 'Desktop Computer'}</p>
                      {isCurrent && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-lg">Current Device</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-3">
                      <span className="flex items-center gap-1"><Globe size={10} /> {s.ip_address || 'Unknown IP'}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> Last Login: {new Date(s.createdAt).toLocaleString('id-ID')}</span>
                    </p>
                    <p className="text-[9px] text-gray-300 dark:text-gray-600 font-medium truncate max-w-xs md:max-w-md mt-1 italic">{s.user_agent}</p>
                  </div>
                </div>

                {!isCurrent && (
                  <button 
                    onClick={() => handleRevoke(s.id)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 text-gray-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                  >
                    <LogOut size={14} /> Revoke Access
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="card p-8 bg-indigo-600 text-white overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div>
            <h3 className="text-xl font-black uppercase mb-1">Security Dashboard</h3>
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest opacity-80">Keeping your account safe across all devices.</p>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl flex items-center gap-3">
            <Shield className="text-white" size={32} />
            <div className="text-right">
              <p className="text-[10px] font-bold opacity-60">ACCOUNT PROTECTED</p>
              <p className="font-black">SSL SECURE</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>
    </div>
  );
};

export default Sessions;
