import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Info, Save, Image as ImageIcon, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { IMAGE_BASE_URL } from '../../config';

const AboutUsTab = ({ setting, onUpdate, notify }) => {
  const [aboutContent, setAboutContent] = useState(setting?.about_content || '');
  const [saving, setSaving] = useState(false);

  // Image States
  const [images, setImages] = useState([
    { id: 1, file: null, preview: setting?.about_image_1 ? `${IMAGE_BASE_URL}${setting.about_image_1}` : null, remove: false },
    { id: 2, file: null, preview: setting?.about_image_2 ? `${IMAGE_BASE_URL}${setting.about_image_2}` : null, remove: false },
    { id: 3, file: null, preview: setting?.about_image_3 ? `${IMAGE_BASE_URL}${setting.about_image_3}` : null, remove: false },
    { id: 4, file: null, preview: setting?.about_image_4 ? `${IMAGE_BASE_URL}${setting.about_image_4}` : null, remove: false },
    { id: 5, file: null, preview: setting?.about_image_5 ? `${IMAGE_BASE_URL}${setting.about_image_5}` : null, remove: false }
  ]);

  const handleImageChange = (id, file) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, file: file, preview: URL.createObjectURL(file), remove: false } : img
    ));
  };

  const handleRemoveImage = (id) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, file: null, preview: null, remove: true } : img
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    notify('loading', 'Menyimpan tentang kami...');
    try {
      const form = new FormData();
      form.append('about_content', aboutContent);
      
      images.forEach(img => {
        form.append(`remove_about_image_${img.id}`, img.remove);
        if (img.file) form.append(`about_image_${img.id}`, img.file);
      });

      // Send other existing fields
      form.append('slug', setting.slug);
      form.append('title', setting.title);
      form.append('description', setting.description);
      form.append('is_published', setting.is_published);
      form.append('theme_color', setting.theme_color);

      const res = await api.put(`/showroom-settings/${setting.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onUpdate(res.data.setting);
      notify('success', 'Halaman tentang kami berhasil diperbarui');
    } catch (err) {
      notify('error', err.response?.data?.message || 'Gagal menyimpan tentang kami');
    } finally {
      setSaving(false);
    }
  };

  const defaultAboutTemplate = `
    <h1 class="ql-align-center">Tentang Kami</h1>
    <p class="ql-align-center" style="color: #6b7280;">Dedikasi Kami dalam Menghadirkan Kendaraan Impian Anda</p>
    <br/>
    <p>Selamat datang di platform showroom kendaraan kami. Kami adalah mitra terpercaya Anda dalam menemukan kendaraan impian dengan standar kualitas terbaik. Dengan pengalaman bertahun-tahun di industri otomotif, kami berkomitmen untuk menghadirkan unit berkualitas tinggi yang telah melewati proses inspeksi menyeluruh.</p>
    <br/>
    <h3>Visi & Misi Kami</h3>
    <p>Visi kami adalah menjadi showroom pilihan utama yang mengedepankan transparansi dan kepuasan pelanggan. Kami percaya bahwa setiap transaksi bukan sekadar jual beli, melainkan awal dari hubungan jangka panjang yang berlandaskan kepercayaan.</p>
  `;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="card p-6 md:p-8 space-y-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Info size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest">Halaman Tentang Kami</h3>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Konten Tentang Kami (WYSIWYG)
              </label>
              <button 
                type="button"
                onClick={() => setAboutContent(defaultAboutTemplate)}
                className="text-[10px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors"
              >
                Reset ke Default
              </button>
            </div>
            <div className="quill-container bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10">
              <ReactQuill 
                theme="snow"
                value={aboutContent}
                onChange={setAboutContent}
                placeholder="Ceritakan sejarah dan keunggulan showroom Anda di sini..."
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['clean']
                  ],
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Galeri Foto Tentang Kami (Max 5 Foto)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-video rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 overflow-hidden group">
                  {img.preview ? (
                    <>
                      <img src={img.preview} alt={`About ${img.id}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                        <label className="p-2 bg-white text-gray-900 rounded-full cursor-pointer hover:scale-110 transition-transform">
                          <ImageIcon size={16} />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            if (e.target.files[0]) handleImageChange(img.id, e.target.files[0]);
                          }} />
                        </label>
                        <button 
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <ImageIcon size={24} className="text-gray-300 mb-1" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Upload Foto {img.id}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        if (e.target.files[0]) handleImageChange(img.id, e.target.files[0]);
                      }} />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full h-12 gap-2 uppercase tracking-widest text-xs font-black disabled:opacity-50 disabled:grayscale"
        >
          <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Tentang Kami'}
        </button>
      </div>
    </form>
  );
};

export default AboutUsTab;
