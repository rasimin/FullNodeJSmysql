import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Plus, FileSpreadsheet, Trash2, Edit, User, Mail, Lock, Shield, Building2 } from 'lucide-react';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { motion, AnimatePresence } from 'framer-motion';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', username: '', password: '', role_id: '', office_id: '', is_active: true });
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const storedUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('user_data') || '{}');
  const user = storedUser.user || storedUser; // Handle different storage formats
  
  console.log('[UserManagement] Raw Stored User:', storedUser);
  console.log('[UserManagement] Extracted User Info:', user);

  const isSuperAdmin = user?.role === 'Super Admin';
  // Jika metadata kantor belum ada (user belum relogin), default ke 'bukan cabang' agar tombol tidak hilang tiba-tiba
  const isBranchUser = user?.office_type === 'BRANCH_OFFICE' && user?.parent_office_id !== null;
  const canAddUser = isSuperAdmin || !isBranchUser;

  const notify = (status, message, delay = 2000) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/users?page=${page}&search=${search}`);
      setUsers(r.data.items);
      setTotalPages(r.data.total_pages);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    api.get('/roles').then(r => {
      console.log('[UserManagement] Roles API Response:', r.data);
      setRoles(r.data);
    }).catch(err => console.error('[UserManagement] Roles Fetch Error:', err));

    api.get('/offices').then(r => {
      console.log('[UserManagement] Offices API Response:', r.data);
      setOffices(r.data);
    }).catch(err => console.error('[UserManagement] Offices Fetch Error:', err));
  }, []);

  useEffect(() => { fetchUsers(); }, [page, search]);

  const handleExport = async () => {
    try {
      notify('loading', 'Exporting...');
      const r = await api.get('/export/users', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url; a.setAttribute('download', 'users.xlsx'); document.body.appendChild(a); a.click();
      notify('success', 'Export complete!');
    } catch { notify('error', 'Export failed'); }
  };

  const openModal = (user = null) => {
    setEditingUser(user);
    setFormData(user
      ? { name: user.name, email: user.email, username: user.username, password: '', role_id: user.role_id, office_id: user.office_id, is_active: user.is_active }
      : { name: '', email: '', username: '', password: '', role_id: roles[0]?.id || '', office_id: offices[0]?.id || '', is_active: true }
    );
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    notify('loading', editingUser ? 'Updating user...' : 'Creating user...');
    
    try {
      if (editingUser) {
        const data = { ...formData };
        if (!data.password) delete data.password;
        
        console.log(`[User Management] Sending PUT to /users/${editingUser.id}`, data);
        await api.put(`/users/${editingUser.id}`, data);
        notify('success', 'User updated!');
      } else {
        console.log('[User Management] Sending POST to /users', formData);
        await api.post('/users', formData);
        notify('success', 'User created!');
      }
      
      // Hanya tutup modal jika SUKSES
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) { 
      console.error('[User Management] Submit Error:', err);
      notify('error', err.response?.data?.message || 'Operation failed: ' + err.message); 
    }
  };

  const handleDelete = async () => {
    notify('loading', 'Deleting...');
    setConfirmDeleteId(null);
    try {
      await api.delete(`/users/${confirmDeleteId}`);
      notify('success', 'User deleted');
      fetchUsers();
    } catch { notify('error', 'Delete failed'); }
  };

  const headers = ['Name', 'User', 'Email', 'Role', 'Office', 'Status', 'Actions'];

  return (
    <div className="space-y-5">
      <DynamicIsland
        status={confirmDeleteId ? 'confirm' : notification.status}
        message={confirmDeleteId ? 'Delete this user?' : notification.message}
        onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search users..."
            className="input pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn gap-2">
            <FileSpreadsheet size={15} className="text-green-600" /> Export
          </button>
          {canAddUser && (
            <button onClick={() => openModal()} className="btn-primary gap-2">
              <Plus size={15} /> Add User
            </button>
          )}
        </div>
      </div>

      {/* Table */}
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
            <tbody>
              <AnimatePresence>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="table-row">
                      {headers.map(h => (
                        <td key={h} className="px-5 py-3.5">
                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-sm text-gray-400">No users found</td></tr>
                ) : (
                  users.map((user, i) => (
                    <motion.tr key={user.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.15 }}
                      className="table-row"
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{user.name}</td>
                      <td className="px-5 py-3.5 text-blue-600 dark:text-blue-400 font-mono text-xs">{user.username}</td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{user.email || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className="badge badge-blue">{user.Role?.name || 'N/A'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-sm">{user.Office?.name || 'N/A'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${user.is_active ? 'badge-green' : 'badge-red'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1">
                          <button onClick={() => openModal(user)} className="btn-icon text-gray-400 hover:text-blue-600">
                            <Edit size={15} />
                          </button>
                          <button onClick={() => setConfirmDeleteId(user.id)} className="btn-icon text-gray-400 hover:text-red-500">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
            <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'Create User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" icon={User} required value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />

          <Input label="Username" icon={User} required value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})} placeholder="johndoe123" />

          <Input label="Email (Optional)" icon={Mail} type="email" value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />

          <Input label={editingUser ? 'Password (blank = keep)' : 'Password'} icon={Lock} type="password"
            required={!editingUser} value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Role" icon={Shield} value={formData.role_id}
              onChange={e => setFormData({...formData, role_id: e.target.value})}
              options={roles
                .filter(r => isSuperAdmin || r.name !== 'Super Admin')
                .map(r => ({ value: r.id, label: r.name }))} />
            <Select label="Office" icon={Building2} value={formData.office_id}
              onChange={e => setFormData({...formData, office_id: e.target.value})}
              options={offices.map(o => ({ value: o.id, label: o.name }))} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.is_active}
              onChange={e => setFormData({...formData, is_active: e.target.checked})}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active Account</span>
          </label>

          <button type="submit" className="btn-primary w-full py-2.5">
            {editingUser ? 'Save Changes' : 'Create User'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
