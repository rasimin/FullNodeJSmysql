import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Plus, Tags, Trash2, Edit, Car, FileSpreadsheet, Smartphone, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import ViewSwitcher from '../components/ui/ViewSwitcher';
import Pagination from '../components/ui/Pagination';

const BrandManagement = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({ name: '', for_car: false, for_motorcycle: true });
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'grid' : 'table');
  const [search, setSearch] = useState('');

  const notify = (status, message, delay = 2000) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/vehicles/brands?page=${page}&search=${search}`);
      setBrands(r.data.items || []);
      setTotalPages(r.data.total_pages || 1);
    } catch { notify('error', 'Gagal memuat merk'); }
    setLoading(false);
  };

  useEffect(() => { fetchBrands(); }, [page, search]);

  const openModal = (brand = null) => {
    setEditingBrand(brand);
    setFormData(brand ? { name: brand.name, for_car: brand.for_car, for_motorcycle: brand.for_motorcycle } : { name: '', for_car: false, for_motorcycle: true });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.for_car && !formData.for_motorcycle) {
      return notify('error', 'Pilih minimal satu kategori');
    }
    notify('loading', editingBrand ? 'Memperbarui...' : 'Menambah...');
    try {
      editingBrand ? await api.put(`/vehicles/brands/${editingBrand.id}`, formData) : await api.post('/vehicles/brands', formData);
      notify('success', 'Berhasil!'); setIsModalOpen(false); fetchBrands();
    } catch (err) { notify('error', 'Gagal'); }
  };

  const handleDelete = async () => {
    notify('loading', 'Menghapus...');
    try { await api.delete(`/vehicles/brands/${confirmDeleteId}`); setConfirmDeleteId(null); notify('success', 'Dihapus'); fetchBrands(); }
    catch { notify('error', 'Error'); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <DynamicIsland status={confirmDeleteId ? 'confirm' : notification.status} message={confirmDeleteId ? 'Hapus merk?' : notification.message} onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Merk Kendaraan</h1>
          <p className="text-sm text-gray-500">Kelola daftar merk utama</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
          <button onClick={() => openModal()} className="btn-primary gap-2 h-11 px-4 text-sm"><Plus size={18} /> Tambah Merk</button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" className="input pl-10 h-11" placeholder="Cari merk..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {viewMode === 'table' ? (
        <div className="card overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Nama Merk</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Kategori</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic animate-pulse">Memuat merk...</td></tr> : 
               brands.length === 0 ? <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">Merk tidak ditemukan</td></tr> :
               brands.map(b => (
                <tr key={b.id} className="hover:bg-blue-100/40 dark:hover:bg-blue-900/20 transition-colors">
                  <td className="px-6 py-4 font-bold">{b.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                       {b.for_motorcycle && <span className="badge badge-orange">Motor</span>}
                       {b.for_car && <span className="badge badge-blue">Mobil</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(b)} className="btn-edit"><Edit size={16} /></button>
                      <button onClick={() => setConfirmDeleteId(b.id)} className="btn-delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <AnimatePresence mode="popLayout">
            {loading ? [...Array(6)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-gray-50 dark:bg-gray-900/40" />) :
             brands.length === 0 ? <div className="col-span-full py-12 text-center text-gray-400 card italic">No brands found</div> :
             brands.map((b) => (
              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={b.id} 
                className="card p-3 md:p-4 flex flex-col justify-between gap-4 group hover:bg-blue-50/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-400/50 dark:hover:bg-blue-900/20 dark:hover:border-blue-800/50 transition-all duration-500 hover:-translate-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0 font-black group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><Tags size={20} /></div>
                    <div className="min-w-0"><h3 className="text-xs md:text-sm font-black text-gray-900 dark:text-white truncate">{b.name}</h3><p className="text-[10px] text-gray-400 capitalize">Merk Utama</p></div>
                  </div>
                  <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openModal(b)} className="btn-edit p-1"><Edit size={14} /></button>
                    <button onClick={() => setConfirmDeleteId(b.id)} className="btn-delete p-1"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                   {b.for_motorcycle && <span className="px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/20 text-orange-600 text-[9px] font-bold border border-orange-100 dark:border-orange-800">MOTOR</span>}
                   {b.for_car && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/20 text-blue-600 text-[9px] font-bold border border-blue-100 dark:border-blue-800">MOBIL</span>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBrand ? 'Edit Merk' : 'Merk Baru'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nama Merk" icon={Tags} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Misal: BMW, Honda" />
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Kategori</p>
            <div className="flex gap-6 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border">
              <label className="flex items-center gap-2 cursor-pointer grow"><input type="checkbox" checked={formData.for_motorcycle} onChange={e => setFormData({...formData, for_motorcycle: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-orange-600" /><span className="text-sm font-medium">Motor</span></label>
              <label className="flex items-center gap-2 cursor-pointer grow"><input type="checkbox" checked={formData.for_car} onChange={e => setFormData({...formData, for_car: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-blue-600" /><span className="text-sm font-medium">Mobil</span></label>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-3 mt-4">{editingBrand ? 'Perbarui Merk' : 'Simpan Merk'}</button>
        </form>
      </Modal>
    </div>
  );
};

export default BrandManagement;
