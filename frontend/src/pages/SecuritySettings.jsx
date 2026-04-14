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
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="text-blue-600" /> Security Configuration
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage session policies, brute-force protection, and access control.</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-lg animate-in fade-in slide-in-from-right-4">
            <CheckCircle size={16} /> {success}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Policy Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2"><Timer size={20} className="text-orange-500" /> Session & Inactivity</h2>
          <div className="space-y-4">
            {securitySettings.filter(s => s.key.includes('session') || s.key.includes('inactivity')).map(s => (
              <div key={s.key} className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.description}</label>
                <div className="flex gap-2">
                  {s.key === 'security_single_session' ? (
                    <select 
                      value={s.value}
                      onChange={(e) => handleUpdate(s.key, e.target.value)}
                      className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
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
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2"><Lock size={20} className="text-red-500" /> Brute-Force Protection</h2>
          <div className="space-y-4">
            {securitySettings.filter(s => s.key.includes('lockout')).map(s => (
              <div key={s.key} className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.description}</label>
                <div className="relative">
                  <input 
                    type="number" 
                    defaultValue={s.value}
                    onBlur={(e) => { if (e.target.value !== s.value) handleUpdate(s.key, e.target.value); }}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    {s.key.includes('duration') ? 'mins' : 'attempts'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl flex gap-3 border border-red-100 dark:border-red-900/20">
            <AlertTriangle className="text-red-500 flex-shrink-0" size={18} />
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium leading-relaxed">
              Caution: Strict policies may prevent legitimate users from logging in if they forget their passwords frequently.
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/20 flex gap-4">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-300">
          <Info size={24} />
        </div>
        <div>
          <h3 className="font-bold text-blue-900 dark:text-blue-200">Perubahan Dinamis</h3>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
            Semua perubahan pada pengaturan ini akan langsung diterapkan secara real-time ke seluruh sistem. Tidak diperlukan restart server. Setiap perubahan pengaturan ini dicatat dalam <strong>Audit Trail</strong> untuk kebutuhan audit keamanan.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
