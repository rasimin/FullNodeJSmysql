import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import { motion } from 'framer-motion';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const notify = (status, message) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), 2000);
  };

  const fetchRoles = async () => {
    setLoading(true);
    try { const r = await api.get('/roles'); setRoles(r.data); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const openModal = (role = null) => {
    setEditingRole(role);
    setFormData(role ? { name: role.name, description: role.description || '' } : { name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsModalOpen(false);
    notify('loading', editingRole ? 'Updating...' : 'Creating...');
    try {
      editingRole
        ? await api.put(`/roles/${editingRole.id}`, formData)
        : await api.post('/roles', formData);
      notify('success', editingRole ? 'Role updated!' : 'Role created!');
      fetchRoles();
    } catch (err) { notify('error', err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    notify('loading', 'Deleting...');
    setConfirmDeleteId(null);
    try { await api.delete(`/roles/${confirmDeleteId}`); notify('success', 'Role deleted'); fetchRoles(); }
    catch { notify('error', 'Delete failed'); }
  };

  return (
    <div className="space-y-5">
      <DynamicIsland
        status={confirmDeleteId ? 'confirm' : notification.status}
        message={confirmDeleteId ? 'Delete this role?' : notification.message}
        onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900 dark:text-white">Role Management</h1>
        <button onClick={() => openModal()} className="btn-primary"><Plus size={15} /> Add Role</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4" />
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
            </div>
          ))
        ) : roles.length === 0 ? (
          <p className="text-sm text-gray-400 col-span-3">No roles found.</p>
        ) : (
          roles.map((role, i) => (
            <motion.div key={role.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.18 }}
              className="card-hover p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="icon-box icon-green"><ShieldCheck size={20} /></div>
                <div className="flex gap-0.5">
                  <button onClick={() => openModal(role)} className="btn-icon text-gray-400 hover:text-blue-600"><Edit size={14} /></button>
                  <button onClick={() => setConfirmDeleteId(role.id)} className="btn-icon text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{role.name}</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{role.description || 'No description'}</p>
            </motion.div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRole ? 'Edit Role' : 'New Role'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Role Name" required value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Role name" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea className="input resize-none" rows="3" value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Description..." />
          </div>
          <button type="submit" className="btn-primary w-full py-2.5">{editingRole ? 'Save Changes' : 'Create Role'}</button>
        </form>
      </Modal>
    </div>
  );
};

export default RoleManagement;
