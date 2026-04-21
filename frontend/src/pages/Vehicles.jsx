import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import {
  Search, Plus, Car, Tag, MapPin,
  Calendar, Info, Edit, Trash2, Filter, Eye,
  ChevronRight, ChevronLeft, ArrowUpDown, Bookmark, Smartphone, User as UserIcon,
  CreditCard, XCircle, CheckCircle, Clock, Camera, Image as ImageIcon, X, Maximize2, Users,
  PlusCircle, TrendingUp, Download, FileSpreadsheet, Palette, Gauge, Wallet, Wrench, History,
  ChevronsLeft, ChevronsRight, Hash, CheckCircle2
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

const Vehicles = () => {
  const location = useLocation();
  const [vehicles, setVehicles] = useState([]);
  const [brands, setBrands] = useState([]);
  const [modelHistory, setModelHistory] = useState([]);
  const [typeHistory, setTypeHistory] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [salesAgents, setSalesAgents] = useState([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [isConfirmActionModalOpen, setIsConfirmActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'sold' or 'cancel'
  const [activeBooking, setActiveBooking] = useState(null);

  // PDF Viewer handling
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfDocuments, setPdfDocuments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [bookingData, setBookingData] = useState({
    vehicle_id: '', customer_name: '', customer_phone: '', id_number: '',
    booking_date: new Date().toISOString().split('T')[0], down_payment: '', notes: '', sales_agent_id: ''
  });
  const [printReceipt, setPrintReceipt] = useState(localStorage.getItem('pref_print_receipt') === 'true');
  const [printInvoice, setPrintInvoice] = useState(localStorage.getItem('pref_print_invoice') === 'true');
  const [printDealProof, setPrintDealProof] = useState(() => localStorage.getItem('pref_print_deal') === 'true');
  const [cancellationReason, setCancellationReason] = useState('');
  const [dealPhoto, setDealPhoto] = useState(null);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [summary, setSummary] = useState({ available: 0, booking: 0, sold: 0, total: 0 });
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'grid' : 'table');

  const [formData, setFormData] = useState({
    type: 'Motor', brand: '', model: '', year: (new Date().getFullYear()).toString(),
    plate_number: '', price: '', status: 'Available',
    purchase_price: '', service_cost: '', sold_date: '',
    entry_date: new Date().toISOString().split('T')[0],
    description: '', office_id: '', sales_agent_id: '', color: '', odometer: '',
    transmission: 'Manual', fuel_type: 'Bensin'
  });

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [openMenuId, setOpenMenuId] = useState(null);

  const { user } = JSON.parse(localStorage.getItem('user_data') || '{}');
  const isSuperAdmin = user?.role === 'Super Admin';
  const isHeadOffice = isSuperAdmin || !user?.office_id || user?.Office?.parent_id === null;

  const notify = (status, message, delay = 2000) => {
    setNotification({ status, message });
    if (status !== 'loading' && status !== 'confirm') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

  const handlePrintDoc = async (bookingId, type, openModal = true) => {
    notify('loading', 'Preparing document preview...');
    try {
      let url = '';
      let filename = '';
      let label = '';
      
      const customerSuffix = bookingData.customer_name ? `_${bookingData.customer_name.replace(/\s+/g, '_')}` : '';

      if (type === 'receipt' || type === 'invoice') {
        const docType = type === 'receipt' ? 'receipt' : 'dp-invoice';
        label = type === 'receipt' ? 'Reservation Receipt' : 'Settlement Invoice';
        filename = type === 'receipt' ? `Reservation_Receipt${customerSuffix}.pdf` : `Settlement_Invoice${customerSuffix}.pdf`;
        
        const res = await api.get(`/export/bookings/${bookingId}?type=${docType}`, { responseType: 'blob' });
        url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      } else if (type === 'deal-proof') {
        label = 'Official Bill of Sale';
        filename = `Official_Bill_of_Sale${customerSuffix}.pdf`;
        const res = await api.get(`/export/sales/${bookingId}/invoice?isProof=true`, { responseType: 'blob' });
        url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      }

      if (url) {
        const docObj = { title: label, url, filename };
        if (openModal) {
          setPdfDocuments([docObj]);
          setIsPdfModalOpen(true);
          notify('success', `${label} ready!`);
        }
        return docObj;
      }
    } catch (e) {
      console.error('Download error:', e);
      notify('error', 'Failed to generate document');
      return null;
    }
  };

  const fetchAgentsByOffice = async (officeId) => {
    try {
      const r = await api.get('/sales-agents/active', { params: { officeId } });
      setSalesAgents(r.data);
    } catch (e) { console.error(e); }
  };

  const fetchMetadata = async () => {
    try {
      const [b, h, t, o, s] = await Promise.all([
        api.get('/vehicles/brands'),
        api.get('/vehicles/model-history'),
        api.get('/vehicles/type-history'),
        isHeadOffice ? api.get('/offices') : Promise.resolve({ data: [] }),
        api.get('/sales-agents/active', { params: { officeId: user?.office_id } })
      ]);
      setBrands(b.data);
      setModelHistory(h.data);
      setTypeHistory(t.data);
      if (isHeadOffice) setOffices(formatOfficeHierarchy(o.data));
      setSalesAgents(s.data);
    } catch (e) { console.error(e); }
  };

  const fetchVehicles = async (page = currentPage, currentSearch = search) => {
    setLoading(true);
    try {
      const params = { page, size: 8, search: currentSearch, officeId: selectedBranch, status: filterStatus };
      const [vRes, sRes] = await Promise.all([
        api.get('/vehicles', { params }),
        api.get('/vehicles/summary', { params: { officeId: selectedBranch } })
      ]);

      setVehicles(vRes.data.items);
      setTotalPages(vRes.data.totalPages);
      setTotalItems(vRes.data.totalItems);
      if (sRes.data) setSummary(sRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchMetadata(); }, []);
  
  useEffect(() => {
    if (location.state?.searchPlate) {
      const plate = location.state.searchPlate;
      setSearch(plate);
      fetchVehicles(1, plate);
      window.history.replaceState({}, document.title);
    } else {
      fetchVehicles(currentPage, search);
    }
  }, [currentPage, search, selectedBranch, filterStatus, location.state]);

  const handleSearch = (e) => { setSearch(e.target.value); setCurrentPage(1); };
  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

  const openModal = (vehicle = null, viewOnly = false) => {
    setIsViewOnly(viewOnly);
    setEditingVehicle(vehicle);
    setSelectedFiles([]);
    if (vehicle) {
      setFormData({
        ...vehicle,
        type: vehicle.type || '',
        year: vehicle.year?.toString() || '',
        entry_date: vehicle.entry_date?.split('T')[0] || '',
        sold_date: vehicle.sold_date ? vehicle.sold_date.split('T')[0] : '',
        purchase_price: vehicle.purchase_price || '',
        service_cost: vehicle.service_cost || '',
        office_id: vehicle.office_id || '',
        sales_agent_id: vehicle.sales_agent_id || '',
        color: vehicle.color || '',
        odometer: vehicle.odometer || '',
        description: vehicle.description || '',
        transmission: vehicle.transmission || 'Manual',
        fuel_type: vehicle.fuel_type || 'Bensin',
        cancellation_reason: (vehicle.Bookings?.[0]?.cancellation_reason || vehicle.cancellation_reason) || ''
      });
      fetchBookingHistory(vehicle.id);
    } else {
      setFormData({
        type: 'Motor', brand: '', model: '', year: (new Date().getFullYear()).toString(),
        plate_number: '', price: '', status: 'Available',
        purchase_price: '', service_cost: '', sold_date: '',
        entry_date: new Date().toISOString().split('T')[0],
        description: '', office_id: user?.office_id || '', sales_agent_id: '', color: '', odometer: '',
        transmission: 'Manual', fuel_type: 'Bensin', cancellation_reason: ''
      });
      setBookingHistory([]);
    }
    setIsModalOpen(true);
  };

  const fetchBookingHistory = async (id) => {
    try { const r = await api.get(`/bookings/vehicle/${id}/history`); setBookingHistory(r.data); } catch (e) { console.error(e); }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedFiles(prev => {
      const currentImagesCount = editingVehicle?.images?.length || 0;
      const totalPlanned = prev.length + files.length;

      if (currentImagesCount + totalPlanned > 10) {
        const availableSlots = 10 - (currentImagesCount + prev.length);
        alert(`Maksimal 10 gambar per kendaraan! (Sisa slot: ${availableSlots})`);
        return [...prev, ...files.slice(0, availableSlots)];
      }
      return [...prev, ...files];
    });

    // Reset input value so the same file selection triggers onChange next time
    e.target.value = '';
  };

  const sanitizePlate = (val) => val.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();
  const sanitizePhone = (val) => val.replace(/[^0-9+]/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.brand || !formData.model || !formData.office_id) {
      return notify('error', 'Category, Brand, Model and Branch Office are required!');
    }
    notify('loading', editingVehicle ? 'Updating...' : 'Adding...');

    try {
      // Clean payload: strip associations and ensure no nulls for text fields
      const payload = {};
      const allowedFields = [
        'type', 'brand', 'model', 'year', 'plate_number', 'price', 'status',
        'purchase_price', 'service_cost', 'sold_date', 'entry_date',
        'description', 'office_id', 'sales_agent_id', 'color', 'odometer',
        'transmission', 'fuel_type'
      ];

      allowedFields.forEach(field => {
        if (formData[field] !== undefined) {
          let val = formData[field];
          // Convert empty strings to null for ID and numeric fields to avoid FK errors
          if (val === '' && ['sales_agent_id', 'office_id', 'purchase_price', 'service_cost', 'odometer'].includes(field)) {
            val = null;
          }
          payload[field] = val;
        }
      });

      let vehicleId = editingVehicle?.id;

      if (editingVehicle) {
        await api.put(`/vehicles/${vehicleId}`, payload);
      } else {
        const res = await api.post('/vehicles', payload);
        vehicleId = res.data.id || res.data.vehicleId || res.data?.vehicle?.id || res.data.data?.id;
      }

      // Upload extra images if any are selected
      if (selectedFiles.length > 0 && vehicleId) {
        const uploadData = new FormData();
        selectedFiles.forEach(file => uploadData.append('images', file));
        await api.post(`/vehicles/${vehicleId}/images`, uploadData, {
          headers: { 'Content-Type': undefined } // Let axios auto-set multipart/form-data with boundary
        });
      }
      setSelectedFiles([]);

      notify('success', 'Success!');
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      console.error('Save error:', err);
      const msg = err.response?.data?.message || 'Failed to save changes';
      notify('error', msg);
    }
  };

  const handleDelete = async () => {
    notify('loading', 'Deleting...');
    try { await api.delete(`/vehicles/${confirmDeleteId}`); notify('success', 'Deleted'); setConfirmDeleteId(null); fetchVehicles(); }
    catch { notify('error', 'Error'); }
  };

  const openBookingModal = (v, existingBooking = null) => {
    setEditingVehicle(v);
    if (existingBooking) {
      setBookingData({
        ...existingBooking,
        id: existingBooking.id, // Ensure ID is passed for update
        vehicle_id: v.id,
        booking_date: existingBooking.booking_date?.split('T')[0] || '',
        id_number: existingBooking.id_number || '',
        notes: existingBooking.notes || '',
        nik: existingBooking.nik || '',
        sales_agent_id: existingBooking.sales_agent_id || ''
      });
    } else {
      setBookingData({
        vehicle_id: v.id, customer_name: '', customer_phone: '', nik: '', id_number: '',
        booking_date: new Date().toISOString().split('T')[0], down_payment: '', notes: '', sales_agent_id: ''
      });
    }
    fetchAgentsByOffice(v.office_id);
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    notify('loading', 'Processing...');
    try {
      // Clean numeric fields before sending
      const cleanData = {
        ...bookingData,
        down_payment: bookingData.down_payment?.toString().replace(/\D/g, '') || 0
      };

      let bookingId = bookingData.id;
      if (bookingData.id) {
        await api.put(`/bookings/${bookingData.id}`, cleanData);
      } else {
        const res = await api.post('/bookings', cleanData);
        bookingId = res.data.id;
      }
      
      notify('success', 'Booking saved successfully!'); 
      setIsBookingModalOpen(false); 
      fetchVehicles();

      // Conditional Print - Robust immediate opening
      const docsToOpen = [];
      if (printReceipt) {
        const d = await handlePrintDoc(bookingId, 'receipt', false);
        if (d) docsToOpen.push(d);
      }
      
      if (printInvoice) {
        const d = await handlePrintDoc(bookingId, 'invoice', false);
        if (d) docsToOpen.push(d);
      }

      if (docsToOpen.length > 0) {
        setPdfDocuments(docsToOpen);
        setIsPdfModalOpen(true);
      }

      // No longer resetting to false, we keep the user preference
    } catch (err) {
      console.error('Booking Submit Error:', err);
      notify('error', err.response?.data?.message || 'Booking failed');
    }
  };

  const preConfirmAction = (v, type) => {
    setEditingVehicle(v); 
    setActionType(type);
    setCancellationReason(''); // Reset remark
    setDealPhoto(null); // Reset photo for new action
    fetchAgentsByOffice(v.office_id);
    api.get(`/bookings/vehicle/${v.id}`).then(r => {
      setActiveBooking(r.data);
      setBookingData({ 
        ...bookingData, 
        id: r.data?.id || '',
        customer_name: r.data?.customer_name || '',
        customer_phone: r.data?.customer_phone || '',
        sales_agent_id: r.data?.sales_agent_id || '' 
      });
      setIsConfirmActionModalOpen(true);
    });
  };

  const handleConfirmSale = async () => {
    if (actionType === 'sold' && !bookingData.customer_name) {
      return notify('error', 'Customer name is required!');
    }

    notify('loading', 'Closing deal...');
    try {
      const formData = new FormData();
      formData.append('booking_id', activeBooking?.id || '');
      formData.append('customer_name', bookingData.customer_name);
      formData.append('customer_phone', bookingData.customer_phone);
      formData.append('sold_date', new Date().toISOString().split('T')[0]);
      formData.append('sales_agent_id', bookingData.sales_agent_id);
      
      if (dealPhoto) {
        formData.append('delivery_photo', dealPhoto);
      }

      const res = await api.put(`/bookings/vehicle/${editingVehicle.id}/sold`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      notify('success', 'Deal closed successfully!'); 
      setIsConfirmActionModalOpen(false); 
      setDealPhoto(null);
      fetchVehicles();

      if (printDealProof) {
        const d = await handlePrintDoc(res.data.id, 'deal-proof', false);
        if (d) {
          setPdfDocuments([d]);
          setIsPdfModalOpen(true);
        }
      }
    } catch (e) { 
      console.error('Sale error:', e);
      notify('error', e.response?.data?.message || 'Sale failed'); 
    }
  };

  const handleCancelBooking = async (type) => {
    if (!cancellationReason.trim()) {
        notify('error', 'Please provide a reason for cancellation');
        return;
    }
    notify('loading', 'Processing cancellation...');
    try {
      await api.put(`/bookings/vehicle/${editingVehicle.id}/cancel`, { 
        type,
        remark: cancellationReason 
      });
      notify('success', 'Booking status updated'); 
      setIsConfirmActionModalOpen(false); 
      setCancellationReason('');
      fetchVehicles();
    } catch (e) { 
      notify('error', e.response?.data?.message || 'Action failed'); 
    }
  };



  const handleSetPrimaryImage = async (imgId) => {
    try {
      notify('loading', 'Setting primary...');
      await api.put(`/vehicles/${editingVehicle.id}/images/${imgId}/primary`);
      // Refresh vehicle data to get updated images
      const r = await api.get(`/vehicles/${editingVehicle.id}`);
      const freshImages = r.data.images || r.data.Images || [];
      setEditingVehicle(prev => ({ ...prev, images: freshImages }));
      fetchVehicles();
      notify('success', 'Primary image updated!');
    } catch (e) {
      console.error('Set primary error:', e);
      notify('error', e.response?.data?.message || 'Failed to set primary image');
    }
  };

  const handleDeleteImage = async (imgId) => {
    if (!window.confirm('Hapus gambar ini?')) return;
    try {
      notify('loading', 'Deleting image...');
      await api.delete(`/vehicles/${editingVehicle.id}/images/${imgId}`);
      // Immediately remove from local state
      setEditingVehicle(prev => ({
        ...prev,
        images: (prev.images || []).filter(img => img.id !== imgId)
      }));
      fetchVehicles();
      notify('success', 'Image deleted!');
    } catch (e) {
      console.error('Delete image error:', e);
      notify('error', e.response?.data?.message || 'Failed to delete image');
    }
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
      notify('loading', 'Preparing full inventory report...');
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
      notify('success', 'Excel exported successfully');
    } catch (e) {
      console.error('Export error:', e);
      notify('error', 'Failed to export data');
    }
  };

  return (
    <div className="space-y-6">
      <DynamicIsland status={confirmDeleteId ? 'confirm' : notification.status} message={confirmDeleteId ? 'Delete vehicle?' : notification.message} onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)} />
      <PdfViewerModal 
        isOpen={isPdfModalOpen} 
        onClose={() => setIsPdfModalOpen(false)} 
        documents={pdfDocuments} 
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Vehicle Inventory</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isHeadOffice ? 'All Branches' : user?.Office?.name}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 h-11 px-4 bg-white dark:bg-gray-800 text-green-600 border border-green-100 dark:border-green-900/30 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
          >
            <FileSpreadsheet size={18} /> Export
          </button>
          <button onClick={() => openModal()} className="btn-primary gap-2 h-11 px-6 text-xs font-black shadow-lg shadow-blue-500/20 uppercase tracking-widest"><Plus size={18} /> Add New</button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total Stock', count: summary.total || 0, icon: Car, color: 'blue', status: '', borderClass: 'border-b-blue-600', bgClass: 'bg-blue-50/20' },
          { label: 'Available', count: summary.available || 0, icon: Tag, color: 'green', status: 'Available', borderClass: 'border-b-green-600', bgClass: 'bg-green-50/20' },
          { label: 'In Booking', count: summary.booking || 0, icon: Clock, color: 'orange', status: 'Booked', borderClass: 'border-b-orange-600', bgClass: 'bg-orange-50/20' },
          { label: 'Unit Sold', count: summary.sold || 0, icon: CheckCircle, color: 'purple', status: 'Sold', borderClass: 'border-b-purple-600', bgClass: 'bg-purple-50/20' },
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
        <div className="relative md:col-span-8"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" className="input pl-10 h-12" placeholder="Search..." value={search} onChange={handleSearch} /></div>
        <div className="md:col-span-4">{isHeadOffice && (<select className="input h-12" value={selectedBranch} onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}><option value="">All Branches</option>{offices.map(o => <option key={o.id} value={o.id}>{o.displayName}</option>)}</select>)}</div>
      </div>

      {viewMode === 'table' ? (
        <div className="card overflow-hidden border-none shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit Info</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Office</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Admin Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {vehicles.map((v, i) => (
                  <tr key={v.id} className="hover:bg-blue-100/40 dark:hover:bg-blue-900/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${v.type === 'Mobil' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                          {v.images?.length > 0 ? <img src={`${IMAGE_BASE_URL}${v.images[0].image_url}`} className="w-full h-full object-cover" alt="Unit" /> : <Car size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-gray-100">{v.brand} {v.model}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap">{v.type} • {v.year} • {v.plate_number}</p>
                            {v.status === 'Available' && (
                              <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${
                                (Math.ceil((new Date() - new Date(v.entry_date)) / (1000 * 60 * 60 * 24))) > 60 ? 'bg-red-100 text-red-600' : 
                                (Math.ceil((new Date() - new Date(v.entry_date)) / (1000 * 60 * 60 * 24))) > 30 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {Math.ceil((new Date() - new Date(v.entry_date)) / (1000 * 60 * 60 * 24))}d In Stock
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
                      {v.status === 'Available' && <button onClick={() => openBookingModal(v)} className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-800 dark:hover:bg-orange-700 text-white text-[10px] font-black uppercase rounded-xl shadow-md shadow-orange-500/10 transition-all active:scale-95 cursor-pointer"><Bookmark size={12} /> Book Now</button>}
                      {v.status === 'Booked' && (
                        <div className="flex gap-1">
                          <button onClick={() => preConfirmAction(v, 'sold')} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-emerald-800 dark:hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded-xl shadow-md shadow-green-500/10 transition-all active:scale-95 cursor-pointer"><CheckCircle size={12} /> Close Deal</button>
                          <button onClick={() => preConfirmAction(v, 'cancel')} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-700 text-white text-[10px] font-black uppercase rounded-xl shadow-md shadow-red-500/10 transition-all active:scale-95 cursor-pointer" title="Cancel Booking">Cancel</button>
                        </div>
                      )}
                      {v.status === 'Sold' && <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 text-[10px] font-black uppercase rounded-xl">Completed</div>}
                    </div></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(v, true)} className="btn-icon hover:bg-purple-100 hover:text-purple-600" title="View Detail"><Eye size={16} /></button>
                        <button onClick={() => openModal(v)} className="btn-edit" title="Edit Unit"><Edit size={16} /></button>
                        <button onClick={() => setConfirmDeleteId(v.id)} className="btn-delete" title="Delete Unit"><Trash2 size={16} /></button>
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
              <div key={v.id} onClick={() => openModal(v, true)} className="card relative group pt-1.5 px-3 pb-3 hover:bg-blue-50/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-400/50 dark:hover:bg-blue-900/20 dark:hover:border-blue-800/50 transition-all duration-500 hover:-translate-y-1.5 cursor-pointer overflow-hidden">
                <div className="flex justify-between items-center mb-1.5" onClick={e => e.stopPropagation()}>
                  <span className={`text-[8px] md:text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter ${v.status === 'Available' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : v.status === 'Sold' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>{v.status}</span>
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
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                    {displayImage ? <img src={`${IMAGE_BASE_URL}${displayImage}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-gray-900 dark:text-white line-clamp-2 uppercase tracking-tight mb-1 leading-tight">{v.model}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1 leading-relaxed">
                      {v.type} <span className="text-blue-500/50 mx-1">/</span> {v.brand} <span className="text-blue-500/50 mx-1">/</span> {v.plate_number} <span className="text-blue-500/50 mx-1">/</span> {v.year}
                    </p>
                    {v.status === 'Available' && (
                      <div className="mb-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase inline-block ${
                          (Math.ceil((new Date() - new Date(v.entry_date)) / (1000 * 60 * 60 * 24))) > 60 ? 'bg-red-100 text-red-600' : 
                          (Math.ceil((new Date() - new Date(v.entry_date)) / (1000 * 60 * 60 * 24))) > 30 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {Math.ceil((new Date() - new Date(v.entry_date)) / (1000 * 60 * 60 * 24))}d In Stock
                        </span>
                      </div>
                    )}
                    <p className="text-xs md:text-sm font-black text-blue-600 truncate">{formatPrice(v.price)}</p>
                    <div className="flex items-center gap-1 text-[8px] md:text-[9px] text-gray-400 font-bold uppercase truncate mt-1"><MapPin size={8} className="text-gray-300 md:w-2.5 md:h-2.5" /> {v.Office?.name}</div>
                  </div>
                </div>
                <div className="flex gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                  {v.status === 'Available' ? <button onClick={() => openBookingModal(v)} className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-[9px] font-black uppercase shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer">Book Now</button> :
                    v.status === 'Booked' ? (
                      <div className="flex flex-1 gap-1.5">
                        <button onClick={() => preConfirmAction(v, 'sold')} className="flex-1 py-2 bg-green-600 hover:bg-green-700 dark:bg-emerald-800 dark:hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer">Close Deal</button>
                        <button onClick={() => preConfirmAction(v, 'cancel')} className="flex-1 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-700 text-white rounded-lg text-[9px] font-black uppercase shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer">Cancel</button>
                      </div>
                    ) :
                      <div className="flex-1 py-2 text-center text-white text-[9px] font-black uppercase bg-gray-400 dark:bg-gray-800 rounded-lg">Vehicle Sold</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={currentPage} totalPages={totalPages} setPage={setCurrentPage} />

      {/* MASTER VEHICLE FORM MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setIsViewOnly(false); }} title="Master Vehicle Overview" maxWidth="max-w-5xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3"><div className="w-1 h-5 bg-blue-600 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Detail Spesifikasi</h4></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Select
                    label="Category"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    options={[
                      { value: 'Mobil', label: 'Mobil' },
                      { value: 'Motor', label: 'Motor' }
                    ]}
                    required
                    disabled={isViewOnly}
                  />
                  <Select label="Brand / Merk" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} options={brands.map(b => ({ value: b.name, label: b.name }))} required disabled={isViewOnly} />
                  <Input label="Model / Type" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} required readOnly={isViewOnly} />
                  <Input label="Plate Number" value={formData.plate_number} onChange={e => setFormData({ ...formData, plate_number: sanitizePlate(e.target.value) })} required readOnly={isViewOnly} />
                  <Select label="Year" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} options={Array.from({ length: 40 }, (_, i) => ({ value: (new Date().getFullYear() - i).toString(), label: (new Date().getFullYear() - i).toString() }))} required disabled={isViewOnly} />
                  <Select label="Transmission" value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value })} options={[{ value: 'Manual', label: 'Manual' }, { value: 'Automatic', label: 'Automatic' }, { value: 'CVT', label: 'CVT' }, { value: 'Triptonic', label: 'Triptonic' }]} disabled={isViewOnly} />
                  <Select label="Fuel Type" value={formData.fuel_type} onChange={e => setFormData({ ...formData, fuel_type: e.target.value })} options={[{ value: 'Bensin', label: 'Bensin' }, { value: 'Diesel', label: 'Diesel / Solar' }, { value: 'Electric', label: 'Electric (EV)' }, { value: 'Hybrid', label: 'Hybrid' }]} disabled={isViewOnly} />
                  <Input label="Color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} readOnly={isViewOnly} />
                  <Input label="Odometer (KM)" value={displayCurrency(formData.odometer)} onChange={e => handleCurrencyChange(setFormData, formData, 'odometer', e.target.value)} readOnly={isViewOnly} />
                  <Input label="Sales Price" value={displayCurrency(formData.price)} onChange={e => handleCurrencyChange(setFormData, formData, 'price', e.target.value)} required readOnly={isViewOnly} />
                  <Select label="Unit Status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} options={[{ value: 'Available', label: 'Available' }, { value: 'Sold', label: 'Sold' }, { value: 'Booked', label: 'Booked' }]} disabled={isViewOnly} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3"><div className="w-1 h-5 bg-green-600 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Financial & Inventory</h4></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Input label="Purchase Price" icon={Wallet} value={displayCurrency(formData.purchase_price)} onChange={e => handleCurrencyChange(setFormData, formData, 'purchase_price', e.target.value)} readOnly={isViewOnly} />
                  <Input label="Service Cost" icon={Wrench} value={displayCurrency(formData.service_cost)} onChange={e => handleCurrencyChange(setFormData, formData, 'service_cost', e.target.value)} readOnly={isViewOnly} />
                  <Input label="Entry Date" type="date" value={formData.entry_date} onChange={e => setFormData({ ...formData, entry_date: e.target.value })} readOnly={isViewOnly} />
                  {(formData.status === 'Sold' || formData.sold_date) && <Input label="Sold Date" type="date" value={formData.sold_date} onChange={e => setFormData({ ...formData, sold_date: e.target.value })} readOnly={isViewOnly} />}
                  {isHeadOffice ? (
                    <Select
                      label="Branch Office"
                      value={formData.office_id}
                      onChange={e => setFormData({ ...formData, office_id: e.target.value })}
                      options={[
                        { value: '', label: '-- Select Branch --' },
                        ...offices.map(o => ({ value: o.id, label: o.displayName }))
                      ]}
                      required
                      disabled={isViewOnly}
                    />
                  ) : <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[8px] text-gray-400 font-black uppercase">Current Branch</p><p className="text-[10px] font-bold">{user?.Office?.name}</p></div>}
                </div>
                <textarea className="input h-20 p-3 text-xs" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Notes..." readOnly={isViewOnly} />
                {(formData.status === 'Available' && formData.cancellation_reason) && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-1">Last Cancellation Remark</label>
                    <textarea 
                      className="input h-20 p-3 text-xs border-red-100 dark:border-red-900/30 bg-red-50/10" 
                      value={formData.cancellation_reason} 
                      onChange={e => setFormData({ ...formData, cancellation_reason: e.target.value })} 
                      placeholder="Cancellation reason..." 
                      readOnly={isViewOnly} 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2"><div className="w-1 h-5 bg-indigo-600 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Media Gallery</h4></div>
                <div className="grid grid-cols-2 gap-2">
                  {editingVehicle?.images?.map((img) => (
                    <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <img src={`${IMAGE_BASE_URL}${img.image_url}`} className="w-full h-full object-cover" />
                      {img.is_primary && <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white text-[7px] font-black uppercase rounded">Primary</div>}
                      {!isViewOnly && (
                        <div className="absolute top-1 right-1 flex flex-col gap-1 sm:top-auto sm:right-auto sm:inset-0 sm:bg-black/40 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity items-center justify-center flex-row">
                          <button type="button" onClick={() => handleSetPrimaryImage(img.id)} className="p-2 bg-white text-blue-600 rounded-lg shadow-lg sm:shadow-none"><CheckCircle size={14} /></button>
                          <button type="button" onClick={() => handleDeleteImage(img.id)} className="p-2 bg-white text-red-600 rounded-lg shadow-lg sm:shadow-none"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 opacity-90 border border-green-500/30 shadow-sm border-dashed">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-600 text-white text-[7px] font-black uppercase rounded">Baru</div>
                      <div className="absolute top-1 right-1 flex flex-col gap-1 sm:top-auto sm:right-auto sm:inset-0 sm:bg-black/40 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity items-center justify-center flex-row">
                        <button type="button" onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))} className="p-2 bg-white text-red-600 rounded-lg shadow-lg sm:shadow-none"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  {!isViewOnly && ((editingVehicle?.images?.length || 0) + selectedFiles.length) < 10 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-500 flex flex-col items-center justify-center transition-all cursor-pointer bg-gray-50/50 hover:bg-blue-50/20"><Camera size={18} className="text-gray-300" /><input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} /></label>
                  )}
                </div>
              </div>

              {bookingHistory.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2"><div className="w-1 h-5 bg-amber-500 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Recent Activity</h4></div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {bookingHistory.map(bh => (
                      <div key={bh.id} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-row sm:items-center justify-between gap-4 transition-all hover:bg-white dark:hover:bg-gray-800">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${bh.status === 'Cancelled' ? 'bg-red-100 text-red-600' : bh.status === 'Sold' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{bh.status}</span>
                            <span className="text-[9px] text-gray-400 font-bold">{new Date(bh.booking_date).toLocaleDateString('id-ID')}</span>
                          </div>
                          <p className="font-black truncate text-gray-900 dark:text-gray-100 text-sm">{bh.customer_name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Agent: {bh.salesAgent?.name || 'Unknown'} ({bh.salesAgent?.sales_code || 'N/A'})</p>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <p className="font-black text-blue-600 text-xs">{formatPrice(bh.down_payment)}</p>
                          {bh.delivery_photo && (
                            <div className="group/photo relative">
                              <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border-2 border-green-500/20 shadow-sm">
                                <img 
                                  src={`${IMAGE_BASE_URL}${bh.delivery_photo}`} 
                                  className="w-full h-full object-cover cursor-zoom-in" 
                                  alt="Deal Proof"
                                  onClick={() => window.open(`${IMAGE_BASE_URL}${bh.delivery_photo}`, '_blank')}
                                />
                              </div>
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" title="Handover Photo Available"></div>
                            </div>
                          )}
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
          {!isViewOnly && <div className="pt-6 border-t border-gray-100 text-right"><button type="submit" className="btn-primary px-8 py-3 bg-blue-600 border-none text-[10px] font-black uppercase tracking-widest shadow-xl">Save Master Changes</button></div>}
        </form>
      </Modal>

      <Modal isOpen={isConfirmActionModalOpen} onClose={() => { setIsConfirmActionModalOpen(false); setDealPhoto(null); }} title="Transaction Confirmation">
        <div className="space-y-6 pt-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">Confirm {actionType === 'sold' ? 'Sale' : 'Cancellation'} for <strong className="text-gray-900 dark:text-white">{editingVehicle?.brand} {editingVehicle?.model}</strong>?</p>
          <div className="space-y-6">
            {actionType === 'sold' && (
              <div className="space-y-5">
                {/* Vehicle Data Verification */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-100 dark:border-blue-900/20">
                    <Hash size={14} className="text-blue-500" />
                    <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Unit Verification</p>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Plate Number</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">{editingVehicle?.plate_number}</p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Selling Price</p>
                      <p className="text-xs font-black text-blue-600 uppercase">{formatPrice(editingVehicle?.price || 0)}</p>
                    </div>
                  </div>
                </div>

                {!activeBooking ? (
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-black text-orange-600 uppercase mb-2">Direct Sale Information</p>
                    <Input label="Customer Name" value={bookingData.customer_name} onChange={e => setBookingData({ ...bookingData, customer_name: e.target.value })} required />
                    <Input label="Phone Number" value={bookingData.customer_phone} onChange={e => setBookingData({ ...bookingData, customer_phone: sanitizePhone(e.target.value) })} required />
                  </div>
                ) : (
                  <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
                    <p className="text-[9px] font-black text-blue-200 uppercase mb-1">Selling to Reserved Customer:</p>
                    <p className="text-base font-black uppercase tracking-tight">{activeBooking.customer_name}</p>
                    <p className="text-xs font-medium opacity-80">{activeBooking.customer_phone}</p>
                  </div>
                )}
                
                <Select label="Sales Executive" value={bookingData.sales_agent_id} onChange={e => setBookingData({ ...bookingData, sales_agent_id: e.target.value })} options={salesAgents.map(a => ({ value: a.id, label: `${a.name} [${a.sales_code}] - ${a.Office?.name || 'Unknown'}` }))} required />
                
                {/* Delivery Photo Upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Camera size={14} className="text-blue-500" /> Proof of Delivery Photo
                  </label>
                  <div className="relative group aspect-video bg-gray-100 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-blue-500 transition-all overflow-hidden flex items-center justify-center">
                    {dealPhoto ? (
                      <>
                        <img src={URL.createObjectURL(dealPhoto)} className="w-full h-full object-cover" alt="Proof" />
                        <button onClick={() => setDealPhoto(null)} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg"><X size={14} /></button>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                        <ImageIcon size={32} className="text-gray-300 mb-2" />
                        <p className="text-[10px] font-black text-gray-400 uppercase">Click to upload photo with customer</p>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setDealPhoto(e.target.files[0])} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all cursor-pointer" onClick={() => {
                  const newVal = !printDealProof;
                  setPrintDealProof(newVal);
                  localStorage.setItem('pref_print_deal', newVal);
                }}>
                  <input type="checkbox" checked={printDealProof} onChange={() => {}} className="w-4 h-4 rounded text-blue-600" />
                  <span className="text-[10px] font-black text-gray-400 uppercase">Print Bill of Sale after save</span>
                </div>

                <button onClick={handleConfirmSale} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black shadow-xl shadow-green-500/20 transition-all active:scale-95 uppercase text-xs tracking-widest">CLOSE DEAL NOW</button>
              </div>
            )}
            {actionType === 'cancel' && (
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl">
                  {/* Verification Info */}
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <Hash size={14} className="text-orange-500" />
                      <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Data Verification</p>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Plate Number</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">{editingVehicle?.plate_number}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Customer Name</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white uppercase truncate">{activeBooking?.customer_name || '-'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">NIK / ID Number</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{activeBooking?.id_number || activeBooking?.nik || '-'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Total Down Payment</p>
                        <p className="text-sm font-black text-orange-600">{formatPrice(activeBooking?.down_payment || 0)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Input Remark */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 ml-1">
                      <Edit size={14} className="text-blue-500" />
                      <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Cancellation Reason / Remark</label>
                      <span className="text-[9px] font-bold text-red-500 ml-auto uppercase opacity-60">* Mandatory</span>
                    </div>
                    <textarea 
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Type the reason why this booking is being cancelled..."
                      className="w-full p-4 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none min-h-[120px] resize-none shadow-sm transition-all placeholder:text-gray-300"
                    />
                  </div>

                  {/* Action Selection */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-orange-600 uppercase text-center tracking-[0.2em] opacity-80">Select Final Outcome</p>
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={() => handleCancelBooking('Cancelled')}
                        className="p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 rounded-2xl text-left transition-all group shadow-md active:bg-gray-100 dark:active:bg-gray-700 active:scale-[0.98] flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <XCircle size={16} className="text-red-600" />
                            <p className="text-sm font-black text-red-600 uppercase tracking-tight">Cancel (No Refund)</p>
                          </div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed max-w-[280px]">Dana DP hangus dan menjadi komponen pendapatan kantor.</p>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-red-500 transition-colors ml-2" />
                      </button>

                      <button 
                        onClick={() => handleCancelBooking('Refunded')}
                        className="p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 rounded-2xl text-left transition-all group shadow-md active:bg-gray-100 dark:active:bg-gray-700 active:scale-[0.98] flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 size={16} className="text-blue-600" />
                            <p className="text-sm font-black text-blue-600 uppercase tracking-tight">Refund (Full Return)</p>
                          </div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed max-w-[280px]">Dana DP dikembalikan sepenuhnya kepada customer.</p>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <button onClick={() => setIsConfirmActionModalOpen(false)} className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all uppercase text-xs tracking-widest">BACK TO DASHBOARD</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Unit Reservation Form">
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <Input label="Customer Name" value={bookingData.customer_name} onChange={e => setBookingData({ ...bookingData, customer_name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="NIK (ID Number)" placeholder="16-digit NIK" value={bookingData.nik} onChange={e => setBookingData({ ...bookingData, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })} required />
            <Input label="Phone Number" placeholder="+62..." value={bookingData.customer_phone} onChange={e => setBookingData({ ...bookingData, customer_phone: sanitizePhone(e.target.value) })} required />
          </div>
          <Input label="Down Payment (DP)" value={displayCurrency(bookingData.down_payment)} onChange={e => handleCurrencyChange(setBookingData, bookingData, 'down_payment', e.target.value)} />
          <Select
            label="Sales Agent (Optional)"
            value={bookingData.sales_agent_id}
            onChange={e => setBookingData({ ...bookingData, sales_agent_id: e.target.value })}
            options={[{ value: '', label: '-- Select Sales (Optional) --' }, ...salesAgents.map(a => ({ value: a.id, label: `${a.name} [${a.sales_code}] - ${a.Office?.name || 'Unknown'}` }))]}
          />
          <textarea
            className="input min-h-[80px] p-3 text-xs"
            placeholder="Additional notes / information..."
            value={bookingData.notes}
            onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all cursor-pointer" onClick={() => {
              const newVal = !printReceipt;
              setPrintReceipt(newVal);
              localStorage.setItem('pref_print_receipt', newVal);
            }}>
              <input type="checkbox" checked={printReceipt} onChange={() => {}} className="w-4 h-4 rounded text-blue-600" />
              <span className="text-[9px] font-black text-gray-400 uppercase leading-none">Print Reservation Receipt</span>
            </div>
            <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all cursor-pointer" onClick={() => {
              const newVal = !printInvoice;
              setPrintInvoice(newVal);
              localStorage.setItem('pref_print_invoice', newVal);
            }}>
              <input type="checkbox" checked={printInvoice} onChange={() => {}} className="w-4 h-4 rounded text-blue-600" />
              <span className="text-[9px] font-black text-gray-400 uppercase leading-none">Print Settlement Invoice</span>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-4 bg-orange-600 border-none uppercase text-xs font-black tracking-widest">SAVE RESERVATION</button>
        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
