import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { motion } from 'framer-motion';

const OfficeManagement = () => {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flatOffices, setFlatOffices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'BRANCH_OFFICE', address: '', parent_id: '' });
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const notify = (status, message) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), 2000);
  };

  const fetchOffices = async () => {
    setLoading(true);
    try {
      const r = await api.get('/offices');
      setOffices(r.data);
      const flat = [];
      const walk = (items) => items.forEach(item => { flat.push(item); if (item.branches) walk(item.branches); });
      walk(r.data);
      setFlatOffices(flat);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchOffices(); }, []);

  const openModal = (office = null) => {
    setEditingOffice(office);
    setFormData(office
      ? { name: office.name, type: office.type, address: office.address || '', parent_id: office.parent_id || '' }
      : { name: '', type: 'BRANCH_OFFICE', address: '', parent_id: '' }
    );
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsModalOpen(false);
    notify('loading', editingOffice ? 'Updating...' : 'Creating...');
    try {
      const data = { ...formData };
      if (!data.parent_id) delete data.parent_id;
      editingOffice
        ? await api.put(`/offices/${editingOffice.id}`, data)
        : await api.post('/offices', data);
      notify('success', editingOffice ? 'Office updated!' : 'Office created!');
      fetchOffices();
    } catch (err) { notify('error', err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async () => {
    notify('loading', 'Deleting...');
    setConfirmDeleteId(null);
    try {
      await api.delete(`/offices/${confirmDeleteId}`);
      notify('success', 'Office deleted');
      fetchOffices();
    } catch { notify('error', 'Delete failed'); }
  };

  return (
    <div className="space-y-5">
      <DynamicIsland
        status={confirmDeleteId ? 'confirm' : notification.status}
        message={confirmDeleteId ? 'Delete this office?' : notification.message}
        onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900 dark:text-white">Office Management</h1>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus size={15} /> Add Office
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4" />
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
            </div>
          ))
        ) : offices.length === 0 ? (
          <p className="text-sm text-gray-400 col-span-3">No offices found.</p>
        ) : (
          offices.map((office, i) => (
            <motion.div key={office.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.18 }}
              className="card-hover p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`icon-box ${office.type === 'HEAD_OFFICE' ? 'icon-purple' : 'icon-blue'}`}>
                  <Building2 size={20} />
                </div>
                <div className="flex gap-0.5">
                  <button onClick={() => openModal(office)} className="btn-icon text-gray-400 hover:text-blue-600"><Edit size={14} /></button>
                  <button onClick={() => setConfirmDeleteId(office.id)} className="btn-icon text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{office.name}</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 mb-3 line-clamp-1">{office.address || 'No address'}</p>

              <div className="flex flex-wrap gap-1.5">
                <span className="badge badge-gray">{office.type.replace('_', ' ')}</span>
                {office.parent && <span className="badge" style={{backgroundColor:'#fff7ed',color:'#ea580c'}}>↑ {office.parent.name}</span>}
              </div>

              {office.branches?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Branches</p>
                  <ul className="space-y-1">
                    {office.branches.map(b => (
                      <li key={b.id} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        {b.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOffice ? 'Edit Office' : 'New Office'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Office Name" required value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Office name" />
          <Select label="Type" value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value})}
            options={[{ value: 'HEAD_OFFICE', label: 'Head Office' }, { value: 'BRANCH_OFFICE', label: 'Branch Office' }]} />
          {formData.type === 'BRANCH_OFFICE' && (
            <Select label="Parent Office" value={formData.parent_id}
              onChange={e => setFormData({...formData, parent_id: e.target.value})}
              options={flatOffices.filter(o => o.type === 'HEAD_OFFICE').map(o => ({ value: o.id, label: o.name }))}
              placeholder="Select Parent" />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address</label>
            <textarea className="input resize-none" rows="3" value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Office address..." />
          </div>
          <button type="submit" className="btn-primary w-full py-2.5">{editingOffice ? 'Save Changes' : 'Create Office'}</button>
        </form>
      </Modal>
    </div>
  );
};

export default OfficeManagement;
