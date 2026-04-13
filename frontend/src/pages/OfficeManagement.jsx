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

      <div className="flex flex-col gap-8">
        {loading ? (
          [...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-6 animate-pulse">
              <div className="w-80 h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
              </div>
            </div>
          ))
        ) : offices.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-gray-400">No offices found.</p>
          </div>
        ) : (
          offices
            .filter(o => o.type === 'HEAD_OFFICE')
            .map((ho, hoIndex, filteredArray) => (
              <div key={ho.id} className="space-y-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Left: Head Office Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: hoIndex * 0.1 }}
                    className="w-full lg:w-80 flex-shrink-0"
                  >
                    <div className="card-hover p-6 border-l-4 border-purple-500 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-900/5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="icon-box icon-purple">
                          <Building2 size={22} />
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openModal(ho)} className="btn-icon text-gray-400 hover:text-blue-600"><Edit size={14} /></button>
                          <button onClick={() => setConfirmDeleteId(ho.id)} className="btn-icon text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{ho.name}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-4 leading-relaxed">{ho.address || 'No address provided'}</p>
                      <span className="badge badge-purple px-2.5 py-1">HEAD OFFICE</span>
                    </div>
                  </motion.div>

                  {/* Right: Branches Grid */}
                  <div className="flex-1 w-full">
                    <div className="mb-3 flex items-center gap-2">
                       <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Branches Under {ho.name}</h4>
                       <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800" />
                    </div>
                    {ho.branches?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {ho.branches.map((branch, bIndex) => {
                          const fullBranchData = flatOffices.find(f => f.id === branch.id) || branch;
                          return (
                            <motion.div
                              key={branch.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: (hoIndex * 0.1) + (bIndex * 0.05) }}
                              className="card-hover p-4 bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="icon-box icon-blue w-8 h-8">
                                  <Building2 size={16} />
                                </div>
                                <div className="flex gap-0.5">
                                  <button onClick={() => openModal(fullBranchData)} className="btn-icon w-7 h-7 text-gray-400 hover:text-blue-600"><Edit size={12} /></button>
                                  <button onClick={() => setConfirmDeleteId(branch.id)} className="btn-icon w-7 h-7 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                                </div>
                              </div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{branch.name}</h4>
                              <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{fullBranchData.address || 'No address'}</p>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8 border-2 border-dashed border-gray-50 dark:border-gray-800/50 rounded-2xl flex flex-col items-center justify-center text-gray-300 dark:text-gray-700">
                         <Building2 size={32} strokeWidth={1} />
                         <p className="text-xs mt-2 font-medium">No branches mapped yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {hoIndex < filteredArray.length - 1 && (
                  <div className="py-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
                  </div>
                )}
              </div>
            ))
        )}

        {/* Handle orphaned branches (if any) */}
        {!loading && offices.some(o => o.type === 'BRANCH_OFFICE' && !o.parent_id) && (
          <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-100 dark:border-gray-800">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Unmapped Branches</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              {offices.filter(o => o.type === 'BRANCH_OFFICE' && !o.parent_id).map(o => (
                <div key={o.id} className="card p-4">
                   <h5 className="text-sm font-bold">{o.name}</h5>
                   <button onClick={() => openModal(o)} className="text-xs text-blue-600 mt-2">Map to Head Office</button>
                </div>
              ))}
            </div>
          </div>
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
