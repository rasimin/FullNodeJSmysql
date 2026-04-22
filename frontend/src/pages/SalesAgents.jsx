import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IMAGE_BASE_URL } from '../config';
import { 
  Users, UserPlus, Search, Edit2, Trash2, Mail, Phone, MapPin, 
  Building2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  FileText, Filter, MoreVertical, FileSpreadsheet, Plus, LayoutGrid, LayoutList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import ViewSwitcher from '../components/ui/ViewSwitcher';
import Pagination from '../components/ui/Pagination';
import { formatOfficeHierarchy } from '../utils/hierarchy';
import Input from '../components/ui/Input';

const SalesAgents = () => {
  const [agents, setAgents] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'grid' : 'table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', bio: '', office_id: '', status: 'Active'
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const notify = (status, message) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), 2000);
  };

  useEffect(() => {
    fetchAgents();
    fetchOffices();
  }, [page, searchTerm, selectedOffice]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales-agents', {
        params: {
          page: page,
          size: 10,
          search: searchTerm,
          officeId: selectedOffice
        }
      });
      setAgents(res.data.items);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      console.error(err);
      notify('error', 'Gagal memuat agen');
    } finally {
      setLoading(false);
    }
  };

  const fetchOffices = async () => {
    try {
      const res = await api.get('/offices');
      setOffices(Array.isArray(res.data) ? formatOfficeHierarchy(res.data) : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    try {
      notify('loading', 'Mengekspor...');
      const r = await api.get('/export/sales-agents', { 
        params: { search: searchTerm, office_id: selectedOffice },
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url; a.setAttribute('download', 'sales_agents.xlsx'); document.body.appendChild(a); a.click();
      notify('success', 'Ekspor selesai!');
    } catch { notify('error', 'Ekspor gagal'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (avatarFile) data.append('avatar', avatarFile);

    notify('loading', editingAgent ? 'Memperbarui...' : 'Menyimpan...');
    try {
      if (editingAgent) {
        await api.put(`/sales-agents/${editingAgent.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/sales-agents', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsModalOpen(false);
      setEditingAgent(null);
      setAvatarFile(null);
      setPreviewUrl(null);
      setFormData({ name: '', email: '', phone: '', address: '', bio: '', office_id: '', status: 'Active' });
      fetchAgents();
      notify('success', editingAgent ? 'Agen diperbarui!' : 'Agen dibuat!');
    } catch (err) {
      notify('error', err.response?.data?.message || 'Error occurred');
    }
  };

  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email || '',
      phone: agent.phone || '',
      address: agent.address || '',
      bio: agent.bio || '',
      office_id: agent.office_id,
      status: agent.status
    });
    setIsModalOpen(true);
    setPreviewUrl(agent.avatar_url ? `${IMAGE_BASE_URL}${agent.avatar_url}` : null);
    setAvatarFile(null);
  };

  const handleDelete = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    notify('loading', 'Menghapus...');
    try {
      await api.delete(`/sales-agents/${id}`);
      fetchAgents();
      notify('success', 'Agen dihapus');
    } catch (err) {
      notify('error', err.response?.data?.message || 'Error occurred');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const headers = ['Agen', 'Kode', 'Kontak', 'Kantor', 'Status', 'Aksi'];

  return (
    <div className="space-y-6">
      <DynamicIsland
        status={confirmDeleteId ? 'confirm' : notification.status}
        message={confirmDeleteId ? 'Hapus agen ini?' : notification.message}
        onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Tim Sales</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kelola tim sales dan penempatan kantor mereka</p>
        </div>
        <div className="flex gap-2">
          <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
          <button onClick={handleExport} className="btn gap-2 text-xs h-9 shrink-0">
            <FileSpreadsheet size={15} className="text-green-600" /> Ekspor
          </button>
          <button 
            onClick={() => { 
              setEditingAgent(null); 
              setFormData({ name: '', email: '', phone: '', address: '', bio: '', office_id: '', status: 'Active' });
              setPreviewUrl(null);
              setAvatarFile(null);
              setIsModalOpen(true); 
            }}
            className="btn-primary gap-2 text-xs h-9 shrink-0 px-4"
          >
            <Plus size={15} /> Tambah Agen
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Cari berdasarkan nama atau kode..."
            className="input pl-10 h-11"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="input h-11 min-w-[200px]"
            value={selectedOffice}
            onChange={(e) => { setSelectedOffice(e.target.value); setPage(1); }}
          >
            <option value="">Semua Kantor</option>
            {offices.map(o => <option key={o.id} value={o.id}>{o.displayName}</option>)}
          </select>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
                <tr>
                  {headers.map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="relative">
                <AnimatePresence mode="popLayout" initial={false}>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={`skeleton-${i}`} className="border-b border-gray-50 dark:border-gray-800/50">
                        <td colSpan={headers.length} className="px-5 py-4"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-full" /></td>
                      </tr>
                    ))
                  ) : agents.length === 0 ? (
                    <tr><td colSpan={headers.length} className="px-5 py-20 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">Agen tidak ditemukan</td></tr>
                  ) : agents.map((agent) => (
                    <motion.tr
                      key={agent.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden">
                            {agent.avatar_url ? <img src={`${IMAGE_BASE_URL}${agent.avatar_url}`} className="w-full h-full object-cover" /> : <Users size={14} className="text-blue-500" />}
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[10px] font-black text-blue-600">{agent.sales_code}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">
                        <div className="flex flex-col">
                          <span>{agent.email || '-'}</span>
                          <span className="text-[10px]">{agent.phone || '-'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{agent.Office?.name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${agent.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{agent.status === 'Active' ? 'Aktif' : 'Tidak Aktif'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(agent)} className="btn-edit" title="Edit Agent"><Edit2 size={14} /></button>
                          <button onClick={() => setConfirmDeleteId(agent.id)} className="btn-delete" title="Delete Agent"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="card p-4 h-40 animate-pulse bg-gray-50 dark:bg-gray-900/40" />
              ))
            ) : agents.length === 0 ? (
              <div className="col-span-full py-12 text-center card">
                <Users size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Agen sales tidak ditemukan</p>
              </div>
            ) : agents.map((agent) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={agent.id}
                className="card p-3 md:p-4 flex flex-col justify-between gap-3 group hover:bg-blue-50/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-400/50 dark:hover:bg-blue-900/20 dark:hover:border-blue-800/50 transition-all duration-500 hover:-translate-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0 font-bold text-xs overflow-hidden shadow-inner">
                      {agent.avatar_url ? (
                        <img src={`${IMAGE_BASE_URL}${agent.avatar_url}`} alt={agent.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users size={16} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">{agent.name}</h3>
                      <p className="text-[9px] md:text-[10px] text-blue-600 font-black font-mono truncate uppercase tracking-tighter">{agent.sales_code}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <button onClick={() => handleEdit(agent)} className="btn-edit p-1.5" title="Edit Agent">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => setConfirmDeleteId(agent.id)} className="btn-delete p-1.5" title="Delete Agent">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pb-2 border-b border-gray-100 dark:border-gray-800 text-[9px] md:text-xs text-gray-500">
                  <p className="truncate flex items-center gap-2"><Mail size={10} className="text-gray-400" /> {agent.email || '-'}</p>
                  <p className="truncate flex items-center gap-2"><Phone size={10} className="text-gray-400" /> {agent.phone || '-'}</p>
                  <p className="truncate flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
                    <Building2 size={10} className="text-blue-500" /> {agent.Office?.name || 'N/A'}
                  </p>
                </div>

                <div className="flex justify-between items-center text-[8px] md:text-[10px]">
                  <span className="font-black text-gray-400 uppercase tracking-widest truncate max-w-[100px]">{agent.Office?.type?.replace(/_/g, ' ') || 'AGENT'}</span>
                  <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${agent.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {agent.status === 'Active' ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />

      {/* Modal CRUD */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingAgent ? 'Edit Agen Sales' : 'Tambah Agen Sales Baru'}
      >
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 overflow-hidden border-4 border-white dark:border-gray-900 shadow-xl">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Users size={40} />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <span className="text-[10px] font-bold uppercase">Ubah</span>
              </label>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Foto Profil</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Lengkap" icon={Users} required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Misal: John Doe" />
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kantor Penempatan</label>
              <select 
                required className="input h-12"
                value={formData.office_id} onChange={(e) => setFormData({...formData, office_id: e.target.value})}
              >
                <option value="">Pilih Kantor</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.displayName}</option>)}
              </select>
            </div>

            <Input label="Alamat Email" icon={Mail} type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kode Sales</label>
              <input 
                type="text" className="input h-12 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed font-mono font-bold text-blue-600" 
                value={editingAgent?.sales_code || '---'} 
                readOnly 
              />
            </div>

            <Input label="Nomor Telepon" icon={Phone} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+62..." />
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
              <div className="flex gap-4 h-12 items-center px-2">
                {['Active', 'Inactive'].map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" name="status" value={s} 
                      checked={formData.status === s} 
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                    />
                    <span className={`text-xs font-bold uppercase ${formData.status === s ? 'text-blue-600' : 'text-gray-400'}`}>{s === 'Active' ? 'Aktif' : 'Tidak Aktif'}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat</label>
            <textarea 
              className="input min-h-[80px] p-3 text-xs" placeholder="Alamat lengkap..."
              value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Biografi / Catatan</label>
            <textarea 
              className="input min-h-[100px] p-3 text-xs" placeholder="Latar belakang singkat agen sales..."
              value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[10px] font-black uppercase text-gray-400">Batal</button>
            <button type="submit" className="btn-primary px-8 h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
              {editingAgent ? 'Perbarui Agen' : 'Simpan Agen'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SalesAgents;
