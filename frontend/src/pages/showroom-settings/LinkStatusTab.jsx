import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle, XCircle, Rocket, Save } from 'lucide-react';
import Input from '../../components/ui/Input';
import api from '../../services/api';

const LinkStatusTab = ({ setting, onUpdate, notify }) => {
  const [formData, setFormData] = useState({
    slug: setting?.slug || '',
    is_published: setting?.is_published || false
  });
  const [slugStatus, setSlugStatus] = useState('idle'); // idle, checking, available, taken
  const [saving, setSaving] = useState(false);

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
    notify('loading', 'Menyimpan link & status...');
    try {
      const res = await api.put(`/showroom-settings/${setting.id}`, {
        slug: formData.slug,
        is_published: formData.is_published,
        // Send other existing fields to avoid nullifying them if backend doesn't handle partial
        title: setting.title,
        description: setting.description,
        theme_color: setting.theme_color,
        about_content: setting.about_content
      });
      
      onUpdate(res.data.setting);
      notify('success', 'Link & status berhasil diperbarui');
    } catch (err) {
      notify('error', err.response?.data?.message || 'Gagal menyimpan link & status');
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = `${window.location.origin}/c/${formData.slug}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="card p-6 md:p-8 space-y-8">
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
          <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Link & Status'}
        </button>
      </div>
    </form>
  );
};

export default LinkStatusTab;
