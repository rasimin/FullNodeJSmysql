import React, { useState, useEffect, useCallback } from 'react';
import { 
  Car, FileText, History, CheckCircle, Bookmark, Wallet, Wrench, 
  Camera, Trash2, Plus, Info, Upload, Eye, MapPin, PlusCircle, Bookmark as BookmarkIcon,
  Edit
} from 'lucide-react';
import api from '../services/api';
import Modal from './Modal';
import DrawerPanel from './DrawerPanel';
import Input from './ui/Input';
import Select from './ui/Select';
import { IMAGE_BASE_URL } from '../config';

const VehicleModal = ({ 
  isOpen, 
  onClose, 
  vehicle, 
  isViewOnly: initialIsViewOnly,
  user,
  brands,
  offices,
  documentTypes,
  isHeadOffice,
  onSuccess,
  notify,
  openBookingModal // Function to open booking modal from within vehicle modal
}) => {
  const [activeTab, setActiveTab] = useState('main');
  const [isViewOnly, setIsViewOnly] = useState(initialIsViewOnly);
  const [formData, setFormData] = useState({
    type: 'Motor', brand: '', model: '', year: (new Date().getFullYear()).toString(),
    plate_number: '', price: '', status: 'Available', unit_code: '',
    purchase_price: '', service_cost: '', sold_date: '',
    entry_date: new Date().toISOString().split('T')[0],
    description: '', office_id: '', sales_agent_id: '', color: '', odometer: '',
    transmission: 'Manual', fuel_type: 'Bensin'
  });
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleDocuments, setVehicleDocuments] = useState([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [auditTrails, setAuditTrails] = useState([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Sync state with props
  useEffect(() => {
    if (isOpen) {
      setEditingVehicle(vehicle);
      setIsViewOnly(initialIsViewOnly);
      setActiveTab('main');
      
      if (vehicle) {
        const formatDate = (ds) => (!ds || ds.startsWith('0000')) ? '' : ds.split('T')[0];
        setFormData({
          type: vehicle.type || 'Motor',
          brand: vehicle.brand || '',
          model: vehicle.model || '',
          year: (vehicle.year || new Date().getFullYear()).toString(),
          plate_number: vehicle.plate_number || '',
          price: vehicle.price || '',
          status: vehicle.status || 'Available',
          purchase_price: vehicle.purchase_price || '',
          service_cost: vehicle.service_cost || '',
          sold_date: formatDate(vehicle.sold_date),
          entry_date: formatDate(vehicle.entry_date) || new Date().toISOString().split('T')[0],
          description: vehicle.description || '',
          office_id: vehicle.office_id || '',
          sales_agent_id: vehicle.sales_agent_id || '',
          color: vehicle.color || '',
          odometer: vehicle.odometer || '',
          transmission: vehicle.transmission || 'Manual',
          fuel_type: vehicle.fuel_type || 'Bensin',
          unit_code: vehicle.unit_code || '',
          cancellation_reason: vehicle.cancellation_reason || ''
        });
      } else {
        setFormData({
          type: 'Motor', brand: '', model: '', year: (new Date().getFullYear()).toString(),
          plate_number: '', price: '', status: 'Available', unit_code: '',
          purchase_price: '', service_cost: '', sold_date: '',
          entry_date: new Date().toISOString().split('T')[0],
          description: '', office_id: user?.office_id || '', sales_agent_id: '', color: '', odometer: '',
          transmission: 'Manual', fuel_type: 'Bensin'
        });
      }
    }
  }, [isOpen, vehicle, initialIsViewOnly, user]);

  const fetchVehicleDocuments = useCallback(async (vehicleId) => {
    try {
      const r = await api.get(`/documents/vehicle/${vehicleId}`);
      setVehicleDocuments(r.data);
    } catch (e) { console.error('Fetch docs error:', e); }
  }, []);

  const fetchBookingHistory = useCallback(async (vehicleId) => {
    try {
      const r = await api.get(`/bookings/vehicle/${vehicleId}/history`);
      setBookingHistory(r.data);
    } catch (e) { console.error('Fetch history error:', e); }
  }, []);

  const fetchAuditTrails = useCallback(async (vehicleId) => {
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
  }, []);


  useEffect(() => {
    if (!isOpen || !editingVehicle?.id) return;

    if (activeTab === 'audit') {
      fetchAuditTrails(editingVehicle.id);
    } else if (activeTab === 'documents') {
      fetchVehicleDocuments(editingVehicle.id);
    }
    
    fetchBookingHistory(editingVehicle.id);
  }, [activeTab, editingVehicle, isOpen, fetchAuditTrails, fetchVehicleDocuments, fetchBookingHistory]);


  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  const displayCurrency = (val) => {
    if (val === '' || val === null || val === undefined) return '';
    return new Intl.NumberFormat('id-ID').format(val);
  };

  const parseNum = (str) => str.replace(/\./g, '').replace(/[^0-9]/g, '');

  const handleCurrencyChange = (setter, currentData, key, val) => {
    const raw = parseNum(val);
    if (raw === '' || /^\d+$/.test(raw)) {
      setter({ ...currentData, [key]: raw });
    }
  };

  const sanitizePlate = (val) => val.toUpperCase().replace(/[^A-Z0-9 ]/g, '');

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + (editingVehicle?.images?.length || 0) + selectedFiles.length > 10) {
      return notify('error', 'Maksimal 10 gambar per unit');
    }
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const handleUploadDocument = async (vehicleId, typeId, file) => {
    if (!file) return;
    setIsUploadingDoc(true);
    notify('loading', 'Mengunggah dokumen...');
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('document_type_id', typeId);
      await api.post(`/documents/vehicle/${vehicleId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      notify('success', 'Dokumen berhasil diunggah');
      fetchVehicleDocuments(vehicleId);
      fetchAuditTrails(vehicleId);
    } catch (err) {
      console.error('Upload doc error:', err);
      notify('error', 'Gagal mengunggah dokumen');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (vehicleId, docId) => {
    if (!window.confirm('Hapus dokumen ini?')) return;
    notify('loading', 'Menghapus dokumen...');
    try {
      await api.delete(`/documents/vehicle/${vehicleId}/${docId}`);
      notify('success', 'Dokumen dihapus');
      fetchVehicleDocuments(vehicleId);
      fetchAuditTrails(vehicleId);
    } catch (err) {
      console.error('Delete doc error:', err);
      notify('error', 'Gagal menghapus dokumen');
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    notify('loading', 'Memperbarui gambar utama...');
    try {
      await api.put(`/vehicles/${editingVehicle.id}/images/${imageId}/primary`);
      notify('success', 'Gambar utama diperbarui');
      onSuccess(); // To refresh images in modal
    } catch (e) {
      notify('error', 'Gagal memperbarui gambar utama');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Hapus gambar ini?')) return;
    notify('loading', 'Menghapus gambar...');
    try {
      await api.delete(`/vehicles/${editingVehicle.id}/images/${imageId}`);
      notify('success', 'Gambar dihapus');
      onSuccess();
    } catch (e) {
      notify('error', 'Gagal menghapus gambar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    notify('loading', editingVehicle ? 'Memperbarui unit...' : 'Menambahkan unit...');
    
    try {
      let vehicleId = editingVehicle?.id;

      if (editingVehicle) {
        await api.put(`/vehicles/${vehicleId}`, formData);
      } else {
        const res = await api.post('/vehicles', formData);
        vehicleId = res.data.id;
      }

      if (selectedFiles.length > 0 && vehicleId) {
        const imgData = new FormData();
        selectedFiles.forEach(file => imgData.append('images', file));
        await api.post(`/vehicles/${vehicleId}/images`, imgData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      notify('success', editingVehicle ? 'Unit berhasil diperbarui' : 'Unit berhasil ditambahkan');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      notify('error', err.response?.data?.message || 'Terjadi kesalahan sistem');
    }
  };

  const parseAuditValue = (val) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch (e) { return val; }
  };

  const tableLabels = { vehicles: 'Data Unit', vehicle_images: 'Galeri Foto', vehicle_documents: 'Dokumen Legal', bookings: 'Data Transaksi' };

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title="Ringkasan Master Kendaraan" width="max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit shrink-0">
          <button
            onClick={() => setActiveTab('main')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'main' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Car size={14} /> Umum & Media
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'documents' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <FileText size={14} /> Dokumen Legal
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <History size={14} /> Riwayat & Audit
          </button>
        </div>

        {(editingVehicle?.status === 'Booked' || editingVehicle?.status === 'Sold') && (
          <div className={`p-2.5 pl-3 pr-4 ${editingVehicle?.status === 'Sold' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'} border rounded-[20px] flex items-center gap-4 transition-all shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 ${editingVehicle?.status === 'Sold' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600'} rounded-xl flex items-center justify-center shrink-0`}>
                {editingVehicle?.status === 'Sold' ? <CheckCircle size={18} /> : <Bookmark size={18} />}
              </div>
              <div>
                <p className={`text-[8px] font-black ${editingVehicle?.status === 'Sold' ? 'text-emerald-700' : 'text-amber-700'} uppercase tracking-[0.15em]`}>
                  {editingVehicle?.status === 'Sold' ? 'Unit Terjual' : 'Unit Reservasi'}
                </p>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Transaksi Aktif</p>
              </div>
            </div>
            <div className="flex gap-1.5 h-full">
              <button 
                type="button" 
                onClick={() => {
                  const activeB = bookingHistory.find(b => b.status === 'Active' || b.status === 'Sold');
                  if (activeB) openBookingModal(editingVehicle, activeB);
                  else {
                    api.get(`/bookings/vehicle/${editingVehicle.id}`).then(r => {
                      if (r.data) openBookingModal(editingVehicle, r.data);
                      else notify('error', 'Detail transaksi tidak ditemukan.');
                    });
                  }
                }}
                className={`px-4 py-2 ${editingVehicle?.status === 'Sold' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'} text-white text-[9px] font-black uppercase rounded-xl transition-all active:scale-95 shadow-sm`}
              >
                Kelola Transaksi
              </button>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'main' ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-5">

              {/* ── Detail Spesifikasi ── */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1 h-5 bg-blue-600 rounded-full" />
                  <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Detail Spesifikasi</h4>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800/60">

                  {/* Kode Unit */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Kode Unit</span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1"><Input value={formData.unit_code || '-'} readOnly className="bg-blue-50/30 dark:bg-blue-900/10 text-blue-600 font-black" /></div>
                  </div>

                  {/* Kategori */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Kategori <span className="text-red-500">*</span></span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1">
                      <Select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} options={[{ value: 'Mobil', label: 'Mobil' }, { value: 'Motor', label: 'Motor' }]} required disabled={isViewOnly} />
                    </div>
                  </div>

                  {/* Merek */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Merek <span className="text-red-500">*</span></span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1">
                      <Select value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} options={brands.map(b => ({ value: b.name, label: b.name }))} required disabled={isViewOnly} />
                    </div>
                  </div>

                  {/* Model / Tipe */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Model / Tipe <span className="text-red-500">*</span></span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1"><Input value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} required readOnly={isViewOnly} /></div>
                  </div>

                  {/* Nomor Plat */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Nomor Plat <span className="text-red-500">*</span></span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1"><Input value={formData.plate_number} onChange={e => setFormData({ ...formData, plate_number: sanitizePlate(e.target.value) })} required readOnly={isViewOnly} /></div>
                  </div>

                  {/* Tahun */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Tahun <span className="text-red-500">*</span></span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1">
                      <Select value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} options={Array.from({ length: 40 }, (_, i) => ({ value: (new Date().getFullYear() - i).toString(), label: (new Date().getFullYear() - i).toString() }))} required disabled={isViewOnly} />
                    </div>
                  </div>

                  {/* Transmisi */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Transmisi</span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1">
                      <Select value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value })} options={[{ value: 'Manual', label: 'Manual' }, { value: 'Automatic', label: 'Automatic' }, { value: 'CVT', label: 'CVT' }, { value: 'Triptonic', label: 'Triptonic' }]} disabled={isViewOnly} />
                    </div>
                  </div>

                  {/* Bahan Bakar */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Bahan Bakar</span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1">
                      <Select value={formData.fuel_type} onChange={e => setFormData({ ...formData, fuel_type: e.target.value })} options={[{ value: 'Bensin', label: 'Bensin' }, { value: 'Diesel', label: 'Diesel / Solar' }, { value: 'Electric', label: 'Electric (EV)' }, { value: 'Hybrid', label: 'Hybrid' }]} disabled={isViewOnly} />
                    </div>
                  </div>

                  {/* Warna */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Warna</span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1"><Input value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} readOnly={isViewOnly} /></div>
                  </div>

                  {/* Odometer */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Odometer (KM)</span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1"><Input value={displayCurrency(formData.odometer)} onChange={e => handleCurrencyChange(setFormData, formData, 'odometer', e.target.value)} readOnly={isViewOnly} /></div>
                  </div>


                  {/* Status Unit */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Status Unit</span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1">
                      <Select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} options={[{ value: 'Available', label: 'Tersedia' }, { value: 'Sold', label: 'Terjual' }, { value: 'Booked', label: 'Booked' }]} disabled={isViewOnly} />
                    </div>
                  </div>

                </div>
              </div>

              {/* ── Keuangan & Inventaris ── */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1 h-5 bg-green-600 rounded-full" />
                  <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Keuangan &amp; Inventaris</h4>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800/60">

                  {/* Harga Jual */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Harga Jual <span className="text-red-500">*</span></span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1"><Input value={displayCurrency(formData.price)} onChange={e => handleCurrencyChange(setFormData, formData, 'price', e.target.value)} required readOnly={isViewOnly} /></div>
                  </div>

                  {/* Harga Beli */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Harga Beli</span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1"><Input icon={Wallet} value={displayCurrency(formData.purchase_price)} onChange={e => handleCurrencyChange(setFormData, formData, 'purchase_price', e.target.value)} readOnly={isViewOnly} /></div>
                  </div>

                  {/* Biaya Servis */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Biaya Servis</span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1"><Input icon={Wrench} value={displayCurrency(formData.service_cost)} onChange={e => handleCurrencyChange(setFormData, formData, 'service_cost', e.target.value)} readOnly={isViewOnly} /></div>
                  </div>

                  {/* Tanggal Masuk */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Tanggal Masuk</span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1"><Input type="date" value={formData.entry_date} onChange={e => setFormData({ ...formData, entry_date: e.target.value })} readOnly={isViewOnly} /></div>
                  </div>

                  {/* Tanggal Terjual (conditional) */}
                  {(formData.status === 'Sold' || formData.sold_date) && (
                    <div className="flex items-center gap-3 py-2">
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Tanggal Terjual</span>
                      <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                      <div className="flex-1"><Input type="date" value={formData.sold_date} onChange={e => setFormData({ ...formData, sold_date: e.target.value })} readOnly={isViewOnly} /></div>
                    </div>
                  )}

                  {/* Kantor Cabang */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0">Kantor Cabang {isHeadOffice && <span className="text-red-500">*</span>}</span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs">:</span>
                    <div className="flex-1">
                      {isHeadOffice ? (
                        <Select value={formData.office_id} onChange={e => setFormData({ ...formData, office_id: e.target.value })} options={[{ value: '', label: '-- Pilih Cabang --' }, ...offices.map(o => ({ value: o.id, label: o.displayName }))]} required disabled={isViewOnly} />
                      ) : (
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{user?.Office?.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Catatan */}
                  <div className="flex items-start gap-3 py-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wide w-36 shrink-0 pt-2">Catatan</span>
                    <span className="text-gray-300 dark:text-gray-700 shrink-0 text-xs pt-2">:</span>
                    <div className="flex-1">
                      <textarea className="input h-20 p-3 text-xs w-full" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Catatan..." readOnly={isViewOnly} />
                    </div>
                  </div>

                </div>
              </div>

            </div>


            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2"><div className="w-1 h-5 bg-indigo-600 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Galeri Media</h4></div>
                <div className="grid grid-cols-2 gap-2">
                  {editingVehicle?.images?.map((img) => (
                    <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <img src={`${IMAGE_BASE_URL}${img.image_url}`} className="w-full h-full object-cover" />
                      {img.is_primary && <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white text-[7px] font-black uppercase rounded">Utama</div>}
                      {!isViewOnly && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button type="button" onClick={() => handleSetPrimaryImage(img.id)} className="p-2 bg-white text-blue-600 rounded-lg"><CheckCircle size={14} /></button>
                          <button type="button" onClick={() => handleDeleteImage(img.id)} className="p-2 bg-white text-red-600 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 opacity-90 border border-green-500/30 border-dashed">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-600 text-white text-[7px] font-black uppercase rounded">Baru</div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))} className="p-2 bg-white text-red-600 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  {!isViewOnly && ((editingVehicle?.images?.length || 0) + selectedFiles.length) < 10 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-500 flex flex-col items-center justify-center transition-all cursor-pointer bg-gray-50/50 hover:bg-blue-50/20">
                        <Camera size={18} className="text-gray-300" />
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>

              {bookingHistory.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2"><div className="w-1 h-5 bg-amber-500 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Aktivitas Terbaru</h4></div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {bookingHistory.map(bh => (
                      <div key={bh.id} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${bh.status === 'Cancelled' ? 'bg-red-100 text-red-600' : bh.status === 'Sold' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{bh.status === 'Cancelled' ? 'Batal' : bh.status === 'Sold' ? 'Terjual' : 'Booked'}</span>
                            <span className="text-[9px] text-gray-400 font-bold">{new Date(bh.booking_date).toLocaleDateString('id-ID')}</span>
                          </div>
                          <p className="font-black truncate text-gray-900 dark:text-gray-100 text-sm">{bh.customer_name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Agen: {bh.salesAgent?.name || 'Tidak Diketahui'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <p className="font-black text-blue-600 text-xs">{formatPrice(bh.down_payment)}</p>
                          {bh.status === 'Active' && (
                            <button
                              type="button"
                              onClick={() => openBookingModal(editingVehicle, bh)}
                              className="px-4 py-2 bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900/30 text-blue-600 text-[10px] font-black uppercase rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {!isViewOnly && (
            <div className="pt-6 border-t border-gray-100 text-right">
                <button type="submit" className="btn-primary px-8 py-3 bg-blue-600 border-none text-[10px] font-black uppercase tracking-widest shadow-xl">
                    Simpan Perubahan Master
                </button>
            </div>
          )}
        </form>
      ) : activeTab === 'documents' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="flex items-center gap-3"><div className="w-1 h-5 bg-blue-600 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Pusat Dokumen Legalitas</h4></div>
           
           {!editingVehicle ? (
             <div className="p-12 text-center bg-gray-50 dark:bg-gray-800/20 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-4">
                  <Info size={32} />
                </div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase mb-2">Simpan Unit Terlebih Dahulu</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">Anda harus menyimpan data unit baru sebelum dapat mengunggah dokumen legalitas.</p>
             </div>
           ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentTypes.filter(t => !['OTHER', 'LAINNYA'].includes(t.code?.toUpperCase())).map((type) => {
                    const existingDoc = vehicleDocuments.find(d => d.document_type_id === type.id);
                    return (
                      <div key={type.id} className={`p-4 rounded-2xl border transition-all ${existingDoc ? 'bg-white dark:bg-gray-800 border-green-100 dark:border-green-900/30 shadow-sm' : 'bg-gray-50/50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${existingDoc ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              <FileText size={16} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tight">{type.name}</p>
                                {type.is_mandatory && <span className="text-[7px] font-black text-red-500 uppercase">Wajib</span>}
                              </div>
                              <p className="text-[8px] text-gray-400 font-bold uppercase">{existingDoc ? `Diunggah: ${new Date(existingDoc.createdAt || existingDoc.created_at).toLocaleDateString('id-ID')}` : 'Belum ada file'}</p>
                            </div>
                          </div>
                          {existingDoc && !isViewOnly && (
                            <button onClick={() => handleDeleteDocument(editingVehicle.id, existingDoc.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {existingDoc ? (
                          <button 
                            onClick={() => window.open(`${IMAGE_BASE_URL}${existingDoc.file_path}`, '_blank')}
                            className="w-full py-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2"
                          >
                            <Eye size={12} /> Lihat Dokumen
                          </button>
                        ) : (
                          !isViewOnly && (
                            <label className={`w-full py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${isUploadingDoc ? 'opacity-50 pointer-events-none' : 'hover:border-blue-500 hover:bg-blue-50/50 border-gray-200 dark:border-gray-700'}`}>
                              <Upload size={16} className="text-gray-300 mb-1" />
                              <p className="text-[8px] font-black text-gray-400 uppercase">Pilih File</p>
                              <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleUploadDocument(editingVehicle.id, type.id, e.target.files[0])} disabled={isUploadingDoc} />
                            </label>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-5 bg-purple-600 rounded-full" />
                      <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Dokumen Tambahan (Maks 5)</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[...Array(5)].map((_, i) => {
                        const otherType = documentTypes.find(t => ['OTHER', 'LAINNYA'].includes(t.code?.toUpperCase()));
                        const otherDocs = vehicleDocuments.filter(d => d.document_type_id === otherType?.id);
                        const doc = otherDocs[i];

                        return (
                          <div key={i} className={`aspect-square rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden ${doc ? 'bg-white dark:bg-gray-800 border-indigo-100 dark:border-indigo-900/30' : 'bg-gray-50/30 dark:bg-gray-800/10 border-dashed border-gray-200 dark:border-gray-700'}`}>
                            {doc ? (
                              <div className="w-full h-full p-2 flex flex-col items-center justify-center text-center">
                                <FileText size={24} className="text-indigo-400 mb-2" />
                                <p className="text-[7px] font-black text-gray-500 uppercase line-clamp-1 px-1">{doc.file_name}</p>
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button onClick={() => window.open(`${IMAGE_BASE_URL}${doc.file_path}`, '_blank')} className="p-1.5 bg-white text-blue-600 rounded-lg"><Eye size={14} /></button>
                                  {!isViewOnly && <button onClick={() => handleDeleteDocument(editingVehicle.id, doc.id)} className="p-1.5 bg-white text-red-600 rounded-lg"><Trash2 size={14} /></button>}
                                </div>
                              </div>
                            ) : (
                              !isViewOnly && otherType && (
                                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/30 transition-colors">
                                  <PlusCircle size={20} className="text-gray-300 mb-1" />
                                  <p className="text-[7px] font-black text-gray-400 uppercase">Tambah</p>
                                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleUploadDocument(editingVehicle.id, otherType.id, e.target.files[0])} disabled={isUploadingDoc} />
                                </label>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                </div>
              </div>
           )}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-indigo-600 rounded-full" />
              <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Log Aktivitas Data</h4>
            </div>

            {isAuditLoading ? (
              <div className="p-10 text-center text-[10px] font-black text-gray-400 uppercase animate-pulse">Mengambil data riwayat...</div>
            ) : auditTrails.length === 0 ? (
              <div className="p-10 text-center bg-gray-50 dark:bg-gray-800/20 rounded-[32px] border-2 border-dashed border-gray-100 dark:border-gray-800">
                <History size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-[10px] font-black text-gray-400 uppercase">Belum ada riwayat perubahan data</p>
              </div>
            ) : (
              <div className="relative space-y-3 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-800/50">
                {auditTrails.map((audit) => (
                  <div key={audit.id} className="relative pl-10">
                    <div className={`absolute left-0 top-1 w-8.5 h-8.5 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center z-10 ${
                      audit.action === 'INSERT' ? 'bg-green-500 text-white' : 
                      audit.action === 'UPDATE' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {audit.action === 'INSERT' ? <Plus size={12} /> : audit.action === 'UPDATE' ? <Edit size={12} /> : <Trash2 size={12} />}
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800/50 shadow-sm">
                      <div className="flex justify-between items-center mb-1.5">
                        <div>
                          <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1">{audit.User?.name || 'Sistem'}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(audit.createdAt || audit.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</p>
                            <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
                            <p className="text-[9px] text-indigo-500 font-black uppercase tracking-wider">{tableLabels[audit.table_name] || audit.table_name}</p>
                          </div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                          audit.action === 'INSERT' ? 'bg-green-100/50 text-green-600' : 
                          audit.action === 'UPDATE' ? 'bg-blue-100/50 text-blue-600' : 'bg-red-100/50 text-red-600'
                        }`}>{audit.action}</span>
                      </div>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400">
                          {audit.action === 'INSERT' ? 'Menambahkan data baru' : audit.action === 'UPDATE' ? 'Melakukan pembaruan data' : 'Menghapus data'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DrawerPanel>
  );
};

export default VehicleModal;
