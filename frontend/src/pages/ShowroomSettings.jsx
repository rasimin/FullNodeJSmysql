import React, { useState, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../services/api';
import { Rocket, Save, CheckCircle, XCircle, Globe, Layout, Type, AlignLeft, Info, ExternalLink, Shield, Building2, Pipette, Image as ImageIcon, Trash2 } from 'lucide-react';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { IMAGE_BASE_URL } from '../config';
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
    is_published: false,
    theme_color: 'blue',
    about_content: ''
  });
  
  // Image States
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [aboutImage1, setAboutImage1] = useState(null);
  const [aboutPreview1, setAboutPreview1] = useState(null);
  const [removeAbout1, setRemoveAbout1] = useState(false);

  const [aboutImage2, setAboutImage2] = useState(null);
  const [aboutPreview2, setAboutPreview2] = useState(null);
  const [removeAbout2, setRemoveAbout2] = useState(false);

  const [aboutImage3, setAboutImage3] = useState(null);
  const [aboutPreview3, setAboutPreview3] = useState(null);
  const [removeAbout3, setRemoveAbout3] = useState(false);

  const [aboutImage4, setAboutImage4] = useState(null);
  const [aboutPreview4, setAboutPreview4] = useState(null);
  const [removeAbout4, setRemoveAbout4] = useState(false);

  const [aboutImage5, setAboutImage5] = useState(null);
  const [aboutPreview5, setAboutPreview5] = useState(null);
  const [removeAbout5, setRemoveAbout5] = useState(false);

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
      const defaultAboutTemplate = `
        <h1 class="ql-align-center">Tentang Kami</h1>
        <p class="ql-align-center" style="color: #6b7280;">Dedikasi Kami dalam Menghadirkan Kendaraan Impian Anda</p>
        <br/>
        <p>Selamat datang di platform showroom kendaraan kami. Kami adalah mitra terpercaya Anda dalam menemukan kendaraan impian dengan standar kualitas terbaik. Dengan pengalaman bertahun-tahun di industri otomotif, kami berkomitmen untuk menghadirkan unit berkualitas tinggi yang telah melewati proses inspeksi menyeluruh.</p>
        <br/>
        <h3>Visi & Misi Kami</h3>
        <p>Visi kami adalah menjadi showroom pilihan utama yang mengedepankan transparansi dan kepuasan pelanggan. Kami percaya bahwa setiap transaksi bukan sekadar jual beli, melainkan awal dari hubungan jangka panjang yang berlandaskan kepercayaan.</p>
      `;

      setFormData({
        slug: res.data.slug,
        title: res.data.title,
        description: res.data.description,
        is_published: res.data.is_published,
        theme_color: res.data.theme_color || 'blue',
        about_content: res.data.about_content || defaultAboutTemplate
      });
      
      if (res.data.header_image) setImagePreview(`${IMAGE_BASE_URL}${res.data.header_image}`);
      else setImagePreview(null);
      
      if (res.data.about_image_1) setAboutPreview1(`${IMAGE_BASE_URL}${res.data.about_image_1}`);
      else setAboutPreview1(null);

      if (res.data.about_image_2) setAboutPreview2(`${IMAGE_BASE_URL}${res.data.about_image_2}`);
      else setAboutPreview2(null);

      if (res.data.about_image_3) setAboutPreview3(`${IMAGE_BASE_URL}${res.data.about_image_3}`);
      else setAboutPreview3(null);

      if (res.data.about_image_4) setAboutPreview4(`${IMAGE_BASE_URL}${res.data.about_image_4}`);
      else setAboutPreview4(null);

      if (res.data.about_image_5) setAboutPreview5(`${IMAGE_BASE_URL}${res.data.about_image_5}`);
      else setAboutPreview5(null);

      setRemoveImage(false);
      setRemoveAbout1(false);
      setRemoveAbout2(false);
      setRemoveAbout3(false);
      setRemoveAbout4(false);
      setRemoveAbout5(false);
      
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
      const form = new FormData();
      form.append('slug', formData.slug);
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('is_published', formData.is_published);
      form.append('theme_color', formData.theme_color);
      form.append('about_content', formData.about_content);
      
      form.append('remove_image', removeImage);
      form.append('remove_about_image_1', removeAbout1);
      form.append('remove_about_image_2', removeAbout2);
      form.append('remove_about_image_3', removeAbout3);
      form.append('remove_about_image_4', removeAbout4);
      form.append('remove_about_image_5', removeAbout5);

      if (imageFile) form.append('header_image', imageFile);
      if (aboutImage1) form.append('about_image_1', aboutImage1);
      if (aboutImage2) form.append('about_image_2', aboutImage2);
      if (aboutImage3) form.append('about_image_3', aboutImage3);
      if (aboutImage4) form.append('about_image_4', aboutImage4);
      if (aboutImage5) form.append('about_image_5', aboutImage5);

      const res = await api.put(`/showroom-settings/${setting.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSetting(res.data.setting);
      if (res.data.setting.header_image) setImagePreview(`${IMAGE_BASE_URL}${res.data.setting.header_image}`);
      if (res.data.setting.about_image_1) setAboutPreview1(`${IMAGE_BASE_URL}${res.data.setting.about_image_1}`);
      if (res.data.setting.about_image_2) setAboutPreview2(`${IMAGE_BASE_URL}${res.data.setting.about_image_2}`);
      if (res.data.setting.about_image_3) setAboutPreview3(`${IMAGE_BASE_URL}${res.data.setting.about_image_3}`);
      if (res.data.setting.about_image_4) setAboutPreview4(`${IMAGE_BASE_URL}${res.data.setting.about_image_4}`);
      if (res.data.setting.about_image_5) setAboutPreview5(`${IMAGE_BASE_URL}${res.data.setting.about_image_5}`);

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
                  
                  {/* Custom Color Picker */}
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

            {/* Tentang Kami Section */}
            <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-white/5">
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
                    onClick={() => {
                      const defaultAboutTemplate = `
                        <h1 class="ql-align-center">Tentang Kami</h1>
                        <p class="ql-align-center" style="color: #6b7280;">Dedikasi Kami dalam Menghadirkan Kendaraan Impian Anda</p>
                        <br/>
                        <p>Selamat datang di platform showroom kendaraan kami. Kami adalah mitra terpercaya Anda dalam menemukan kendaraan impian dengan standar kualitas terbaik. Dengan pengalaman bertahun-tahun di industri otomotif, kami berkomitmen untuk menghadirkan unit berkualitas tinggi yang telah melewati proses inspeksi menyeluruh.</p>
                        <br/>
                        <h3>Visi & Misi Kami</h3>
                        <p>Visi kami adalah menjadi showroom pilihan utama yang mengedepankan transparansi dan kepuasan pelanggan. Kami percaya bahwa setiap transaksi bukan sekadar jual beli, melainkan awal dari hubungan jangka panjang yang berlandaskan kepercayaan.</p>
                      `;
                      setFormData({ ...formData, about_content: defaultAboutTemplate });
                    }}
                    className="text-[10px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors"
                  >
                    Reset ke Default
                  </button>
                </div>
                <div className="quill-container bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10">
                  <ReactQuill 
                    theme="snow"
                    value={formData.about_content}
                    onChange={(val) => setFormData({ ...formData, about_content: val })}
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
                  {[
                    { id: 1, preview: aboutPreview1, setFile: setAboutImage1, setPreview: setAboutPreview1, setRemove: setRemoveAbout1 },
                    { id: 2, preview: aboutPreview2, setFile: setAboutImage2, setPreview: setAboutPreview2, setRemove: setRemoveAbout2 },
                    { id: 3, preview: aboutPreview3, setFile: setAboutImage3, setPreview: setAboutPreview3, setRemove: setRemoveAbout3 },
                    { id: 4, preview: aboutPreview4, setFile: setAboutImage4, setPreview: setAboutPreview4, setRemove: setRemoveAbout4 },
                    { id: 5, preview: aboutPreview5, setFile: setAboutImage5, setPreview: setAboutPreview5, setRemove: setRemoveAbout5 }
                  ].map((img) => (
                    <div key={img.id} className="relative aspect-video rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 overflow-hidden group">
                      {img.preview ? (
                        <>
                          <img src={img.preview} alt={`About ${img.id}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                            <label className="p-2 bg-white text-gray-900 rounded-full cursor-pointer hover:scale-110 transition-transform">
                              <ImageIcon size={16} />
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                if (e.target.files[0]) {
                                  img.setFile(e.target.files[0]);
                                  img.setPreview(URL.createObjectURL(e.target.files[0]));
                                  img.setRemove(false);
                                }
                              }} />
                            </label>
                            <button 
                              type="button"
                              onClick={() => { img.setPreview(null); img.setFile(null); img.setRemove(true); }}
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
                            if (e.target.files[0]) {
                              img.setFile(e.target.files[0]);
                              img.setPreview(URL.createObjectURL(e.target.files[0]));
                              img.setRemove(false);
                            }
                          }} />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
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
