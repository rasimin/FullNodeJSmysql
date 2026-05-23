import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle, XCircle, Rocket, Save, Layout, Check } from 'lucide-react';
import Input from '../../components/ui/Input';
import api from '../../services/api';

const LinkStatusTab = ({ setting, onUpdate, notify }) => {
  const [formData, setFormData] = useState({
    slug: setting?.slug || '',
    is_published: setting?.is_published || false,
    layout_template: setting?.layout_template || 'classic'
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
    notify('loading', 'Menyimpan pengaturan...');
    try {
      const res = await api.put(`/showroom-settings/${setting.id}`, {
        slug: formData.slug,
        is_published: formData.is_published,
        layout_template: formData.layout_template,
        // Send other existing fields to avoid nullifying them if backend doesn't handle partial
        title: setting.title,
        description: setting.description,
        theme_color: setting.theme_color,
        about_content: setting.about_content
      });
      
      onUpdate(res.data.setting);
      notify('success', 'Pengaturan berhasil diperbarui');
    } catch (err) {
      notify('error', err.response?.data?.message || 'Gagal menyimpan pengaturan');
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

        {/* Template Chooser Section */}
        <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Layout size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest">Tema & Tata Letak Katalog</h3>
          </div>
          <div className="flex flex-col gap-3.5">
            
            {/* Classic Dark Grid Template */}
            <div 
              onClick={() => setFormData({ ...formData, layout_template: 'classic' })}
              className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-[1.005] flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden ${
                formData.layout_template === 'classic' 
                  ? 'border-blue-500 bg-blue-500/[0.03] ring-1 ring-blue-500' 
                  : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <div className="aspect-[4/3] w-full sm:w-40 h-28 rounded-xl bg-[#0b0c10] border border-gray-800 relative overflow-hidden shadow-inner p-3 flex flex-col justify-between shrink-0">
                <div className="flex items-center justify-between">
                  <div className="h-2 w-10 bg-white/20 rounded-full" />
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 my-2">
                  <div className="aspect-square rounded-[6px] bg-white/5 border border-white/10 flex items-center justify-center text-[6px] text-white/30 font-black">CAR</div>
                  <div className="aspect-square rounded-[6px] bg-white/5 border border-white/10 flex items-center justify-center text-[6px] text-white/30 font-black">CAR</div>
                  <div className="aspect-square rounded-[6px] bg-white/5 border border-white/10 flex items-center justify-center text-[6px] text-white/30 font-black">CAR</div>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs md:text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">Classic Dark Grid</p>
                <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-tight mt-1 leading-relaxed">Desain grid gelap kaca futuristik bawaan.</p>
              </div>
              {formData.layout_template === 'classic' ? (
                <div className="bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md shrink-0 flex items-center gap-1.5">
                  <Check size={11} strokeWidth={3} /> AKTIF
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shrink-0">
                  PILIH TEMA
                </div>
              )}
            </div>

            {/* Minimalist Clean Light/Dark Template */}
            <div 
              onClick={() => setFormData({ ...formData, layout_template: 'minimalist' })}
              className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-[1.005] flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden ${
                formData.layout_template === 'minimalist' 
                  ? 'border-blue-500 bg-blue-500/[0.03] ring-1 ring-blue-500' 
                  : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <div className="aspect-[4/3] w-full sm:w-40 h-28 rounded-xl bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-white/5 relative overflow-hidden shadow-inner p-3 flex flex-col justify-between shrink-0">
                <div className="flex items-center justify-between">
                  <div className="h-2 w-10 bg-gray-300 dark:bg-white/20 rounded-full" />
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-white/20" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 my-2">
                  <div className="h-4 rounded-[6px] bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center px-2 text-[6px] text-gray-400 font-black justify-between">
                    <span>UNIT YAMAHA</span>
                    <span className="text-[5px] bg-blue-100 text-blue-600 dark:bg-blue-900/30 px-1 py-0.2 rounded font-black">SLS</span>
                  </div>
                  <div className="h-4 rounded-[6px] bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center px-2 text-[6px] text-gray-400 font-black justify-between">
                    <span>UNIT TOYOTA</span>
                    <span className="text-[5px] bg-blue-100 text-blue-600 dark:bg-blue-900/30 px-1 py-0.2 rounded font-black">SLS</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-200 dark:bg-white/10 rounded-full" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs md:text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">Minimalist Clean</p>
                <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-tight mt-1 leading-relaxed">Desain terang/gelap minimalis modern super bersih.</p>
              </div>
              {formData.layout_template === 'minimalist' ? (
                <div className="bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md shrink-0 flex items-center gap-1.5">
                  <Check size={11} strokeWidth={3} /> AKTIF
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shrink-0">
                  PILIH TEMA
                </div>
              )}
            </div>

            {/* Minimalist Luxury Template */}
            <div 
              onClick={() => setFormData({ ...formData, layout_template: 'metropolis' })}
              className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-[1.005] flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden ${
                formData.layout_template === 'metropolis' 
                  ? 'border-blue-500 bg-blue-500/[0.03] ring-1 ring-blue-500' 
                  : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <div className="aspect-[4/3] w-full sm:w-40 h-28 rounded-xl bg-white dark:bg-neutral-950 border border-gray-200 dark:border-white/5 relative overflow-hidden shadow-inner p-2.5 flex flex-col justify-between shrink-0">
                {/* Minimalist Header simulation */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-900 pb-1">
                  <div className="w-2.5 h-2.5 border border-gray-300 dark:border-zinc-700 rounded-none bg-white dark:bg-zinc-950" />
                  <div className="flex gap-1 items-center text-[4px] text-gray-400 dark:text-neutral-500 scale-90">
                    <span>KATALOG</span>
                    <span>✕</span>
                    <span>ABOUT</span>
                  </div>
                </div>
                {/* Floating flat card simulation */}
                <div className="flex gap-2 items-center flex-1 my-1.5">
                  <div className="flex-1 h-full rounded-md bg-neutral-200 dark:bg-neutral-800 border border-gray-100 dark:border-zinc-900 flex items-center justify-center p-1.5 shadow-sm">
                    <div className="h-full w-full bg-white dark:bg-neutral-900 border border-neutral-100/50 dark:border-neutral-800 flex items-center justify-center text-[4px] text-gray-400 font-bold uppercase rounded shadow-2xs">STUDIO</div>
                  </div>
                  <div className="flex-1 h-full rounded-md bg-neutral-200 dark:bg-neutral-800 border border-gray-100 dark:border-zinc-900 flex items-center justify-center p-1.5 shadow-sm">
                    <div className="h-full w-full bg-white dark:bg-neutral-900 border border-neutral-100/50 dark:border-neutral-800 flex items-center justify-center text-[4px] text-gray-400 font-bold uppercase rounded shadow-2xs">STUDIO</div>
                  </div>
                </div>
                {/* Minimalist Footer bottom line */}
                <div className="h-1.5 w-full bg-neutral-100 dark:bg-zinc-900 rounded-[2px]" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs md:text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">Minimalist Luxury</p>
                <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-tight mt-1 leading-relaxed">Desain studio mewah, bersih, tata letak produk melayang, & tipografi super minimalis modern.</p>
              </div>
              {formData.layout_template === 'metropolis' ? (
                <div className="bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md shrink-0 flex items-center gap-1.5">
                  <Check size={11} strokeWidth={3} /> AKTIF
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shrink-0">
                  PILIH TEMA
                </div>
              )}
            </div>

            {/* Left Sidebar Store Template */}
            <div 
              onClick={() => setFormData({ ...formData, layout_template: 'left-sidebar' })}
              className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-[1.005] flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden ${
                formData.layout_template === 'left-sidebar' 
                  ? 'border-blue-500 bg-blue-500/[0.03] ring-1 ring-blue-500' 
                  : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <div className="aspect-[4/3] w-full sm:w-40 h-28 rounded-xl bg-white dark:bg-neutral-950 border border-gray-200 dark:border-white/5 relative overflow-hidden shadow-inner p-2.5 flex gap-2 shrink-0">
                {/* Simulated Left Sidebar */}
                <div className="w-1/4 h-full bg-neutral-100 dark:bg-zinc-900 border-r border-gray-200 dark:border-white/5 rounded-l flex flex-col gap-1 p-1">
                  <div className="h-1.5 w-full bg-blue-500/80 rounded-[2px]" />
                  <div className="h-1 w-full bg-gray-200 dark:bg-white/10 rounded-[2px]" />
                  <div className="h-1 w-3/4 bg-gray-200 dark:bg-white/10 rounded-[2px]" />
                  <div className="h-1 w-1/2 bg-gray-200 dark:bg-white/10 rounded-[2px]" />
                </div>
                {/* Simulated Main Content */}
                <div className="flex-1 h-full flex flex-col gap-1.5 justify-between">
                  <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-950 rounded-[4px] relative overflow-hidden" />
                  <div className="grid grid-cols-2 gap-1 flex-1">
                    <div className="rounded-[4px] bg-neutral-200 dark:bg-neutral-800 border border-gray-100 dark:border-white/5 flex items-center justify-center text-[4px] text-gray-400 font-bold">UNIT</div>
                    <div className="rounded-[4px] bg-neutral-200 dark:bg-neutral-800 border border-gray-100 dark:border-white/5 flex items-center justify-center text-[4px] text-gray-400 font-bold">UNIT</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs md:text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">Left Sidebar Store</p>
                <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-tight mt-1 leading-relaxed">Desain e-commerce profesional dengan sidebar filter terstruktur di sebelah kiri.</p>
              </div>
              {formData.layout_template === 'left-sidebar' ? (
                <div className="bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md shrink-0 flex items-center gap-1.5">
                  <Check size={11} strokeWidth={3} /> AKTIF
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shrink-0">
                  PILIH TEMA
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || slugStatus === 'taken' || slugStatus === 'invalid'}
          className="btn-primary w-full h-12 gap-2 uppercase tracking-widest text-xs font-black disabled:opacity-50 disabled:grayscale"
        >
          <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </form>
  );
};

export default LinkStatusTab;
