import React, { useState } from 'react';
import { Layout, Type, AlignLeft, Save, Pipette, Check } from 'lucide-react';
import Input from '../../components/ui/Input';
import api from '../../services/api';
import { IMAGE_BASE_URL } from '../../config';

const BannerContentTab = ({ setting, onUpdate, notify }) => {
  const [formData, setFormData] = useState({
    title: setting?.title || '',
    description: setting?.description || '',
    theme_color: setting?.theme_color || 'blue',
    layout_template: setting?.layout_template || 'classic',
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(setting?.header_image ? `${IMAGE_BASE_URL}${setting.header_image}` : null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    notify('loading', 'Menyimpan banner & konten...');
    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('theme_color', formData.theme_color);
      form.append('layout_template', formData.layout_template);
      form.append('remove_image', removeImage);
      if (imageFile) form.append('header_image', imageFile);

      // Send other existing fields to avoid nullifying them
      form.append('slug', setting.slug);
      form.append('is_published', setting.is_published);
      form.append('about_content', setting.about_content);

      const res = await api.put(`/showroom-settings/${setting.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onUpdate(res.data.setting);
      notify('success', 'Banner & konten berhasil diperbarui');
    } catch (err) {
      notify('error', err.response?.data?.message || 'Gagal menyimpan banner & konten');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="card p-6 md:p-8 space-y-8">
        {/* Banner Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Layout size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest">Banner Header</h3>
          </div>
          <div className="space-y-2">
            <div 
              className={`relative w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${
                imagePreview ? 'border-transparent' : 'border-gray-300 dark:border-white/20 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'
              }`}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Banner Preview" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
                      Ganti Gambar
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        if (e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                          setImagePreview(URL.createObjectURL(e.target.files[0]));
                          setRemoveImage(false);
                        }
                      }} />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400 p-8 w-full h-full justify-center">
                  <Layout size={32} className="opacity-50" />
                  <span className="text-xs font-bold">Pilih Gambar Banner</span>
                  <span className="text-[10px]">Format: JPG, PNG, WEBP (Max: 2MB)</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    if (e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                      setImagePreview(URL.createObjectURL(e.target.files[0]));
                      setRemoveImage(false);
                    }
                  }} />
                </label>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Atau Pilih Tone Warna Default</label>
              <button 
                type="button" 
                onClick={() => {
                  setFormData({ ...formData, theme_color: 'default' });
                  setImageFile(null);
                  setImagePreview(null);
                  setRemoveImage(true);
                }}
                className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest"
              >
                Reset Header
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'blue', hex: '#1e3a8a' },
                { id: 'indigo', hex: '#312e81' },
                { id: 'purple', hex: '#581c87' },
                { id: 'slate', hex: '#0f172a' },
                { id: 'emerald', hex: '#064e3b' },
                { id: 'rose', hex: '#881337' }
              ].map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, theme_color: c.id })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.theme_color === c.id ? 'border-gray-900 dark:border-white scale-110 shadow-lg ring-2 ring-blue-500' : 'border-transparent hover:scale-105 shadow-sm'}`}
                  style={{ backgroundColor: c.hex }}
                  title={`Tone ${c.id}`}
                />
              ))}
              
              <div className="relative group">
                <input 
                  type="color" 
                  id="customColor"
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  value={formData.theme_color.startsWith('#') ? formData.theme_color : '#3b82f6'}
                  onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                />
                <button
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all pointer-events-none ${
                    formData.theme_color.startsWith('#') 
                      ? 'border-gray-900 dark:border-white scale-110 shadow-lg ring-2 ring-blue-500' 
                      : 'border-dashed border-gray-300 dark:border-white/20 text-gray-400 hover:border-blue-500 hover:text-blue-500'
                  }`}
                  style={formData.theme_color.startsWith('#') ? { backgroundColor: formData.theme_color } : {}}
                >
                  <Pipette size={14} className={formData.theme_color.startsWith('#') ? 'text-white mix-blend-difference' : ''} />
                </button>
              </div>
            </div>
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
              <AlignLeft size={12} /> Deskripsi Katalog (Singkat)
            </label>
            <textarea
              className="input min-h-[80px] py-3 text-sm"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tuliskan deskripsi menarik tentang showroom Anda..."
            />
          </div>
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
          disabled={saving}
          className="btn-primary w-full h-12 gap-2 uppercase tracking-widest text-xs font-black disabled:opacity-50 disabled:grayscale mt-2"
        >
          <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Banner & Konten'}
        </button>
      </div>
    </form>
  );
};

export default BannerContentTab;
