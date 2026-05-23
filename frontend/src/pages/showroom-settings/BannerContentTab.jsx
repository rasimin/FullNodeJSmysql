import React, { useState } from 'react';
import { Layout, Type, AlignLeft, Save, Pipette } from 'lucide-react';
import Input from '../../components/ui/Input';
import api from '../../services/api';
import { IMAGE_BASE_URL } from '../../config';

const BannerContentTab = ({ setting, onUpdate, notify }) => {
  const [formData, setFormData] = useState({
    title: setting?.title || '',
    description: setting?.description || '',
    theme_color: setting?.theme_color || 'blue',
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
              <div className="flex items-center gap-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setFormData({ ...formData, theme_color: 'default' });
                  }}
                  className="text-[10px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-widest"
                >
                  Reset Warna
                </button>
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
