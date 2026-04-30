import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  Plus, Search, Filter, Image as ImageIcon, Calendar, MoreVertical, 
  Trash2, Edit, CheckCircle, XCircle, ExternalLink, MapPin, 
  ChevronRight, AlertCircle, Upload, Check, X, Building2, Eye, Link, Layout, BarChart,
  CheckCircle2, Globe, LayoutList, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IMAGE_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ViewSwitcher from '../components/ui/ViewSwitcher';
import { toast } from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'clean']
  ],
};

const Promotions = () => {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [offices, setOffices] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  
  // Filters
  const [filters, setFilters] = useState({
    placement: '',
    status: '',
    office_id: ''
  });

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    placement: 'Slider',
    target_url: '',
    start_date: '',
    end_date: '',
    priority: 0,
    is_all_branches: false,
    office_id: '',
    is_active: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const userRole = user?.role || user?.Role?.name;
  const isSuperAdmin = userRole === 'Super Admin';
  const isHeadOffice = user?.Office?.type === 'HEAD_OFFICE' || user?.office_type === 'HEAD_OFFICE';

  useEffect(() => {
    fetchPromotions();
    if (isSuperAdmin || isHeadOffice) {
      fetchOffices();
    }
  }, [filters]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.placement) params.placement = filters.placement;
      if (filters.status) params.status = filters.status;
      if (filters.office_id) params.office_id = filters.office_id;
      
      const res = await api.get('/promotions', { params });
      setPromotions(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data promosi');
    } finally {
      setLoading(false);
    }
  };

  const fetchOffices = async () => {
    try {
      const res = await api.get('/offices');
      setOffices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDescriptionChange = (content) => {
    setFormData(prev => ({ ...prev, description: content }));
  };

  const stripHtml = (html) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 2MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setSelectedPromo(null);
    setFormData({
      title: '',
      description: '',
      placement: 'Slider',
      target_url: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      priority: 0,
      is_all_branches: false,
      office_id: user?.office_id || '',
      is_active: true
    });
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (promo) => {
    setSelectedPromo(promo);
    setFormData({
      title: promo.title,
      description: promo.description || '',
      placement: promo.placement,
      target_url: promo.target_url || '',
      start_date: promo.start_date,
      end_date: promo.end_date,
      priority: promo.priority,
      is_all_branches: promo.is_all_branches,
      office_id: promo.office_id || '',
      is_active: promo.is_active
    });
    setImageFile(null);
    setImagePreview(IMAGE_BASE_URL + promo.image_path);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(selectedPromo ? 'Memperbarui...' : 'Menyimpan...');
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (selectedPromo) {
        await api.put(`/promotions/${selectedPromo.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Promosi berhasil diperbarui', { id: loadingToast });
      } else {
        await api.post('/promotions', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Promosi berhasil ditambahkan', { id: loadingToast });
      }
      setIsModalOpen(false);
      fetchPromotions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan', { id: loadingToast });
    }
  };

  const handleDelete = async () => {
    const loadingToast = toast.loading('Menghapus...');
    try {
      await api.delete(`/promotions/${selectedPromo.id}`);
      toast.success('Promosi berhasil dihapus', { id: loadingToast });
      setIsDeleteModalOpen(false);
      fetchPromotions();
    } catch (err) {
      toast.error('Gagal menghapus promosi', { id: loadingToast });
    }
  };

  const togglePromoStatus = async (id) => {
    try {
      await api.patch(`/promotions/${id}/toggle`);
      setPromotions(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p));
      toast.success('Status berhasil diubah');
    } catch (err) {
      toast.error('Gagal mengubah status');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Media Promosi</h1>
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">Manajemen banner slider, popup, dan konten visual showroom</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} listLabel="LIST" cardLabel="CARD" />
          <button 
            onClick={openAddModal}
            className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Tambah Promo
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white dark:bg-gray-900/50 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm backdrop-blur-xl">
        <div className="md:col-span-4">
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Berdasarkan Penempatan</label>
          <Select 
            value={filters.placement}
            onChange={(e) => setFilters(prev => ({ ...prev, placement: e.target.value }))}
            placeholder="Semua Penempatan"
            icon={Layout}
            options={[
              { value: 'Slider', label: 'Slider Utama' },
              { value: 'Popup', label: 'Popup Promo' },
              { value: 'Banner', label: 'Banner Kecil' }
            ]}
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Status Keaktifan</label>
          <Select 
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            placeholder="Semua Status"
            icon={CheckCircle}
            options={[
              { value: 'true', label: 'Aktif' },
              { value: 'false', label: 'Tidak Aktif' }
            ]}
          />
        </div>

        {(isSuperAdmin || isHeadOffice) && (
          <div className="md:col-span-3">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Target Cabang</label>
            <Select 
              value={filters.office_id}
              onChange={(e) => setFilters(prev => ({ ...prev, office_id: e.target.value }))}
              placeholder="Semua Cabang"
              icon={Building2}
              options={offices.map(o => ({ value: o.id, label: o.name }))}
            />
          </div>
        )}

        <div className={`md:col-span-${(isSuperAdmin || isHeadOffice) ? '2' : '5'}`}>
          <button 
            onClick={() => setFilters({ placement: '', status: '', office_id: '' })}
            className="w-full h-[46px] bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Promotions List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => (
            <div key={i} className="h-72 bg-gray-100 dark:bg-gray-800/50 rounded-[40px] animate-pulse border border-gray-200 dark:border-gray-800" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-900/30 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-gray-800">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-700 mb-6">
            <ImageIcon size={40} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest text-xs">Media tidak ditemukan</p>
          <button onClick={openAddModal} className="mt-4 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Tambah Media Sekarang</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {promotions.map((promo) => (
            <motion.div 
              key={promo.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white dark:bg-gray-900 rounded-[40px] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
            >
              {/* Media Container */}
              <div className="relative h-52 overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img 
                  src={IMAGE_BASE_URL + promo.image_path} 
                  alt={promo.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                
                {/* Action Buttons - Always Visible */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <button 
                    onClick={() => openEditModal(promo)} 
                    className="w-9 h-9 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-blue-600 rounded-xl shadow-lg hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center border border-white/20 cursor-pointer"
                    title="Edit Promo"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => { setSelectedPromo(promo); setIsDeleteModalOpen(true); }} 
                    className="w-9 h-9 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-red-600 rounded-xl shadow-lg hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-white/20 cursor-pointer"
                    title="Hapus Promo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`h-6 px-3 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center shadow-lg backdrop-blur-md ${
                    promo.is_active ? 'bg-emerald-500/90 text-white' : 'bg-gray-500/90 text-white'
                  }`}>
                    {promo.is_active ? 'Active' : 'Draft'}
                  </span>
                </div>
                
                {/* Placement Badge */}
                <div className="absolute bottom-4 left-4">
                  <div className="h-6 px-3 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest flex items-center shadow-lg">
                    {promo.placement}
                  </div>
                </div>
              </div>

              {/* Info Area */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                   <div className="h-6 px-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 border border-amber-200/50 dark:border-amber-900/50">
                     <BarChart size={12} />
                     Prio: {promo.priority}
                   </div>
                   <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                     <Calendar size={12} />
                     {new Date(promo.end_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                   </div>
                </div>

                <h3 className="font-black text-gray-900 dark:text-white uppercase text-lg tracking-tight line-clamp-1 mb-2 leading-none">{promo.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-6 flex-1 italic">"{stripHtml(promo.description) || 'Tidak ada keterangan tambahan'}"</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Wilayah Target</span>
                    <span className="text-[10px] font-bold">
                      {promo.office_id === null ? (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Globe size={12} /> Nasional (Indonesia)
                        </span>
                      ) : promo.is_all_branches ? (
                        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Building2 size={12} /> Seluruh Cabang {promo.Office?.name}
                        </span>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                          <MapPin size={12} /> {promo.Office?.name || 'Local Office'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => togglePromoStatus(promo.id)}
                    className={`flex-1 h-11 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      promo.is_active 
                      ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 border border-transparent hover:border-red-500/20' 
                      : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200/50 dark:border-emerald-900/50'
                    }`}
                  >
                    {promo.is_active ? 'Set Non-Aktif' : 'Aktifkan Media'}
                  </button>
                  {promo.target_url && (
                    <button 
                      onClick={() => window.open(promo.target_url, '_blank')}
                      className="w-11 h-11 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center border border-blue-200/50 dark:border-blue-900/50 shadow-sm"
                    >
                      <Link size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* List / Table View */
        <div className="bg-white dark:bg-gray-900 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Media & Judul</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Wilayah</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Penempatan</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Periode</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 border border-gray-200 dark:border-gray-700">
                          <img src={IMAGE_BASE_URL + promo.image_path} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{promo.title}</p>
                          <p className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">{stripHtml(promo.description) || 'Tidak ada deskripsi'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {promo.office_id === null ? (
                          <span className="text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase flex items-center gap-1.5">
                            <Globe size={12} /> Nasional
                          </span>
                        ) : promo.is_all_branches ? (
                          <span className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase flex items-center gap-1.5">
                            <Building2 size={12} /> {promo.Office?.name} (HO)
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase flex items-center gap-1.5">
                            <MapPin size={12} /> {promo.Office?.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[9px] font-black uppercase rounded-lg border border-blue-100 dark:border-blue-900/50">
                        {promo.placement}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{new Date(promo.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        <span className="text-[9px] text-gray-400 italic">s/d {new Date(promo.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => togglePromoStatus(promo.id)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm cursor-pointer ${
                          promo.is_active 
                          ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }`}
                      >
                        {promo.is_active ? 'Aktif' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(promo)} className="w-9 h-9 bg-gray-50 dark:bg-gray-800 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer" title="Edit"><Edit size={14} /></button>
                        <button onClick={() => { setSelectedPromo(promo); setIsDeleteModalOpen(true); }} className="w-9 h-9 bg-gray-50 dark:bg-gray-800 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer" title="Hapus"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={selectedPromo ? 'Perbarui Media' : 'Tambah Media Visual'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Media Upload (Left Side / Full Width) */}
            <div className="md:col-span-2 space-y-3">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Asset Media (Rekomendasi: 1920x1080px)</label>
              <div 
                onClick={() => fileInputRef.current.click()}
                className={`relative h-64 rounded-[32px] border-2 border-dashed transition-all cursor-pointer overflow-hidden group/upload ${
                  imagePreview 
                  ? 'border-blue-500/50 bg-blue-50/10' 
                  : 'border-gray-200 dark:border-gray-800 hover:border-blue-500/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                }`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm opacity-0 group-hover/upload:opacity-100 transition-all flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white"><ImageIcon size={24} /></div>
                      <p className="text-white text-[10px] font-black uppercase tracking-widest">Klik Untuk Ganti File</p>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-[24px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 group-hover/upload:scale-110 transition-transform">
                      <Upload size={28} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">Pilih Asset Media</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium italic">Format: JPG, PNG, WEBP (Maks 2MB)</p>
                    </div>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>
            </div>

            {/* Title & Description */}
            <div className="md:col-span-2 space-y-6">
              <Input 
                label="Judul Promosi / Banner" 
                placeholder="Contoh: Gebyar Promo Cicilan Ringan 0%"
                name="title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                icon={Layout}
              />
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Keterangan / Deskripsi Singkat</label>
                <div className="quill-container">
                  <ReactQuill 
                    theme="snow"
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    modules={QUILL_MODULES}
                    placeholder="Tuliskan detail promosi atau CTA yang ingin disampaikan..."
                  />
                </div>
              </div>
            </div>

            {/* Layout & Priority */}
            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <Select 
                label="Penempatan Media"
                value={formData.placement}
                onChange={e => setFormData({ ...formData, placement: e.target.value })}
                icon={Layout}
                options={[
                  { value: 'Slider', label: 'Slider Beranda Utama' },
                  { value: 'Popup', label: 'Popup Iklan (Beranda)' },
                  { value: 'Banner', label: 'Banner Promosi Kecil' }
                ]}
                required
              />
              <Input 
                label="Urutan / Prioritas"
                type="number"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                placeholder="0"
                icon={BarChart}
              />
            </div>

            {/* Date Ranges */}
            <Input 
              label="Mulai Tayang" 
              type="date" 
              value={formData.start_date}
              onChange={e => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
            <Input 
              label="Berakhir Tayang" 
              type="date" 
              value={formData.end_date}
              onChange={e => setFormData({ ...formData, end_date: e.target.value })}
              required
            />

            {/* Link & Status */}
            <div className="md:col-span-2">
              <Input 
                label="Tautan Eksternal (Opsional)" 
                placeholder="https://wa.me/..."
                value={formData.target_url}
                onChange={e => setFormData({ ...formData, target_url: e.target.value })}
                icon={Link}
              />
            </div>

            {/* Branch Targeting & Status (Admin Only) */}
            <div className="md:col-span-2 space-y-4">
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-[32px] border border-gray-100 dark:border-gray-800 space-y-5">
                {/* Global Toggle */}
                {(isSuperAdmin || isHeadOffice) && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Terapkan ke Seluruh Cabang</h4>
                      <p className="text-[10px] text-gray-400 font-medium mt-1">Gunakan ini jika ingin promo muncul di semua lokasi showroom</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="is_all_branches"
                        className="sr-only peer"
                        checked={formData.is_all_branches}
                        onChange={handleInputChange}
                      />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-sm transition-all"></div>
                    </label>
                  </div>
                )}

                {/* Active Toggle */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Status Keaktifan Media</h4>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">Jika non-aktif, promo tidak akan muncul di aplikasi/website</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="is_active"
                      className="sr-only peer"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-sm transition-all"></div>
                  </label>
                </div>

                {!formData.is_all_branches && (isSuperAdmin || isHeadOffice) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-4 border-t border-gray-200 dark:border-gray-700"
                  >
                    <Select 
                      label="Pilih Lokasi Spesifik"
                      value={formData.office_id}
                      onChange={e => setFormData({ ...formData, office_id: e.target.value })}
                      placeholder="Pilih cabang target..."
                      icon={Building2}
                      options={offices.map(o => ({ value: o.id, label: o.name }))}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="flex-[2] h-14 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <CheckCircle2 size={18} />
              {selectedPromo ? 'Simpan Perubahan' : 'Terbitkan Sekarang'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Hapus Asset Media">
        <div className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-[28px] flex items-center justify-center text-red-600 mx-auto shadow-sm">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Konfirmasi Penghapusan</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Asset ini akan dihapus permanen dari sistem dan tidak dapat dipulihkan kembali. Lanjutkan?</p>
          </div>
          <div className="flex gap-4 mt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 font-black uppercase text-[10px] tracking-widest transition-all">Batal</button>
            <button onClick={handleDelete} className="flex-1 h-12 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all">Hapus Permanen</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Promotions;
