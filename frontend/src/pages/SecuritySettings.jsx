import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Shield, Timer, Users, UserX, Lock, Save, RefreshCw, 
  Info, CheckCircle, AlertTriangle, Monitor, Globe, LogOut
} from 'lucide-react';

const SecuritySettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const settingsRes = await api.get('/settings');
      setSettings(settingsRes.data);
      
      // Also fetch sessions - wait, we need an endpoint for this
      // Let's assume we have it or I'll add it to auth controller
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key, value) => {
    setSaving(true);
    try {
      await api.put('/settings', { key, value });
      setSettings(settings.map(s => s.key === key ? { ...s, value } : s));
      setSuccess('Setting updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const securitySettings = settings.filter(s => s.group === 'Security');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="text-blue-600" /> Security Configuration
          </h1>
          <p className="text-sm text-gray-500 mt-1 uppercase font-bold tracking-widest text-[10px]">Manage session policies, brute-force protection, and access control.</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-lg animate-in fade-in slide-in-from-right-4">
            <CheckCircle size={16} /> {success}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Policy Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
          <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><Timer size={22} className="text-orange-500" /> Session & Inactivity</h2>
          <div className="space-y-6">
            {securitySettings.filter(s => s.key.includes('session') || s.key.includes('inactivity')).map(s => (
              <div key={s.key} className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{s.description}</label>
                <div className="flex gap-2">
                  {s.key === 'security_single_session' ? (
                    <select 
                      value={s.value}
                      onChange={(e) => handleUpdate(s.key, e.target.value)}
                      className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    >
                      <option value="true">Single Session (Kick others)</option>
                      <option value="false">Multi Session (Allow concurrent)</option>
                    </select>
                  ) : (
                    <div className="relative flex-1">
                      <input 
                        type="number" 
                        defaultValue={s.value}
                        onBlur={(e) => { if (e.target.value !== s.value) handleUpdate(s.key, e.target.value); }}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-black uppercase">
                        {s.key.includes('timeout') ? 'mins' : 'units'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Brute Force Policy Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
          <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><Lock size={22} className="text-red-500" /> Brute-Force Protection</h2>
          <div className="space-y-6">
            {securitySettings.filter(s => s.key.includes('lockout') || s.key.includes('attempts')).map(s => (
              <div key={s.key} className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{s.description}</label>
                <div className="relative">
                  <input 
                    type="number" 
                    defaultValue={s.value}
                    onBlur={(e) => { if (e.target.value !== s.value) handleUpdate(s.key, e.target.value); }}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-black uppercase">
                    {s.key.includes('duration') ? 'mins' : 'attempts'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-5 bg-red-50 dark:bg-red-950/20 rounded-2xl flex gap-3 border border-red-100 dark:border-red-900/10">
            <AlertTriangle className="text-red-500 flex-shrink-0" size={18} />
            <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-tight leading-relaxed">
              Caution: Strict policies may prevent login for valid users with forgotten passwords.
            </p>
          </div>
        </div>

        {/* Access & Password Policy Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
          <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><Users size={22} className="text-blue-500" /> Access & Password</h2>
          <div className="space-y-6">
            {securitySettings.filter(s => s.key.includes('password') || s.key.includes('access')).map(s => (
              <div key={s.key} className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{s.description}</label>
                <div className="flex gap-2">
                  <select 
                    value={s.value}
                    onChange={(e) => handleUpdate(s.key, e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  >
                    <option value="true">YES / ENABLED</option>
                    <option value="false">NO / DISABLED</option>
                  </select>
                </div>
              </div>
            ))}
            {securitySettings.filter(s => s.key.includes('password') || s.key.includes('access')).length === 0 && (
              <div className="text-[10px] font-bold text-gray-400 uppercase py-4">No additional policies configured.</div>
            )}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-900/10 flex gap-6 mt-12">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
          <Info size={32} />
        </div>
        <div>
          <h3 className="font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-tight">Perubahan Dinamis</h3>
          <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-2 leading-relaxed font-bold uppercase tracking-widest opacity-80">
            Semua perubahan pada pengaturan ini akan langsung diterapkan secara real-time ke seluruh sistem. Tidak diperlukan restart server. Setiap perubahan pengaturan ini dicatat dalam <strong>Audit Trail</strong> untuk kebutuhan audit keamanan.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
