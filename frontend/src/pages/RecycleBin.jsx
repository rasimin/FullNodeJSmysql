import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Trash2, RefreshCcw, Search, Car, Calendar, MapPin, 
  ChevronLeft, ChevronRight, Info, AlertTriangle, X, ArrowUpDown, Image as ImageIcon,
  Eye, History, FileText, Bookmark, TrendingUp, Palette, Gauge, Users, Smartphone,
  Clock, CheckCircle, Wallet, Wrench, Upload, Plus, Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/Modal';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import ViewSwitcher from '../components/ui/ViewSwitcher';
import { formatOfficeHierarchy } from '../utils/hierarchy';
import { IMAGE_BASE_URL } from '../config';

const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

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
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'grid' : 'table');
  const [activeTab, setActiveTab] = useState('main');
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [vehicleDocuments, setVehicleDocuments] = useState([]);
  const [auditTrails, setAuditTrails] = useState([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [salesAgents, setSalesAgents] = useState([]);

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

  const fetchMetadata = async () => {
    try {
      const res = await api.get('/vehicles/initial-data');
      setOffices(formatOfficeHierarchy(res.data.offices));
      setDocumentTypes(res.data.vehicleDocTypes);
      setBrands(res.data.brands);
      setSalesAgents(res.data.agents);
    } catch (e) { console.error('Fetch metadata error:', e); }
  };

  const fetchBookingHistory = async (id) => {
    try { 
      const r = await api.get(`/bookings/vehicle/${id}/history`); 
      setBookingHistory(r.data); 
    } catch (e) { console.error(e); }
  };

  const fetchVehicleDocuments = async (vehicleId) => {
    try {
      const r = await api.get(`/documents/vehicle/${vehicleId}`);
      setVehicleDocuments(r.data);
    } catch (e) { console.error('Fetch docs error:', e); }
  };

  const fetchAuditTrails = async (vehicleId) => {
    setIsAuditLoading(true);
    try {
      const r = await api.get('/logs/audits', {
        params: { vehicle_id: vehicleId, size: 50 }
      });
      setAuditTrails(r.data.items || []);
    } catch (e) {
      console.error('Fetch audit trails error:', e);
    } finally {
      setIsAuditLoading(false);
    }
  };

  const parseAuditValue = (val) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch (e) { return val; }
  };

  const getAuditDisplayValue = (key, value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (key === 'office_id') {
      const office = offices.find(o => o.id.toString() === value.toString());
      return office ? office.name : `ID: ${value}`;
    }
    if (key === 'sales_agent_id') {
      const agent = salesAgents.find(a => a.id.toString() === value.toString());
      return agent ? agent.name : `ID: ${value}`;
    }
    if (key === 'document_type_id') {
      const docType = documentTypes.find(dt => dt.id.toString() === value.toString());
      return docType ? docType.name : `ID: ${value}`;
    }
    if (key === 'price' || key === 'purchase_price' || key === 'service_cost') {
      return formatPrice(value);
    }
    return value.toString();
  };

  const fieldLabels = {
    type: 'Kategori', brand: 'Merk', model: 'Model', year: 'Tahun', plate_number: 'No. Plat',
    price: 'Harga Jual', purchase_price: 'Harga Beli', service_cost: 'Biaya Servis', status: 'Status',
    office_id: 'Kantor Cabang', description: 'Deskripsi', color: 'Warna', odometer: 'Odometer',
    transmission: 'Transmisi', fuel_type: 'Bahan Bakar', sales_agent_id: 'Agen Sales',
    sold_date: 'Tgl Terjual', entry_date: 'Tgl Masuk', file_name: 'Nama File',
    document_type_id: 'Tipe Dokumen', file_path: 'Lokasi File', file_size: 'Ukuran File',
    mime_type: 'Tipe File', uploaded_by: 'Diunggah Oleh', vehicle_id: 'ID Kendaraan', booking_id: 'ID Transaksi', payment_method: 'Metode Bayar'
  };

  const tableLabels = {
    vehicles: 'Data Unit', vehicle_documents: 'Dokumen', vehicle_images: 'Foto Unit', bookings: 'Transaksi'
  };

  const openDetail = (v) => {
    setEditingVehicle(v);
    setActiveTab('main');
    setBookingHistory([]);
    setVehicleDocuments([]);
    setAuditTrails([]);
    fetchBookingHistory(v.id);
    fetchVehicleDocuments(v.id);
    setIsViewModalOpen(true);
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit' && editingVehicle?.id) {
      fetchAuditTrails(editingVehicle.id);
    }
  }, [activeTab, editingVehicle]);

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
        <div className="flex items-center gap-2">
          <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
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

      {viewMode === 'table' ? (
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
                      <td colSpan="6" className="px-6 py-4">
                        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
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
                          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden">
                            {v.images?.find(img => img.is_primary)?.image_url ? (
                              <img src={`${IMAGE_BASE_URL}${v.images.find(img => img.is_primary).image_url}`} className="w-full h-full object-cover" alt="Unit" />
                            ) : v.images?.[0]?.image_url ? (
                                <img src={`${IMAGE_BASE_URL}${v.images[0].image_url}`} className="w-full h-full object-cover" alt="Unit" />
                            ) : (
                                <Car size={20} />
                            )}
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
                            onClick={() => openDetail(v)}
                            className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail"
                          >
                            <Eye size={18} />
                          </button>
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
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-900 rounded-2xl h-64 border border-gray-100 dark:border-gray-800"></div>
            ))
          ) : vehicles.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <Trash2 size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500 font-medium">Tempat sampah kosong</p>
            </div>
          ) : (
            vehicles.map((v) => {
              const displayImage = v.images?.find(img => img.is_primary)?.image_url || v.images?.[0]?.image_url;
              return (
                <div key={v.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col group hover:border-blue-500/30 transition-all">
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    {displayImage ? (
                      <img src={`${IMAGE_BASE_URL}${displayImage}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={v.model} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={32} /></div>
                    )}
                    <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md text-white text-[9px] font-black uppercase">
                            {calculateAge(v.deleted_at)}
                        </span>
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">{v.brand}</p>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase line-clamp-1">{v.model}</h4>
                      <p className="text-[10px] text-gray-400 mt-1">{v.year} • {v.plate_number}</p>
                      
                      <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-2">
                          <MapPin size={12} /> {v.Office?.name}
                        </div>
                        <p className="text-sm font-black text-blue-600">{formatPrice(v.price)}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => openDetail(v)}
                        className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-600 hover:text-white transition-all active:scale-95"
                        title="Lihat Detail"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => setConfirmRestoreId(v.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                      >
                        <RefreshCcw size={14} /> Pulihkan
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(v.id)}
                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

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

      {/* View Detail Modal */}
      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Detail Kendaraan (Terhapus)" 
        maxWidth="max-w-5xl"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('main')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'main' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Car size={14} /> Umum & Media
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'documents' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <FileText size={14} /> Dokumen Legal
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <History size={14} /> Riwayat & Transaksi
            </button>
          </div>
        </div>

        {activeTab === 'main' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Input label="Kategori" value={editingVehicle?.type} readOnly />
                  <Input label="Merek" value={editingVehicle?.brand} readOnly />
                  <Input label="Model / Tipe" value={editingVehicle?.model} readOnly />
                  <Input label="Nomor Plat" value={editingVehicle?.plate_number} readOnly />
                  <Input label="Tahun" value={editingVehicle?.year} readOnly />
                  <Input label="Warna" value={editingVehicle?.color} readOnly />
                  <Input label="Odometer" value={editingVehicle?.odometer ? `${formatPrice(editingVehicle.odometer).replace('Rp', '')} KM` : '-'} readOnly />
                  <Input label="Transmisi" value={editingVehicle?.transmission} readOnly />
                  <Input label="Bahan Bakar" value={editingVehicle?.fuel_type} readOnly />
                  <Input label="Harga Jual" value={formatPrice(editingVehicle?.price)} readOnly />
                  <Input label="Harga Beli" value={formatPrice(editingVehicle?.purchase_price)} readOnly />
                  <Input label="Kantor Cabang" value={editingVehicle?.Office?.name} readOnly />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Deskripsi / Catatan</label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-xs text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800 min-h-[100px]">
                    {editingVehicle?.description || 'Tidak ada catatan.'}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Galeri Foto</label>
                <div className="grid grid-cols-2 gap-2">
                  {editingVehicle?.images?.map((img, idx) => (
                    <div key={img.id || idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 dark:border-gray-800">
                      <img src={`${IMAGE_BASE_URL}${img.image_url}`} className="w-full h-full object-cover" alt="Unit" />
                      {img.is_primary && <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white text-[7px] font-black uppercase rounded shadow-sm">Utama</div>}
                    </div>
                  ))}
                  {(!editingVehicle?.images || editingVehicle.images.length === 0) && (
                    <div className="col-span-2 aspect-video rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-800">
                      <ImageIcon size={32} className="mb-2 opacity-20" />
                      <p className="text-[10px] font-bold uppercase">Tidak ada foto</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'documents' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentTypes.map((type) => {
                const doc = vehicleDocuments.find(d => d.document_type_id === type.id);
                return (
                  <div key={type.id} className={`p-4 rounded-2xl border transition-all ${doc ? 'bg-white dark:bg-gray-800 border-green-100 dark:border-green-900/30' : 'bg-gray-50/50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${doc ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tight">{type.name}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">{doc ? `Diunggah: ${new Date(doc.createdAt).toLocaleDateString('id-ID')}` : 'Belum ada file'}</p>
                        </div>
                      </div>
                    </div>
                    {doc && (
                      <button 
                        onClick={() => window.open(`${IMAGE_BASE_URL}${doc.file_path}`, '_blank')}
                        className="w-full py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2"
                      >
                        <Eye size={14} /> Lihat Dokumen
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Transaction History Section */}
            {bookingHistory.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest ml-1">Riwayat Transaksi Unit</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookingHistory.map((bh, idx) => (
                    <div key={bh.id || idx} className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${bh.status === 'Cancelled' ? 'bg-red-100 text-red-600' : bh.status === 'Sold' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {bh.status === 'Cancelled' ? 'Batal' : bh.status === 'Sold' ? 'Terjual' : 'Booked'}
                          </span>
                          <p className="text-sm font-black text-gray-900 dark:text-white mt-1 uppercase">{bh.customer_name}</p>
                          {bh.payment_method && (
                            <span className={`mt-1 px-1.5 py-0.5 rounded text-[7px] font-black uppercase shadow-sm inline-block ${
                              bh.payment_method === 'Credit' ? 'bg-indigo-600 text-white' : 
                              bh.payment_method === 'Tukar Tambah' ? 'bg-orange-500 text-white' : 
                              'bg-emerald-600 text-white'
                            }`}>
                              {bh.payment_method}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(bh.booking_date).toLocaleDateString('id-ID')}</p>
                          <p className="text-xs font-black text-blue-600 mt-1">{formatPrice(bh.down_payment)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase">
                        <Users size={12} /> Agen: {bh.salesAgent?.name || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Logs Section */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest ml-1">Log Perubahan Data (Audit Trail)</h4>
              {isAuditLoading ? (
                <div className="p-12 text-center text-[10px] font-black text-gray-400 uppercase animate-pulse tracking-widest">Mengambil data audit...</div>
              ) : auditTrails.length === 0 ? (
                <div className="p-12 text-center bg-gray-50 dark:bg-gray-800/20 rounded-[32px] border-2 border-dashed border-gray-100 dark:border-gray-800">
                  <History size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tidak ada riwayat perubahan data</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {auditTrails.map((audit, idx) => (
                    <div key={audit.id || idx} className="p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${audit.action === 'INSERT' ? 'bg-emerald-500' : audit.action === 'UPDATE' ? 'bg-blue-500' : 'bg-red-500'}`}>
                            {audit.action === 'INSERT' ? <Plus size={14} /> : audit.action === 'UPDATE' ? <Edit size={14} /> : <Trash2 size={14} />}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase leading-none">{audit.User?.name || 'Sistem'}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{new Date(audit.createdAt).toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{tableLabels[audit.table_name] || audit.table_name}</span>
                      </div>
                      
                      {audit.action === 'UPDATE' && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.keys(parseAuditValue(audit.new_values) || {}).map(key => {
                            const oldVal = parseAuditValue(audit.old_values)?.[key];
                            const newVal = parseAuditValue(audit.new_values)?.[key];
                            if (oldVal === newVal || !fieldLabels[key]) return null;
                            return (
                              <div key={key} className="p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-1">{fieldLabels[key]}</p>
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <span className="text-[10px] text-red-500 line-through truncate max-w-[80px]">{getAuditDisplayValue(key, oldVal)}</span>
                                  <ArrowUpDown size={8} className="rotate-90 text-gray-300 shrink-0" />
                                  <span className="text-[10px] text-emerald-600 font-bold truncate">{getAuditDisplayValue(key, newVal)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button 
            onClick={() => setIsViewModalOpen(false)}
            className="px-8 py-3 bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all shadow-lg active:scale-95"
          >
            Tutup Detail
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default RecycleBin;
