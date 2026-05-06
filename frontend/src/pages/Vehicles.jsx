import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import {
  Search, Plus, Car, Tag, MapPin,
  Calendar, Info, Edit, Trash2, Filter, Eye,
  ChevronRight, ChevronLeft, ArrowUpDown, Bookmark, Smartphone, User as UserIcon,
  CreditCard, XCircle, CheckCircle, Clock, Camera, Image as ImageIcon, X, Maximize2, Users,
  PlusCircle, TrendingUp, Download, FileSpreadsheet, Palette, Gauge, Wallet, Wrench, History,
  ChevronsLeft, ChevronsRight, Hash, CheckCircle2, FileText, Upload, ArrowRight
} from 'lucide-react';
import Modal from '../components/Modal';

import DynamicIsland from '../components/DynamicIsland';
import PdfViewerModal from '../components/PdfViewerModal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ViewSwitcher from '../components/ui/ViewSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { formatOfficeHierarchy } from '../utils/hierarchy';
import { IMAGE_BASE_URL } from '../config';
import Pagination from '../components/ui/Pagination';

const VehicleModal = lazy(() => import('../components/VehicleModal'));
const BookingModal = lazy(() => import('../components/BookingModal'));

const Vehicles = () => {
  const location = useLocation();
  const [vehicles, setVehicles] = useState([]);
  const [brands, setBrands] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);


  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [salesAgents, setSalesAgents] = useState([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isConfirmActionModalOpen, setIsConfirmActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'sold' or 'cancel'
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookingDocumentTypes, setBookingDocumentTypes] = useState([]);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfDocuments, setPdfDocuments] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null); // { message, onConfirm }

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [summary, setSummary] = useState({ available: 0, booking: 0, sold: 0, total: 0 });
  const isFirstLoad = useRef(true);
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'grid' : 'table');

  const [openMenuId, setOpenMenuId] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);

  const { user } = JSON.parse(localStorage.getItem('user_data') || '{}');
  const isSuperAdmin = user?.role === 'Super Admin';
  const isHeadOffice = isSuperAdmin || !user?.office_id || user?.Office?.parent_id === null;

  const notify = (status, message, delay = 2000) => {
    setNotification({ status, message });
    if (status !== 'loading' && status !== 'confirm') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

  const handlePrintDoc = async (bookingId, type, openModal = true, customerName = '') => {
    notify('loading', 'Menyiapkan pratinjau dokumen...');
    try {
      let url = '';
      let filename = '';
      let label = '';
      
      const customerSuffix = customerName ? `_${customerName.replace(/\s+/g, '_')}` : '';

      if (type === 'receipt' || type === 'invoice') {
        const docType = type === 'receipt' ? 'receipt' : 'dp-invoice';
        label = type === 'receipt' ? 'Kwitansi Reservasi' : 'Invoice Pelunasan';
        filename = type === 'receipt' ? `Reservation_Receipt${customerSuffix}.pdf` : `Settlement_Invoice${customerSuffix}.pdf`;
        
        const res = await api.get(`/export/bookings/${bookingId}?type=${docType}`, { responseType: 'blob' });
        url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      } else if (type === 'deal-proof') {
        label = 'Kwitansi Penjualan';
        filename = `Sales_Receipt${customerSuffix}.pdf`;
        const res = await api.get(`/export/sales/${bookingId}/invoice?isProof=true`, { responseType: 'blob' });
        url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      }

      if (url) {
        const docObj = { title: label, url, filename };
        if (openModal) {
          setPdfDocuments([docObj]);
          setIsPdfModalOpen(true);
          notify('success', `${label} siap!`);
        }
        return docObj;
      }
    } catch (e) {
      console.error('Download error:', e);
      notify('error', 'Gagal membuat dokumen');
      return null;
    }
  };

  const fetchAgentsByOffice = async (officeId) => {
    try {
      const r = await api.get('/sales-agents/active', { params: { officeId } });
      setSalesAgents(r.data);
    } catch (e) { console.error(e); }
  };

  const fetchAllData = async (page = 1, currentSearch = '', signal = null) => {
    setLoading(true);
    try {
      // Parallel fetch everything to avoid waterfall delay
      const [metaRes, sumRes, vehRes] = await Promise.all([
        api.get('/vehicles/initial-data', { signal }),
        api.get('/vehicles/summary', { params: { officeId: selectedBranch }, signal }),
        api.get('/vehicles', { 
          params: { page, size: 8, search: currentSearch, officeId: selectedBranch, status: filterStatus },
          signal 
        })
      ]);

      // Update states in batch
      if (metaRes.data) {
        const { brands: bData, offices: oData, agents: sData, vehicleDocTypes: dtData, bookingDocTypes: bdtData } = metaRes.data;
        setBrands(bData);
        if (isHeadOffice) setOffices(formatOfficeHierarchy(oData));
        setSalesAgents(sData);
        setDocumentTypes(dtData);

        const uniqueBookingTypes = bdtData.reduce((acc, current) => {
          const name = current.name.trim().toLowerCase().replace(/\s*\(.*\)$/, '');
          if (!acc.find(item => item.name.trim().toLowerCase().replace(/\s*\(.*\)$/, '') === name)) return [...acc, current];
          return acc;
        }, []);
        setBookingDocumentTypes(uniqueBookingTypes);
      }

      if (sumRes.data) setSummary(sumRes.data);
      
      if (vehRes.data) {
        setVehicles(vehRes.data.items);
        setTotalPages(vehRes.data.totalPages);
        setTotalItems(vehRes.data.totalItems);
      }
    } catch (e) {
      if (e.name !== 'CanceledError' && e.message !== 'canceled') console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehiclesOnly = async (page = currentPage, currentSearch = search, signal = null) => {
    setLoading(true);
    try {
      const params = { page, size: 8, search: currentSearch, officeId: selectedBranch, status: filterStatus };
      const res = await api.get('/vehicles', { params, signal });
      setVehicles(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalItems(res.data.totalItems);
    } catch (e) {
      if (e.name !== 'CanceledError' && e.message !== 'canceled') console.error('Fetch vehicles error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryOnly = async (signal = null) => {
    try {
      const res = await api.get('/vehicles/summary', { params: { officeId: selectedBranch }, signal });
      if (res.data) setSummary(res.data);
    } catch (e) { console.error('Fetch summary error:', e); }
  };

  // Initial Mount
  useEffect(() => {
    const controller = new AbortController();
    
    if (location.state?.searchPlate) {
      const plate = location.state.searchPlate;
      setSearch(plate);
      setCurrentPage(1);
      fetchAllData(1, plate, controller.signal);
      window.history.replaceState({}, document.title);
      isFirstLoad.current = false;
    } else {
      fetchAllData(currentPage, search, controller.signal);
      isFirstLoad.current = false;
    }

    return () => controller.abort();
  }, []); // Only on mount

  // Handle filter/search changes
  useEffect(() => {
    if (isFirstLoad.current) return;
    
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchVehiclesOnly(currentPage, search, controller.signal);
      fetchSummaryOnly(controller.signal);
    }, 300); // Faster debounce

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [currentPage, search, selectedBranch, filterStatus]);

  // Modal data sync handled in VehicleModal.jsx

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
    type: 'Kategori',
    brand: 'Merk',
    model: 'Model',
    year: 'Tahun',
    plate_number: 'No. Plat',
    price: 'Harga Jual',
    purchase_price: 'Harga Beli',
    service_cost: 'Biaya Servis',
    status: 'Status',
    office_id: 'Kantor Cabang',
    description: 'Deskripsi',
    color: 'Warna',
    odometer: 'Odometer',
    transmission: 'Transmisi',
    fuel_type: 'Bahan Bakar',
    sales_agent_id: 'Agen Sales',
    sold_date: 'Tgl Terjual',
    entry_date: 'Tgl Masuk',
    file_name: 'Nama File',
    document_type_id: 'Tipe Dokumen',
    file_path: 'Lokasi File',
    file_size: 'Ukuran File',
    mime_type: 'Tipe File',
    uploaded_by: 'Diunggah Oleh',
    vehicle_id: 'ID Kendaraan',
    booking_id: 'ID Transaksi',
    payment_method: 'Metode Bayar'
  };

  const tableLabels = {
    vehicles: 'Data Unit',
    vehicle_documents: 'Dokumen',
    vehicle_images: 'Foto Unit',
    bookings: 'Transaksi'
  };

  const handleSearch = (e) => { setSearch(e.target.value); setCurrentPage(1); };
  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

  const openModal = (vehicle = null, viewOnly = false) => {
    setIsViewOnly(viewOnly);
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };
  
  const openBookingModal = async (v) => {
    setEditingVehicle(v);
    try {
      const r = await api.get(`/bookings/vehicle/${v.id}`);
      setActiveBooking(r.data || null);
    } catch (e) { 
      setActiveBooking(null);
    }
    setIsBookingModalOpen(true);
  };

  const preConfirmAction = async (v, type) => {
    setEditingVehicle(v);
    setActionType(type);
    try {
      const r = await api.get(`/bookings/vehicle/${v.id}`);
      setActiveBooking(r.data || null);
    } catch (e) { 
      setActiveBooking(null); 
    }
    setIsConfirmActionModalOpen(true);
  };


  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    notify('loading', 'Menghapus kendaraan...');
    try {
      await api.delete(`/vehicles/${confirmDeleteId}`);
      notify('success', 'Kendaraan berhasil dihapus');
      setConfirmDeleteId(null);
      fetchVehicles();
      fetchSummary();
    } catch (e) {
      console.error('Delete error:', e);
      notify('error', e.response?.data?.message || 'Gagal menghapus kendaraan');
    }
  };

  const handleSetPrimaryImage = async (imgId) => {
    try {
      notify('loading', 'Mengatur foto utama...');
      await api.put(`/vehicles/${editingVehicle.id}/images/${imgId}/primary`);
      // Refresh vehicle data to get updated images
      const r = await api.get(`/vehicles/${editingVehicle.id}`);
      const freshImages = r.data.images || r.data.Images || [];
      setEditingVehicle(prev => ({ ...prev, images: freshImages }));
      fetchVehicles();
      notify('success', 'Foto utama diperbarui!');
    } catch (e) {
      console.error('Set primary error:', e);
      notify('error', e.response?.data?.message || 'Gagal mengatur foto utama');
    }
  };

  const handleDeleteImage = async (imgId) => {
    setConfirmAction({
      message: 'Hapus gambar ini?',
      onConfirm: async () => {
        try {
          notify('loading', 'Menghapus gambar...');
          await api.delete(`/vehicles/${editingVehicle.id}/images/${imgId}`);
          setEditingVehicle(prev => ({
            ...prev,
            images: (prev.images || []).filter(img => img.id !== imgId)
          }));
          fetchVehicles();
          notify('success', 'Gambar dihapus');
        } catch (e) {
          notify('error', 'Gagal menghapus gambar');
        }
      }
    });
  };

  const displayCurrency = (val) => {
    if (val === null || val === undefined || val === '') return '';
    return parseInt(val).toLocaleString('id-ID');
  };
  const handleCurrencyChange = (setter, state, field, val) => {
    const num = val.replace(/\D/g, '');
    setter({ ...state, [field]: num });
  };

  const handleExport = async () => {
    try {
      notify('loading', 'Menyiapkan laporan inventaris lengkap...');
      const res = await api.get('/export/vehicles', {
        params: { search, officeId: selectedBranch, type: '', status: filterStatus },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Vehicle_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      notify('success', 'Excel berhasil diekspor');
    } catch (e) {
      console.error('Export error:', e);
      notify('error', 'Gagal mengekspor data');
    }
  };

  return (
    <div className="space-y-6">
      <DynamicIsland 
        status={confirmDeleteId || confirmAction ? 'confirm' : notification.status} 
        message={confirmDeleteId ? 'Hapus kendaraan ini secara permanen?' : (confirmAction?.message || notification.message)} 
        onConfirm={() => {
          if (confirmDeleteId) handleDelete();
          else if (confirmAction) {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }
        }} 
        onCancel={() => {
          setConfirmDeleteId(null);
          setConfirmAction(null);
        }} 
      />
      <PdfViewerModal 
        isOpen={isPdfModalOpen} 
        onClose={() => setIsPdfModalOpen(false)} 
        documents={pdfDocuments} 
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Daftar Kendaraan</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isHeadOffice ? 'Semua Cabang' : user?.Office?.name}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 h-11 px-4 bg-white dark:bg-gray-800 text-green-600 border border-green-100 dark:border-green-900/30 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
          >
            <FileSpreadsheet size={18} /> Ekspor
          </button>
          <button onClick={() => openModal()} className="btn-primary gap-2 h-11 px-6 text-xs font-black shadow-lg shadow-blue-500/20 uppercase tracking-widest"><Plus size={18} /> Tambah Baru</button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Data Unit', count: summary.total || 0, icon: Car, color: 'blue', status: '', borderClass: 'border-b-blue-600', bgClass: 'bg-blue-50/20' },
          { label: 'Tersedia', count: summary.available || 0, icon: Tag, color: 'green', status: 'Available', borderClass: 'border-b-green-600', bgClass: 'bg-green-50/20' },
          { label: 'Dalam Booking', count: summary.booking || 0, icon: Clock, color: 'orange', status: 'Booked', borderClass: 'border-b-orange-600', bgClass: 'bg-orange-50/20' },
          { label: 'Unit Terjual', count: summary.sold || 0, icon: CheckCircle, color: 'purple', status: 'Sold', borderClass: 'border-b-purple-600', bgClass: 'bg-purple-50/20' },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => { setFilterStatus(s.status); setCurrentPage(1); }}
            className={`card p-4 flex items-center gap-4 border-b-4 transition-all text-left ${filterStatus === s.status ? `${s.borderClass} ${s.bgClass} opacity-100 shadow-xl shadow-blue-500/5` : 'border-b-gray-200 dark:border-b-gray-700 opacity-60 hover:opacity-100'}`}
          >
            <div className={`p-3 rounded-xl ${s.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : s.color === 'green' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : s.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}><s.icon size={22} /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-black">{s.label}</p><p className="text-xl font-black">{s.count}</p></div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="relative md:col-span-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            className={`input pl-10 ${search ? 'pr-10' : ''} h-12`} 
            placeholder="Cari..." 
            value={search} 
            onChange={handleSearch} 
          />
          {search && (
            <button 
              onClick={() => handleSearch({ target: { value: '' } })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="md:col-span-4">{isHeadOffice && (<select className="input h-12" value={selectedBranch} onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}><option value="">Semua Cabang</option>{offices.map(o => <option key={o.id} value={o.id}>{o.displayName}</option>)}</select>)}</div>
      </div>

      {viewMode === 'table' ? (
        <div className="card overflow-hidden border-none shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Info Unit</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kantor</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Harga</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Kontrol Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {vehicles.map((v, i) => (
                  <tr key={v.id} className="hover:bg-blue-100/40 dark:hover:bg-blue-900/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${v.type === 'Mobil' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                          {v.images?.length > 0 ? (
                            <img 
                              src={`${IMAGE_BASE_URL}${v.images.find(img => img.is_primary)?.image_url || v.images[0].image_url}`} 
                              className="w-full h-full object-cover" 
                              alt="Unit" 
                              loading="lazy" 
                            />
                          ) : <Car size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-gray-100">{v.brand} {v.model}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap">{v.type} • {v.year} • {v.unit_code} • {v.plate_number}</p>
                            {v.status === 'Available' && (
                              <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${
                                (Math.ceil((new Date() - new Date(v.entry_date)) / (1000 * 60 * 60 * 24))) > 60 ? 'bg-red-100 text-red-600' : 
                                (Math.ceil((new Date() - new Date(v.entry_date)) / (1000 * 60 * 60 * 24))) > 30 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {Math.ceil((new Date() - new Date(v.entry_date)) / (1000 * 60 * 60 * 24))}h Dalam Stok
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase">{v.Office?.name || '-'}</td>
                    <td className="px-6 py-4 font-black text-blue-600 dark:text-gray-200">{formatPrice(v.price)}</td>
                    <td className="px-6 py-4"><span className={`badge ${v.status === 'Available' ? 'badge-green' : v.status === 'Sold' ? 'badge-red' : 'badge-yellow'}`}>{v.status}</span></td>
                    <td className="px-6 py-4"><div className="flex justify-center gap-2">
                      {v.status === 'Available' && (
                        <div className="flex gap-1">
                          <button onClick={() => openBookingModal(v)} className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white text-[10px] font-black uppercase rounded-xl transition-all active:scale-95 cursor-pointer"><Bookmark size={12} /> Booking</button>
                          <button onClick={() => preConfirmAction(v, 'sold')} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 text-white text-[10px] font-black uppercase rounded-xl transition-all active:scale-95 cursor-pointer"><CheckCircle2 size={12} /> Jual</button>
                        </div>
                      )}
                      {v.status === 'Booked' && (
                        <div className="flex gap-1">
                          <button onClick={() => preConfirmAction(v, 'sold')} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 text-white text-[10px] font-black uppercase rounded-xl transition-all active:scale-95 cursor-pointer"><CheckCircle size={12} /> Selesai</button>
                          <button onClick={() => preConfirmAction(v, 'cancel')} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-700 text-white text-[10px] font-black uppercase rounded-xl shadow-md shadow-red-500/10 transition-all active:scale-95 cursor-pointer" title="Batalkan Pemesanan">Batal</button>
                        </div>
                      )}
                      {v.status === 'Sold' && <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 text-[10px] font-black uppercase rounded-xl">Selesai</div>}
                    </div></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(v, true)} className="btn-icon hover:bg-purple-100 hover:text-purple-600" title="Lihat Detail"><Eye size={16} /></button>
                        <button onClick={() => openModal(v)} className="btn-edit" title="Edit Unit"><Edit size={16} /></button>
                        <button onClick={() => setConfirmDeleteId(v.id)} className="btn-delete" title="Hapus Unit"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {vehicles.map((v) => {
            const displayImage = v.images?.find(img => img.is_primary)?.image_url || v.images?.[0]?.image_url;
            return (
              <div key={v.id} onClick={() => openModal(v, true)} className="card relative group pt-1.5 px-3 pb-3 hover:bg-blue-50/50 hover:shadow-xl hover:border-blue-400/50 dark:hover:bg-blue-900/20 dark:hover:border-blue-800/50 transition-[transform,background-color,border-color,box-shadow] duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
                <div className="flex justify-between items-center mb-1.5" onClick={e => e.stopPropagation()}>
                  <span className={`text-[8px] md:text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter ${v.status === 'Available' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : v.status === 'Sold' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>{v.status === 'Available' ? 'Tersedia' : v.status === 'Sold' ? 'Terjual' : 'Booked'}</span>
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === v.id ? null : v.id); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400">
                      <TrendingUp size={14} className="rotate-90 hidden" /> {/* Hidden trigger for reference if needed */}
                      <div className="flex flex-col gap-0.5 px-1 py-0.5">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                    </button>

                    {openMenuId === v.id && (
                      <div className="absolute right-0 top-full mt-1 w-24 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); openModal(v); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors">
                          <Edit size={12} /> Edit
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setConfirmDeleteId(v.id); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                    {displayImage ? <img src={`${IMAGE_BASE_URL}${displayImage}`} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col mb-1 leading-tight">
                      <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5">{v.unit_code} • {v.plate_number}</span>
                      <h4 className="text-xs font-black text-gray-900 dark:text-white line-clamp-2 uppercase tracking-tight">{v.model}</h4>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1 leading-relaxed">
                      {v.type} <span className="text-blue-500/50 mx-1">/</span> {v.brand} <span className="text-blue-500/50 mx-1">/</span> {v.plate_number} <span className="text-blue-500/50 mx-1">/</span> {v.year}
                    </p>
                    {v.status === 'Available' && (
                      <div className="mb-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase inline-block ${
                          (Math.ceil((new Date() - new Date(v.entry_date)) / (1000 * 60 * 60 * 24))) > 60 ? 'bg-red-100 text-red-600' : 
                          (Math.ceil((new Date() - new Date(v.entry_date)) / (1000 * 60 * 60 * 24))) > 30 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {Math.ceil((new Date() - new Date(v.entry_date)) / (1000 * 60 * 60 * 24))}h Dalam Stok
                        </span>
                      </div>
                    )}
                    <p className="text-xs md:text-sm font-black text-blue-600 truncate">{formatPrice(v.price)}</p>
                    <div className="flex items-center gap-1 text-[8px] md:text-[9px] text-gray-400 font-bold uppercase truncate mt-1"><MapPin size={8} className="text-gray-300 md:w-2.5 md:h-2.5" /> {v.Office?.name}</div>
                  </div>
                </div>
                <div className="flex gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                  {v.status === 'Available' ? (
                    <div className="flex flex-1 gap-1.5">
                      <button onClick={() => openBookingModal(v)} className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white rounded-lg text-[9px] font-black uppercase transition-all active:scale-95 cursor-pointer">Booking</button>
                      <button onClick={() => preConfirmAction(v, 'sold')} className="flex-1 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 text-white rounded-lg text-[9px] font-black uppercase transition-all active:scale-95 cursor-pointer">Jual</button>
                    </div>
                  ) :
                    v.status === 'Booked' ? (
                      <div className="flex flex-1 gap-1.5">
                        <button onClick={() => preConfirmAction(v, 'cancel')} className="flex-1 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-700 text-white rounded-lg text-[9px] font-black uppercase shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer">Batal</button>
                      </div>
                    ) :
                      <div className="flex-1 py-2 text-center text-white text-[9px] font-black uppercase bg-gray-400 dark:bg-gray-800 rounded-lg">Kendaraan Terjual</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={currentPage} totalPages={totalPages} setPage={setCurrentPage} />

      <Suspense fallback={null}>
        {isModalOpen && (
          <VehicleModal
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setIsViewOnly(false); setEditingVehicle(null); }}
            vehicle={editingVehicle}
            isViewOnly={isViewOnly}
            user={user}
            brands={brands}
            offices={offices}
            documentTypes={documentTypes}
            isHeadOffice={isHeadOffice}
            onSuccess={() => {
              fetchVehicles();
              fetchSummary();
            }}
            notify={notify}
            openBookingModal={openBookingModal}
          />
        )}
        {(isBookingModalOpen || isConfirmActionModalOpen) && (
          <BookingModal
            isOpen={isBookingModalOpen || isConfirmActionModalOpen}
            onClose={() => {
              setIsBookingModalOpen(false);
              setIsConfirmActionModalOpen(false);
              setEditingVehicle(null);
              setActiveBooking(null);
            }}
            vehicle={editingVehicle}
            existingBooking={activeBooking}
            actionType={isBookingModalOpen ? 'booking' : actionType}
            salesAgents={salesAgents}
            bookingDocumentTypes={bookingDocumentTypes}
            onSuccess={() => {
              fetchVehicles();
              fetchSummary();
            }}
            notify={notify}
            handlePrintDoc={handlePrintDoc}
          />
        )}
      </Suspense>

    </div>
  );
};

export default Vehicles;
