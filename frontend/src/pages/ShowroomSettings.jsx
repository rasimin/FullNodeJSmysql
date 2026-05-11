import React, { useState, useEffect, Suspense, lazy } from 'react';
import api from '../services/api';
import { Rocket, Globe, Layout, Info, Building2, ExternalLink, Shield } from 'lucide-react';
import DynamicIsland from '../components/DynamicIsland';
import { useAuth } from '../context/AuthContext';

// Lazy load tabs
const LinkStatusTab = lazy(() => import('./showroom-settings/LinkStatusTab'));
const BannerContentTab = lazy(() => import('./showroom-settings/BannerContentTab'));
const AboutUsTab = lazy(() => import('./showroom-settings/AboutUsTab'));

const ShowroomSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState(null);
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [headOffices, setHeadOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [activeTab, setActiveTab] = useState('link-status');

  const isSuperAdmin = user?.role === 'Super Admin' || user?.Role?.name === 'Super Admin';

  const notify = (status, message, delay = 3000) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

  const fetchSettings = async (officeId = '') => {
    setLoading(true);
    try {
      const res = await api.get('/showroom-settings', { params: { officeId } });
      setSetting(res.data);
      setSelectedOfficeId(res.data.head_office_id);
    } catch (err) {
      console.error(err);
      notify('error', 'Gagal mengambil pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const fetchHeadOffices = async () => {
    try {
      const res = await api.get('/offices');
      const filtered = res.data.filter(o => o.type === 'HEAD_OFFICE');
      setHeadOffices(filtered);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchSettings();
    if (isSuperAdmin) fetchHeadOffices();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Memuat Pengaturan...</p>
        </div>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/c/${setting?.slug}`;

  const tabs = [
    { id: 'link-status', label: 'Link & Status', icon: Globe, component: LinkStatusTab },
    { id: 'banner-content', label: 'Banner & Katalog', icon: Layout, component: BannerContentTab },
    { id: 'about-us', label: 'Tentang Kami', icon: Info, component: AboutUsTab }
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <DynamicIsland
        status={notification.status}
        message={notification.message}
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Setelan Katalog</h1>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
             <Building2 size={14} />
             <p className="text-xs font-bold uppercase tracking-widest">Showroom: {setting?.office?.name || 'Loading...'}</p>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="flex flex-col gap-1.5 min-w-[240px]">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Pilih Head Office (Super Admin)</label>
            <select 
              className="input h-10 py-0 text-xs font-bold uppercase tracking-tight"
              value={selectedOfficeId}
              onChange={(e) => fetchSettings(e.target.value)}
            >
              {headOffices.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs Navigation */}
          <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-2xl gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Active Tab Content */}
          <Suspense fallback={
            <div className="card p-12 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Memuat Form...</p>
            </div>
          }>
            {ActiveComponent && (
              <ActiveComponent 
                setting={setting} 
                onUpdate={(newSetting) => setSetting(newSetting)} 
                notify={notify} 
              />
            )}
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-6 bg-blue-600 text-white border-none shadow-xl shadow-blue-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Rocket size={20} />
              <h3 className="text-xs font-black uppercase tracking-widest">Akses Cepat</h3>
            </div>
            <p className="text-xs font-medium text-blue-100 leading-relaxed mb-6">
              Gunakan link ini untuk dibagikan ke media sosial, kartu nama, atau dibagikan langsung ke pelanggan Anda.
            </p>
            <a 
              href={publicUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all group"
            >
              <span className="text-[10px] font-bold uppercase truncate pr-4">{setting?.slug}</span>
              <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          <div className="card p-6 border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
              <Shield size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest">Informasi</h3>
            </div>
            <ul className="space-y-4">
              {[
                { title: 'Data Terisolasi', desc: 'Hanya unit milik showroom Anda yang akan muncul di link ini.' },
                { title: 'Tanpa Login', desc: 'Pelanggan dapat melihat katalog tanpa perlu membuat akun.' },
                { title: 'SEO Optimized', desc: 'Halaman ini dioptimalkan agar mudah ditemukan di mesin pencari.' }
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.title}</p>
                    <p className="text-[10px] text-gray-400 font-medium leading-normal">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowroomSettings;
