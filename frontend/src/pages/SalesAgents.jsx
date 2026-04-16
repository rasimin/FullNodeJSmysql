import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IMAGE_BASE_URL } from '../config';
import { 
  Users, UserPlus, Search, Edit2, Trash2, Mail, Phone, MapPin, 
  Building2, ChevronLeft, ChevronRight, FileText, Filter, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/Modal';
import { formatOfficeHierarchy } from '../utils/hierarchy';

const SalesAgents = () => {
  const [agents, setAgents] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', bio: '', office_id: '', status: 'Active'
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    fetchAgents();
    fetchOffices();
  }, [pagination.page, searchTerm, selectedOffice]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales-agents', {
        params: {
          page: pagination.page,
          size: 10,
          search: searchTerm,
          officeId: selectedOffice
        }
      });
      setAgents(res.data.items);
      setPagination(prev => ({ ...prev, totalPages: res.data.total_pages }));
    } catch (err) {
      console.error(err);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (avatarFile) data.append('avatar', avatarFile);

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
    } catch (err) {
      alert(err.response?.data?.message || 'Error occurred');
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sales agent?')) {
      try {
        await api.delete(`/sales-agents/${id}`);
        fetchAgents();
      } catch (err) {
        alert(err.response?.data?.message || 'Error occurred');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Agent Management</h1>
          <p className="text-sm text-gray-500">Manage sales teams and their assigned offices</p>
        </div>
        <button 
          onClick={() => { 
            setEditingAgent(null); 
            setFormData({ name: '', email: '', phone: '', address: '', bio: '', office_id: '', status: 'Active' });
            setPreviewUrl(null);
            setAvatarFile(null);
            setIsModalOpen(true); 
          }}
          className="btn-primary"
        >
          <UserPlus size={18} /> Add New Agent
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by name..."
            className="input pl-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="input h-11 min-w-[200px]"
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
          >
            <option value="">All Offices</option>
            {offices.map(o => <option key={o.id} value={o.id}>{o.displayName}</option>)}
          </select>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        <AnimatePresence mode='popLayout'>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="card p-3 md:p-6 h-[180px] md:h-[220px] animate-pulse bg-gray-50 dark:bg-gray-900/40" />
            ))
          ) : agents.length === 0 ? (
            <div className="col-span-full py-12 text-center card">
              <Users size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No sales agents found.</p>
            </div>
          ) : agents.map((agent) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={agent.id}
              className="card group hover:border-blue-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className="p-3 md:p-6">
                <div className="flex justify-between mb-2 md:mb-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 overflow-hidden ring-2 md:ring-4 ring-white dark:ring-gray-900 shadow-sm">
                    {agent.avatar_url ? (
                      <img src={`${IMAGE_BASE_URL}${agent.avatar_url}`} alt={agent.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={18} className="md:size-6" />
                    )}
                  </div>
                  <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(agent)} className="btn-icon p-1.5 text-amber-500 hover:bg-amber-50">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(agent.id)} className="btn-icon p-1.5 text-red-500 hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex flex-col gap-0.5">
                      <h3 className="font-bold text-gray-900 dark:text-white text-xs md:text-lg truncate">{agent.name}</h3>
                      <span className="w-fit text-[8px] md:text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md uppercase">{agent.sales_code}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] md:text-xs text-gray-500 mt-1">
                      <Building2 size={10} className="text-blue-500" />
                      <span className="truncate">{agent.Office?.name}</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-1.5 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-[9px] md:text-xs text-gray-600 dark:text-gray-400">
                      <Mail size={10} className="shrink-0" /> <span className="truncate">{agent.email || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] md:text-xs text-gray-600 dark:text-gray-400">
                      <Phone size={10} className="shrink-0" /> {agent.phone || '-'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-3 md:px-6 py-2 md:py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-1">
                <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${agent.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                  {agent.status}
                </span>
                <span className="text-[7px] md:text-[10px] text-gray-400 font-medium whitespace-nowrap">Upd: {new Date(agent.updated_at).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button 
            disabled={pagination.page <= 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            className="btn h-9 px-3 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          {[...Array(pagination.totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
              className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${pagination.page === i + 1 ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600'}`}
            >
              {i + 1}
            </button>
          ))}
          <button 
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            className="btn h-9 px-3 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modal CRUD */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingAgent ? 'Edit Sales Agent' : 'Add New Sales Agent'}
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
                <span className="text-[10px] font-bold uppercase">Change</span>
              </label>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Profile Photo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
              <input 
                type="text" required className="input" placeholder="e.g. John Doe"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Office Assigned</label>
              <select 
                required className="input"
                value={formData.office_id} onChange={(e) => setFormData({...formData, office_id: e.target.value})}
              >
                <option value="">Select Office</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.displayName}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
              <input 
                type="email" className="input" placeholder="john@example.com"
                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Sales Code (System Generated)</label>
              <input 
                type="text" className="input bg-gray-100 cursor-not-allowed font-mono font-bold text-blue-600" 
                value={editingAgent?.sales_code || '---'} 
                readOnly 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
              <input 
                type="text" className="input" placeholder="+62..."
                value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
            <div className="flex gap-4">
              {['Active', 'Inactive'].map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="radio" name="status" value={s} 
                    checked={formData.status === s} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${formData.status === s ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
            <textarea 
              className="input min-h-[80px]" placeholder="Full address..."
              value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Biography / Notes</label>
            <textarea 
              className="input min-h-[100px]" placeholder="Brief background of the sales agent..."
              value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Cancel</button>
            <button type="submit" className="btn-primary px-8">
              {editingAgent ? 'Update Agent' : 'Save Agent'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SalesAgents;
