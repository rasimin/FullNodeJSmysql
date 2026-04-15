import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Plus, FileSpreadsheet, Trash2, Edit, User, Mail, Lock, Shield, Building2, Monitor, LogOut, XCircle, Smartphone, Clock } from 'lucide-react';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { IMAGE_BASE_URL } from '../config';

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
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'grid' : 'table');
  
  // Session Related State
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userSessions, setUserSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('user_data') || '{}');
  const user = storedUser.user || storedUser; 
  
  const isSuperAdmin = user?.role === 'Super Admin';
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
    api.get('/roles').then(r => setRoles(r.data)).catch(console.error);
    api.get('/offices').then(r => setOffices(r.data)).catch(console.error);
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
      editingUser
        ? await api.put(`/users/${editingUser.id}`, formData)
        : await api.post('/users', formData);
      notify('success', editingUser ? 'User updated!' : 'User created!');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) { notify('error', err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async () => {
    notify('loading', 'Deleting...');
    const idToDelete = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await api.delete(`/users/${idToDelete}`);
      notify('success', 'User deleted');
      fetchUsers();
    } catch (err) { 
      notify('error', err.response?.data?.message || 'Delete failed'); 
    }
  };

  const handleViewSessions = async (id) => {
    setSelectedUserId(id);
    setIsSessionsModalOpen(true);
    setSessionsLoading(true);
    try {
      const r = await api.get(`/users/${id}/sessions`);
      setUserSessions(r.data);
    } catch (err) {
      notify('error', 'Failed to fetch sessions');
    }
    setSessionsLoading(false);
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await api.delete(`/users/${selectedUserId}/sessions/${sessionId}`);
      notify('success', 'Session revoked');
      // Refresh list
      const r = await api.get(`/users/${selectedUserId}/sessions`);
      setUserSessions(r.data);
    } catch (err) {
      notify('error', 'Failed to revoke session');
    }
  };

  const headers = ['Name', 'User', 'Email', 'Role', 'Office', 'Status', 'Actions'];

  return (
    <div className="space-y-5">
      <DynamicIsland
        status={confirmDeleteId ? 'confirm' : notification.status}
        message={confirmDeleteId ? 'Delete this user?' : notification.message}
        onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)}
      />

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search users..."
            className="input pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}
            >
              <FileSpreadsheet size={12} /> <span className="hidden sm:inline">Grid</span>
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}
            >
              <User size={12} /> <span className="hidden sm:inline">Card</span>
            </button>
          </div>
          <button onClick={handleExport} className="btn gap-2 text-xs h-9 shrink-0">
            <FileSpreadsheet size={15} className="text-green-600" /> Export
          </button>
          {canAddUser && (
            <button onClick={() => openModal()} className="btn-primary gap-2 text-xs h-9 shrink-0">
              <Plus size={15} /> Add User
            </button>
          )}
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
              <tbody>
                <AnimatePresence mode="wait">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="table-row">
                        {headers.map(h => (
                          <td key={h} className="px-5 py-3.5"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24" /></td>
                        ))}
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-sm text-gray-400">No users found</td></tr>
                  ) : (
                    users.map((u, i) => (
                      <motion.tr key={u.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="table-row"
                      >
                        <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">{u.name}</td>
                        <td className="px-5 py-3.5 text-blue-600 dark:text-blue-400 font-mono text-xs">{u.username}</td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{u.email || '—'}</td>
                        <td className="px-5 py-3.5"><span className="badge badge-blue">{u.Role?.name || 'N/A'}</span></td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{u.Office?.name || 'N/A'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-1">
                            <button onClick={() => handleViewSessions(u.id)} className="btn-icon p-1.5 text-blue-500 hover:bg-blue-50" title="View Sessions"><Monitor size={14} /></button>
                            <button onClick={() => openModal(u)} className="btn-icon p-1.5 text-amber-500 hover:bg-amber-50"><Edit size={14} /></button>
                            <button onClick={() => setConfirmDeleteId(u.id)} className="btn-icon p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="card p-4 h-32 animate-pulse bg-gray-50 dark:bg-gray-900/40" />
              ))
            ) : (
              users.map((u) => (
                <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={u.id}
                  className="card p-3 md:p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0 font-bold text-xs overflow-hidden">
                        {u.avatar ? <img src={`${IMAGE_BASE_URL}${u.avatar}`} alt={u.name} className="w-full h-full object-cover" /> : u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">{u.name}</h3>
                        <p className="text-[9px] md:text-[10px] text-blue-600 font-mono truncate">@{u.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <button onClick={() => handleViewSessions(u.id)} className="btn-icon p-1 text-blue-500"><Monitor size={12} /></button>
                      <button onClick={() => openModal(u)} className="btn-icon p-1 text-amber-500"><Edit size={12} /></button>
                      <button onClick={() => setConfirmDeleteId(u.id)} className="btn-icon p-1 text-red-500"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <div className="space-y-1.5 pb-2 border-b border-gray-100 dark:border-gray-800 text-[9px] md:text-xs text-gray-500 truncate">
                     <p className="truncate flex items-center gap-1.5"><Mail size={10} /> {u.email || '-'}</p>
                     <p className="truncate flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300"><Building2 size={10} /> {u.Office?.name || 'N/A'}</p>
                  </div>
                  <div className="flex justify-between items-center text-[8px] md:text-[10px]">
                    <span className="font-bold text-gray-400 uppercase tracking-widest">{u.Role?.name || 'N/A'}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${u.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Fix - Placed outside the view condition */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn text-[10px] py-1 px-3 disabled:opacity-40">Prev</button>
          <span className="text-[10px] text-gray-500">Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn text-[10px] py-1 px-3 disabled:opacity-40">Next</button>
        </div>
      )}

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
              options={roles.filter(r => isSuperAdmin || r.name !== 'Super Admin').map(r => ({ value: r.id, label: r.name }))} />
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
          <button type="submit" className="btn-primary w-full py-2.5">{editingUser ? 'Save Changes' : 'Create User'}</button>
        </form>
      </Modal>

      {/* Sessions Modal */}
      <Modal isOpen={isSessionsModalOpen} onClose={() => setIsSessionsModalOpen(false)} title="Active User Sessions" maxWidth="max-w-2xl">
        <div className="space-y-4">
          {sessionsLoading ? (
            <div className="p-10 text-center text-xs text-gray-400 font-bold uppercase animate-pulse">Fetching sessions...</div>
          ) : userSessions.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-400 font-bold uppercase">No active sessions for this user</div>
          ) : (
            <div className="grid gap-3">
              {userSessions.map(s => (
                <div key={s.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between transition-all hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-lg text-gray-400">
                      {s.user_agent?.toLowerCase().includes('mobile') ? <Smartphone size={20} /> : <Monitor size={20} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tight">{s.ip_address || 'Unknown IP'}</p>
                      <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1"><Clock size={10} /> {new Date(s.createdAt).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRevokeSession(s.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setIsSessionsModalOpen(false)} className="w-full py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase">Close</button>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
