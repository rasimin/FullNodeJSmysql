import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Plus, FileSpreadsheet, Trash2, Edit, User, Mail, Lock, Shield, Building2, Monitor, LogOut, XCircle, Smartphone, Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { formatOfficeHierarchy } from '../utils/hierarchy';
import { IMAGE_BASE_URL } from '../config';
import ViewSwitcher from '../components/ui/ViewSwitcher';
import Pagination from '../components/ui/Pagination';

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
  const [roleFilter, setRoleFilter] = useState('');
  const [officeFilter, setOfficeFilter] = useState('');
  
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
      const r = await api.get(`/users`, {
        params: { page, search, role_id: roleFilter, office_id: officeFilter }
      });
      setUsers(Array.isArray(r.data.items) ? r.data.items : []);
      setTotalPages(r.data.total_pages || 1);
    } catch (e) { 
      console.error('Fetch users error:', e);
      notify('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/roles').then(r => setRoles(r.data)).catch(console.error);
    api.get('/offices').then(r => setOffices(formatOfficeHierarchy(r.data))).catch(console.error);
  }, []);

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter, officeFilter]);

  const handleExport = async () => {
    try {
      notify('loading', 'Exporting...');
      const r = await api.get('/export/users', { 
        params: { search, role_id: roleFilter, office_id: officeFilter },
        responseType: 'blob' 
      });
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

      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Kelola User</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Manajemen akun dan hak akses pengguna</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search users..."
              className="input pl-9 h-11"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select 
            className="input h-11 text-xs"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Roles</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          {isSuperAdmin && (
            <select 
              className="input h-11 text-xs"
              value={officeFilter}
              onChange={(e) => { setOfficeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Offices</option>
              {offices.map(o => <option key={o.id} value={o.id}>{o.displayName}</option>)}
            </select>
          )}

          <div className="flex gap-2">
            <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
            <button onClick={handleExport} className="btn gap-2 text-xs h-11 grow flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <FileSpreadsheet size={15} className="text-green-600" /> Export
            </button>
            {canAddUser && (
              <button onClick={() => openModal()} className="btn-primary gap-2 text-xs h-11 grow flex-1">
                <Plus size={15} /> Add New
              </button>
            )}
          </div>
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
                    <motion.tr
                      key="skeleton-loader"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={7} className="p-0">
                        <div className="flex flex-col">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex border-b border-gray-50 dark:border-gray-800/50">
                              {headers.map(h => (
                                <div key={h} className="px-5 py-4 flex-1">
                                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24" />
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </td>
                    </motion.tr>
                  ) : users.length === 0 ? (
                    <motion.tr key="no-data" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td colSpan={7} className="text-center py-10 text-sm text-gray-400 font-medium">No users found</td>
                    </motion.tr>
                  ) : (
                    users.map((u, i) => (
                      <motion.tr 
                        key={u.id}
                        layout
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        className="hover:bg-blue-100/40 dark:hover:bg-blue-900/20 transition-colors group"
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
                            <button onClick={() => handleViewSessions(u.id)} className="btn-icon text-blue-500" title="View Sessions"><Monitor size={14} /></button>
                            <button onClick={() => openModal(u)} className="btn-edit" title="Edit User"><Edit size={14} /></button>
                            <button onClick={() => setConfirmDeleteId(u.id)} className="btn-delete" title="Delete User"><Trash2 size={14} /></button>
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
                  className="card p-3 md:p-4 flex flex-col justify-between gap-3 group hover:bg-blue-50/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-400/50 dark:hover:bg-blue-900/20 dark:hover:border-blue-800/50 transition-all duration-500 hover:-translate-y-1.5"
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
                      <button onClick={() => handleViewSessions(u.id)} className="btn-icon text-blue-500" title="Sessions"><Monitor size={12} /></button>
                      <button onClick={() => openModal(u)} className="btn-edit" title="Edit"><Edit size={12} /></button>
                      <button onClick={() => setConfirmDeleteId(u.id)} className="btn-delete" title="Delete"><Trash2 size={12} /></button>
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

      {/* Pagination Controls */}
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nama Lengkap" icon={User} required value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
          <Input label="Nama Pengguna" icon={User} required value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})} placeholder="johndoe123" />
          <Input label="Email (Opsional)" icon={Mail} type="email" value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
          <Input label={editingUser ? 'Kata Sandi (kosongkan jika tidak diganti)' : 'Kata Sandi'} icon={Lock} type="password"
            required={!editingUser} value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Peran (Role)" icon={Shield} value={formData.role_id}
              onChange={e => setFormData({...formData, role_id: e.target.value})}
              options={roles.filter(r => isSuperAdmin || r.name !== 'Super Admin').map(r => ({ value: r.id, label: r.name }))} />
            <Select label="Kantor" icon={Building2} value={formData.office_id}
              onChange={e => setFormData({...formData, office_id: e.target.value})}
              options={offices.map(o => ({ value: o.id, label: o.displayName }))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.is_active}
              onChange={e => setFormData({...formData, is_active: e.target.checked})}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Akun Aktif</span>
          </label>
          <button type="submit" className="btn-primary w-full py-2.5">{editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}</button>
        </form>
      </Modal>

      {/* Sessions Modal */}
      <Modal isOpen={isSessionsModalOpen} onClose={() => setIsSessionsModalOpen(false)} title="Pantau Sesi Pengguna" maxWidth="max-w-2xl">
        <div className="space-y-4">
          {sessionsLoading ? (
            <div className="p-10 text-center text-xs text-gray-400 font-bold uppercase animate-pulse">Mengambil data sesi...</div>
          ) : userSessions.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-400 font-bold uppercase">Tidak ada sesi aktif untuk pengguna ini</div>
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
          <button onClick={() => setIsSessionsModalOpen(false)} className="w-full py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase">Tutup</button>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
