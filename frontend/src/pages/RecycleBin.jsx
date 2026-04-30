import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Trash2, RefreshCcw, Search, Car, Calendar, MapPin, 
  ChevronLeft, ChevronRight, Info, AlertTriangle, X, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/Modal';
import Select from '../components/ui/Select';
import { formatOfficeHierarchy } from '../utils/hierarchy';

const RecycleBin = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState(null);
  const [offices, setOffices] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [sortOrder, setSortOrder] = useState('DESC'); // DESC = Newest first (Lowest age)

  const { user } = JSON.parse(localStorage.getItem('user_data') || '{}');
  const isSuperAdmin = user?.role === 'Super Admin';
  const isHeadOffice = isSuperAdmin || !user?.office_id || user?.Office?.parent_id === null;

  const notify = (status, message, delay = 3000) => {
    setNotification({ status, message });
    if (status !== 'loading') {
      setTimeout(() => setNotification({ status: 'idle' }), delay);
    }
  };

  const fetchDeletedVehicles = async (page = currentPage, currentSearch = search, branch = selectedBranch, order = sortOrder) => {
    setLoading(true);
    try {
      const params = { 
        page, 
        size: 10, 
        search: currentSearch, 
        officeId: branch,
        sortOrder: order
      };
      const res = await api.get('/vehicles/deleted/list', { params });
      setVehicles(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalItems(res.data.totalItems);
    } catch (error) {
      console.error('Error fetching deleted vehicles:', error);
      notify('error', 'Gagal memuat data tempat sampah');
    } finally {
      setLoading(false);
    }
  };

  const fetchOffices = async () => {
    try {
      const res = await api.get('/offices');
      setOffices(formatOfficeHierarchy(res.data));
    } catch (error) {
      console.error('Error fetching offices:', error);
    }
  };

  useEffect(() => {
    if (isHeadOffice) fetchOffices();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDeletedVehicles(currentPage, search, selectedBranch, sortOrder);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, search, selectedBranch, sortOrder]);

  const handleRestore = async (id) => {
    notify('loading', 'Memulihkan kendaraan...');
    try {
      await api.post(`/vehicles/deleted/${id}/restore`);
      notify('success', 'Kendaraan berhasil dipulihkan');
      fetchDeletedVehicles();
    } catch (error) {
      notify('error', 'Gagal mempulihkan kendaraan');
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmDeleteId) return;
    notify('loading', 'Menghapus permanen...');
    try {
      await api.delete(`/vehicles/deleted/${confirmDeleteId}/permanent`);
      notify('success', 'Kendaraan dihapus secara permanen');
      setConfirmDeleteId(null);
      fetchDeletedVehicles();
    } catch (error) {
      notify('error', 'Gagal menghapus permanen');
    }
  };

  const calculateAge = (date) => {
    if (!date) return '-';
    const deletedDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - deletedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Hari`;
  };

  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(p);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trash2 className="text-red-500" size={24} />
            Tempat Sampah Kendaraan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola kendaraan yang telah dihapus. Anda dapat memulihkan atau menghapus secara permanen.
          </p>
        </div>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Item</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalItems}</p>
        </div>
        
        <div className="md:col-span-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari berdasarkan merk, model, atau plat nomor..."
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isHeadOffice && (
            <div className="w-full md:w-64">
              <Select
                icon={MapPin}
                value={selectedBranch}
                onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}
                options={[
                  { value: '', label: 'Semua Cabang' },
                  ...offices.map(o => ({ value: o.id, label: o.displayName }))
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kendaraan</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Detail</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kantor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Dihapus Pada</th>
                <th 
                  className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                >
                  <div className="flex items-center gap-1">
                    Usia di Sampah
                    <ArrowUpDown size={12} className={sortOrder === 'ASC' ? 'text-blue-500' : 'text-gray-300'} />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-6 py-4">
                      <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl w-full"></div>
                    </td>
                  </tr>
                ))
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
                        <Trash2 size={24} />
                      </div>
                      <p className="text-sm font-medium text-gray-500">Tidak ada kendaraan di tempat sampah</p>
                    </div>
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Car size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{v.brand} {v.model}</p>
                          <p className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 inline-block mt-1">
                            {v.plate_number}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Calendar size={12} /> {v.year}
                        </p>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {formatPrice(v.price)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-gray-400" />
                        {v.Office?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      <div className="font-medium text-gray-900 dark:text-gray-200">
                        {v.deleted_at ? new Date(v.deleted_at).toLocaleString('id-ID', { 
                          day: '2-digit', month: 'short', year: 'numeric'
                        }) : '-'}
                      </div>
                      <div className="text-[10px] opacity-60">
                        {v.deleted_at ? new Date(v.deleted_at).toLocaleString('id-ID', { 
                          hour: '2-digit', minute: '2-digit'
                        }) : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                        {calculateAge(v.deleted_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setConfirmRestoreId(v.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer"
                          title="Pulihkan"
                        >
                          <RefreshCcw size={18} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(v.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Permanen"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Permanent Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Konfirmasi Hapus Permanen"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl">
            <AlertTriangle className="shrink-0" size={24} />
            <p className="text-sm font-medium">
              Tindakan ini tidak dapat dibatalkan. Kendaraan akan dihapus selamanya dari database.
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Apakah Anda yakin ingin menghapus kendaraan ini secara permanen?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handlePermanentDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95"
            >
              Ya, Hapus Permanen
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={!!confirmRestoreId}
        onClose={() => setConfirmRestoreId(null)}
        title="Konfirmasi Pemulihan Unit"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
            <RefreshCcw className="shrink-0" size={24} />
            <p className="text-sm font-medium">
              Unit akan dikembalikan ke daftar kendaraan aktif dan dapat dilihat kembali oleh semua cabang yang berwenang.
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Apakah Anda yakin ingin memulihkan kendaraan ini?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setConfirmRestoreId(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => {
                handleRestore(confirmRestoreId);
                setConfirmRestoreId(null);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              Ya, Pulihkan Unit
            </button>
          </div>
        </div>
      </Modal>

      {/* Notifications */}
      <AnimatePresence>
        {notification.status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-[60]"
          >
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border ${
              notification.status === 'success' ? 'bg-emerald-500 border-emerald-600 text-white' :
              notification.status === 'error' ? 'bg-red-500 border-red-600 text-white' :
              'bg-blue-600 border-blue-700 text-white'
            }`}>
              {notification.status === 'loading' && <RefreshCcw className="animate-spin" size={18} />}
              <p className="text-sm font-bold">{notification.message}</p>
              {notification.status !== 'loading' && (
                <button onClick={() => setNotification({ status: 'idle', message: '' })}>
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecycleBin;
