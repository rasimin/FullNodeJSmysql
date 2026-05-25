import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import { motion } from 'framer-motion';

const MENU_LIST = [
  { key: 'dashboard', label: 'Dashboard Utama', hasActions: false, hasScope: true },
  { key: 'sales_report', label: 'Laporan Penjualan', hasActions: false, hasScope: false },
  { key: 'finance_report', label: 'Laporan Keuangan', hasActions: false, hasScope: false },
  { key: 'brands', label: 'Daftar Brand', hasActions: true, hasScope: false },
  { key: 'vehicles', label: 'Daftar Kendaraan', hasActions: true, hasScope: true },
  { key: 'transactions', label: 'Data Transaksi', hasActions: true, hasScope: true },
  { key: 'offices', label: 'Daftar Kantor', hasActions: true, hasScope: false },
  { key: 'sales_agents', label: 'Tim Sales', hasActions: true, hasScope: false },
  { key: 'locations', label: 'Lokasi & Wilayah', hasActions: true, hasScope: false },
  { key: 'promotions', label: 'Media Promosi', hasActions: true, hasScope: false },
  { key: 'showroom_settings', label: 'Setelan Katalog', hasActions: true, hasScope: false },
  { key: 'recycle_bin', label: 'Tempat Sampah', hasActions: true, hasScope: true },
  { key: 'user_management', label: 'Kelola User', hasActions: true, hasScope: false },
  { key: 'role_management', label: 'Hak Akses (Role)', hasActions: true, hasScope: false },
  { key: 'security_settings', label: 'Setelan Keamanan', hasActions: true, hasScope: false },
  { key: 'admin_sessions', label: 'Monitor Sesi', hasActions: true, hasScope: false },
  { key: 'query_runner', label: 'SQL Query Runner', hasActions: true, hasScope: false },
  { key: 'ui_gallery', label: 'Katalog Komponen UI', hasActions: true, hasScope: false },
  { key: 'activities', label: 'Catatan Aktivitas', hasActions: false, hasScope: false },
  { key: 'audit_trails', label: 'Jejak Audit', hasActions: false, hasScope: false },
];

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: {} });
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const notify = (status, message) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), 2000);
  };

  const fetchRoles = async () => {
    setLoading(true);
    try { 
      const r = await api.get('/roles'); 
      setRoles(r.data); 
    } catch (e) { 
      console.error(e); 
    }
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const openModal = (role = null) => {
    setEditingRole(role);
    
    // Resilient parsing of permissions
    let parsedPerms = {};
    if (role && role.permissions) {
      try {
        parsedPerms = typeof role.permissions === 'string' 
          ? JSON.parse(role.permissions) 
          : role.permissions;
      } catch (err) {
        console.error('Failed to parse permissions:', err);
      }
    }

    // Build initial permissions object matching MENU_LIST
    const initialPermissions = {};
    MENU_LIST.forEach(m => {
      const existing = parsedPerms[m.key] || {};
      initialPermissions[m.key] = {
        access: existing.access || false,
        scope: m.hasScope ? (existing.scope || 'branch') : undefined,
        actions: m.hasActions ? (existing.actions || []) : undefined
      };
    });

    setFormData(
      role 
        ? { name: role.name, description: role.description || '', permissions: initialPermissions } 
        : { name: '', description: '', permissions: initialPermissions }
    );
    setIsModalOpen(true);
  };

  const handlePermissionChange = (menuKey, field, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [menuKey]: {
          ...prev.permissions[menuKey],
          [field]: value
        }
      }
    }));
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
    } catch (err) { 
      notify('error', err.response?.data?.message || 'Failed'); 
    }
  };

  const handleDelete = async () => {
    notify('loading', 'Deleting...');
    setConfirmDeleteId(null);
    try { 
      await api.delete(`/roles/${confirmDeleteId}`); 
      notify('success', 'Role deleted'); 
      fetchRoles(); 
    } catch { 
      notify('error', 'Delete failed'); 
    }
  };

  return (
    <div className="space-y-5">
      <DynamicIsland
        status={confirmDeleteId ? 'confirm' : notification.status}
        message={confirmDeleteId ? 'Delete this role?' : notification.message}
        onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900 dark:text-white">Hak Akses (Role)</h1>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-1.5"><Plus size={15} /> Add Role</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="card p-3 md:p-5 animate-pulse">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 dark:bg-gray-800 rounded-lg md:rounded-xl mb-3 md:mb-4" />
              <div className="h-3 md:h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-2" />
              <div className="h-2.5 md:h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
            </div>
          ))
        ) : roles.length === 0 ? (
          <p className="text-sm text-gray-400 col-span-3">No roles found.</p>
        ) : (
          roles.map((role, i) => (
            <motion.div key={role.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.18 }}
              className="card-hover p-3 md:p-5"
            >
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center bg-green-50 dark:bg-green-900/30 text-green-600">
                  <ShieldCheck size={16} className="md:size-5" />
                </div>
                <div className="flex gap-0.5">
                  <button onClick={() => openModal(role)} className="btn-edit p-1"><Edit size={12} className="md:size-[14px]" /></button>
                  <button onClick={() => setConfirmDeleteId(role.id)} className="btn-delete p-1"><Trash2 size={12} className="md:size-[14px]" /></button>
                </div>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white truncate">{role.name}</h3>
              <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{role.description || 'No description'}</p>
            </motion.div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRole ? 'Edit Role' : 'New Role'} maxWidth="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Role Name" required value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Role name" />
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
              <textarea className="input resize-none py-1.5 px-3" rows="1" value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Description..." />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Konfigurasi Hak Akses Menu</label>
            <div className="overflow-x-auto border border-gray-150 dark:border-gray-800 rounded-xl bg-gray-50/30 dark:bg-gray-900/30 max-h-[50vh]">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-150 dark:border-gray-800 sticky top-0 z-10">
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Menu</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center w-20">Akses</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center w-20">Tambah</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center w-20">Ubah</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center w-20">Hapus</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-44">Cakupan Data (Scope)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80 bg-white dark:bg-[#0c0d12]">
                  {MENU_LIST.map((menu) => {
                    const perm = formData.permissions[menu.key] || { access: false };
                    return (
                      <tr key={menu.key} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all">
                        {/* Menu Name */}
                        <td className="px-4 py-3 text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {menu.label}
                        </td>
                        
                        {/* Akses Checkbox */}
                        <td className="px-4 py-3 text-center">
                          <input 
                            type="checkbox"
                            className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500/20 w-4 h-4 cursor-pointer"
                            checked={perm.access}
                            onChange={(e) => handlePermissionChange(menu.key, 'access', e.target.checked)}
                          />
                        </td>

                        {/* Tambah Checkbox */}
                        <td className="px-4 py-3 text-center">
                          {menu.hasActions && perm.access ? (
                            <input
                              type="checkbox"
                              checked={perm.actions?.includes('create') || false}
                              onChange={(e) => {
                                const newActions = e.target.checked 
                                  ? [...(perm.actions || []), 'create']
                                  : (perm.actions || []).filter(a => a !== 'create');
                                handlePermissionChange(menu.key, 'actions', newActions);
                              }}
                              className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500/20 w-4 h-4 cursor-pointer"
                            />
                          ) : (
                            <span className="text-gray-300 dark:text-gray-700 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Ubah Checkbox */}
                        <td className="px-4 py-3 text-center">
                          {menu.hasActions && perm.access ? (
                            <input
                              type="checkbox"
                              checked={perm.actions?.includes('edit') || false}
                              onChange={(e) => {
                                const newActions = e.target.checked 
                                  ? [...(perm.actions || []), 'edit']
                                  : (perm.actions || []).filter(a => a !== 'edit');
                                handlePermissionChange(menu.key, 'actions', newActions);
                              }}
                              className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500/20 w-4 h-4 cursor-pointer"
                            />
                          ) : (
                            <span className="text-gray-300 dark:text-gray-700 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Hapus Checkbox */}
                        <td className="px-4 py-3 text-center">
                          {menu.hasActions && perm.access ? (
                            <input
                              type="checkbox"
                              checked={perm.actions?.includes('delete') || false}
                              onChange={(e) => {
                                const newActions = e.target.checked 
                                  ? [...(perm.actions || []), 'delete']
                                  : (perm.actions || []).filter(a => a !== 'delete');
                                handlePermissionChange(menu.key, 'actions', newActions);
                              }}
                              className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500/20 w-4 h-4 cursor-pointer"
                            />
                          ) : (
                            <span className="text-gray-300 dark:text-gray-700 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Scope Selection */}
                        <td className="px-4 py-2">
                          {menu.hasScope && perm.access ? (
                            <select
                              value={perm.scope || 'branch'}
                              onChange={(e) => handlePermissionChange(menu.key, 'scope', e.target.value)}
                              className="bg-gray-50 dark:bg-gray-800 text-[11px] text-gray-700 dark:text-gray-300 border border-gray-250 dark:border-gray-700 rounded-lg py-1 px-2 font-medium cursor-pointer focus:ring-1 focus:ring-blue-500/30 outline-none w-full max-w-[130px]"
                            >
                              <option value="all">Semua (Pusat)</option>
                              <option value="branch">Cabang</option>
                              <option value="own">Milik Sendiri</option>
                            </select>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-700 text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-2.5 font-semibold text-xs tracking-wider uppercase">{editingRole ? 'Save Changes' : 'Create Role'}</button>
        </form>
      </Modal>
    </div>
  );
};

export default RoleManagement;
