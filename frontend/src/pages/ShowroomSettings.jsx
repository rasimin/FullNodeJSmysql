import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Rocket, Save, CheckCircle, XCircle, Globe, Layout, Type, AlignLeft, Info, ExternalLink, Shield, Building2 } from 'lucide-react';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const ShowroomSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setting, setSetting] = useState(null);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    is_published: false
  });
  const [slugStatus, setSlugStatus] = useState('idle'); // idle, checking, available, taken
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [headOffices, setHeadOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState('');

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
      setFormData({
        slug: res.data.slug,
        title: res.data.title,
        description: res.data.description,
        is_published: res.data.is_published
      });
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

  // Debounced slug check
  useEffect(() => {
    if (!formData.slug || formData.slug === setting?.slug) {
      setSlugStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        setSlugStatus('invalid');
        return;
      }
      setSlugStatus('checking');
      try {
        const res = await api.get('/showroom-settings/check-slug', { params: { slug: formData.slug } });
        setSlugStatus(res.data.available ? 'available' : 'taken');
      } catch (err) {
        setSlugStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.slug, setting?.slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (slugStatus === 'taken' || slugStatus === 'invalid') return;

    setSaving(true);
    notify('loading', 'Menyimpan pengaturan...');
    try {
      const res = await api.put(`/showroom-settings/${setting.id}`, formData);
      setSetting(res.data.setting);
      notify('success', 'Pengaturan berhasil disimpan');
    } catch (err) {
      notify('error', err.response?.data?.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

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
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-8">
            {/* Slug Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Globe size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">Link Publik (Slug)</h3>
              </div>
              <div className="relative">
                <Input
                  icon={Globe}
                  placeholder="nama-showroom-anda"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className={
                    slugStatus === 'available' ? 'border-green-500 focus:ring-green-500/20' :
                    slugStatus === 'taken' || slugStatus === 'invalid' ? 'border-red-500 focus:ring-red-500/20' : ''
                  }
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {slugStatus === 'checking' && <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />}
                  {slugStatus === 'available' && <CheckCircle size={16} className="text-green-500" />}
                  {(slugStatus === 'taken' || slugStatus === 'invalid') && <XCircle size={16} className="text-red-500" />}
                </div>
              </div>
              <div className="flex flex-col gap-1 px-1">
                <p className="text-[10px] text-gray-400 font-medium italic">
                  Url Preview: <span className="text-blue-500 font-bold">{publicUrl}</span>
                </p>
                {slugStatus === 'taken' && <p className="text-[10px] text-red-500 font-bold uppercase italic">Slug sudah digunakan showroom lain</p>}
                {slugStatus === 'invalid' && <p className="text-[10px] text-red-500 font-bold uppercase italic">Slug hanya boleh huruf, angka, dan tanda hubung (-)</p>}
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Type size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">Konten Katalog</h3>
              </div>
              <Input
                label="Judul Katalog"
                icon={Layout}
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Katalog Showroom Jaya Motor"
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <AlignLeft size={12} /> Deskripsi Katalog
                </label>
                <textarea
                  className="input min-h-[100px] py-3 text-sm"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tuliskan deskripsi menarik tentang showroom Anda..."
                />
              </div>
            </div>

            {/* Status Section */}
            <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.is_published ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                  <Rocket size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">Status Publikasi</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase italic">{formData.is_published ? 'Katalog dapat diakses publik' : 'Katalog sedang dinonaktifkan'}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.is_published}
                  onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving || slugStatus === 'taken' || slugStatus === 'invalid'}
              className="btn-primary w-full h-12 gap-2 uppercase tracking-widest text-xs font-black disabled:opacity-50 disabled:grayscale"
            >
              <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>

        {/* Info & Help Sidebar */}
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
