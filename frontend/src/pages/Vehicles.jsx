import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import {
  Search, Plus, Car, Tag, MapPin,
  Calendar, Info, Edit, Trash2, Filter, Eye,
  ChevronRight, ChevronLeft, ArrowUpDown, Bookmark, Smartphone, User as UserIcon,
  CreditCard, XCircle, CheckCircle, Clock, Camera, Image as ImageIcon, X, Maximize2, Users,
  PlusCircle, TrendingUp, Download, FileSpreadsheet, Palette, Gauge, Wallet, Wrench, History,
  ChevronsLeft, ChevronsRight, Hash, CheckCircle2, FileText, Upload
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
  const [activeTab, setActiveTab] = useState('main');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [vehicleDocuments, setVehicleDocuments] = useState([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isDocPromptOpen, setIsDocPromptOpen] = useState(false);
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
  const [bookingDocumentTypes, setBookingDocumentTypes] = useState([]);
  const [selectedBookingDocs, setSelectedBookingDocs] = useState({}); // { typeId: File }
  const [formStep, setFormStep] = useState(1); // 1: Data, 2: Upload & Print
  const [tempBookingId, setTempBookingId] = useState(null);
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
    notify('loading', 'Menyiapkan pratinjau dokumen...');
    try {
      let url = '';
      let filename = '';
      let label = '';
      
      const customerSuffix = bookingData.customer_name ? `_${bookingData.customer_name.replace(/\s+/g, '_')}` : '';

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

  const fetchMetadata = async () => {
    try {
      const [b, h, t, o, s, dt, bdt] = await Promise.all([
        api.get('/vehicles/brands'),
        api.get('/vehicles/model-history'),
        api.get('/vehicles/type-history'),
        isHeadOffice ? api.get('/offices') : Promise.resolve({ data: [] }),
        api.get('/sales-agents/active', { params: { officeId: user?.office_id } }),
        api.get('/documents/types', { params: { category: 'Vehicle' } }),
        api.get('/documents/types', { params: { category: 'Booking' } })
      ]);
      setBrands(b.data);
      setModelHistory(h.data);
      setTypeHistory(t.data);
      if (isHeadOffice) setOffices(formatOfficeHierarchy(o.data));
      setSalesAgents(s.data);
      setDocumentTypes(dt.data);
      // Deduplicate booking types by name to avoid showing redundant fields like "Kartu Keluarga" twice
      const uniqueBookingTypes = bdt.data.reduce((acc, current) => {
        const name = current.name.trim().toLowerCase();
        // Remove common suffixes like (KK) for better comparison
        const cleanName = name.replace(/\s*\(.*\)$/, '');
        const exists = acc.find(item => {
          const itemName = item.name.trim().toLowerCase().replace(/\s*\(.*\)$/, '');
          return itemName === cleanName;
        });
        if (!exists) return [...acc, current];
        return acc;
      }, []);
      setBookingDocumentTypes(uniqueBookingTypes);
    } catch (e) { console.error(e); }
  };

  const fetchVehicleDocuments = async (vehicleId) => {
    try {
      const r = await api.get(`/documents/vehicle/${vehicleId}`);
      setVehicleDocuments(r.data);
    } catch (e) { console.error('Fetch docs error:', e); }
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
    } catch (err) {
      console.error('Delete doc error:', err);
      notify('error', 'Gagal menghapus dokumen');
    }
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
    setActiveTab('main');
    setVehicleDocuments([]);
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
      fetchVehicleDocuments(vehicle.id);
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
  
  const handleUploadBookingDocs = async (bookingId) => {
    const docTypeIds = Object.keys(selectedBookingDocs);
    if (docTypeIds.length === 0) return;
    
    for (const typeId of docTypeIds) {
      const file = selectedBookingDocs[typeId];
      if (!file) continue;
      
      try {
        const docFormData = new FormData();
        docFormData.append('document', file);
        docFormData.append('document_type_id', typeId);
        await api.post(`/documents/booking/${bookingId}`, docFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (err) {
        console.error(`Failed to upload doc type ${typeId}:`, err);
      }
    }
    setSelectedBookingDocs({}); // Clear after upload
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
      return notify('error', 'Kategori, Merk, Model dan Kantor Cabang wajib diisi!');
    }
    notify('loading', editingVehicle ? 'Memperbarui...' : 'Menambah...');

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

      const isNew = !editingVehicle;
      if (isNew) {
        // Fetch the full vehicle object to ensure we have all fields for the documents tab
        const fullVehicleRes = await api.get(`/vehicles/${vehicleId}`);
        setEditingVehicle(fullVehicleRes.data);
        setIsDocPromptOpen(true);
      } else {
        setIsModalOpen(false);
      }
      
      notify('success', isNew ? 'Unit ditambahkan! Apakah Anda ingin mengunggah dokumen?' : 'Perubahan disimpan!');
      fetchVehicles();

    } catch (err) {
      console.error('Save error:', err);
      const msg = err.response?.data?.message || 'Gagal menyimpan perubahan';
      notify('error', msg);
    }
  };

  const handleDelete = async () => {
    notify('loading', 'Menghapus...');
    try { await api.delete(`/vehicles/${confirmDeleteId}`); notify('success', 'Dihapus'); setConfirmDeleteId(null); fetchVehicles(); }
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
    setSelectedBookingDocs({}); // Reset
    setFormStep(1); // Reset to step 1
    setTempBookingId(null);
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    notify('loading', 'Memproses...');
    try {
      setLoading(true);
      let bookingId = bookingData.id || tempBookingId;
      
      if (formStep === 1) {
        // Step 1: Save Customer Data
        const cleanData = {
          ...bookingData,
          vehicle_id: editingVehicle.id,
          down_payment: bookingData.down_payment || 0
        };
        
        if (bookingId) {
          await api.put(`/bookings/${bookingId}`, cleanData);
        } else {
          const res = await api.post('/bookings', cleanData);
          bookingId = res.data.id;
        }
        
        setTempBookingId(bookingId);
        setFormStep(2); // Move to Step 2
        notify('success', 'Data disimpan! Sekarang silakan unggah dokumen.');
        return;
      }

      // Step 2: Upload Documents and Finish
      await handleUploadBookingDocs(bookingId);
      
      notify('success', 'Transaksi berhasil diselesaikan!'); 
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
      notify('error', err.response?.data?.message || 'Pemesanan gagal');
    } finally {
      setLoading(false);
    }
  };

  const preConfirmAction = (v, type) => {
    setEditingVehicle(v); 
    setActionType(type);
    setDealPhoto(null); // Reset photo for new action
    setSelectedBookingDocs({}); // Reset booking docs
    setFormStep(1); // Reset to step 1
    setTempBookingId(null);
    fetchAgentsByOffice(v.office_id);
    api.get(`/bookings/vehicle/${v.id}`).then(r => {
      setActiveBooking(r.data);
      if (r.data) {
        setBookingData({ 
          ...bookingData, 
          id: r.data.id,
          customer_name: r.data.customer_name || '',
          customer_phone: r.data.customer_phone || '',
          nik: r.data.nik || '',
          id_number: r.data.id_number || '',
          notes: r.data.notes || '',
          sales_agent_id: r.data.sales_agent_id || '' 
        });
      } else {
        // Clear data for Direct Deal
        setBookingData({
          id: '',
          vehicle_id: v.id,
          customer_name: '',
          customer_phone: '',
          nik: '',
          id_number: '',
          notes: '',
          sales_agent_id: user?.sales_agent_id || '' // Default to current user's agent if applicable
        });
      }
      setIsConfirmActionModalOpen(true);
    });
  };

  const handleConfirmSale = async () => {
    if (actionType === 'sold' && !bookingData.customer_name) {
      return notify('error', 'Nama pelanggan wajib diisi!');
    }

    notify('loading', 'Menyelesaikan transaksi...');
    try {
      setLoading(true);
      
      let bookingId = activeBooking?.id || tempBookingId;

      const formData = new FormData();
      formData.append('booking_id', bookingId || '');
      formData.append('customer_name', bookingData.customer_name);
      formData.append('customer_phone', bookingData.customer_phone);
      formData.append('nik', bookingData.nik || '');
      formData.append('id_number', bookingData.id_number || '');
      formData.append('notes', bookingData.notes || '');
      formData.append('sold_date', new Date().toISOString().split('T')[0]);
      formData.append('sales_agent_id', bookingData.sales_agent_id);
      
      if (dealPhoto) {
        formData.append('delivery_photo', dealPhoto);
      }

      if (formStep === 1) {
        // Step 1: Confirm Sale Data
        const res = await api.put(`/bookings/vehicle/${editingVehicle.id}/sold`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        bookingId = res.data.id || activeBooking?.id;
        setTempBookingId(bookingId);
        setFormStep(2); // Move to Step 2
        notify('success', 'Penjualan disimpan! Sekarang silakan unggah dokumen.');
        return;
      }

      // Step 2: Upload Documents and Finish
      if (bookingId) {
        await handleUploadBookingDocs(bookingId);
      }
      
      notify('success', 'Transaksi berhasil diselesaikan!'); 
      setIsConfirmActionModalOpen(false); 
      setDealPhoto(null);
      fetchVehicles();

      if (printDealProof) {
        const d = await handlePrintDoc(bookingId, 'deal-proof', false);
        if (d) {
          setPdfDocuments([d]);
          setIsPdfModalOpen(true);
        }
      }
    } catch (e) { 
      console.error('Sale error:', e);
      notify('error', e.response?.data?.message || 'Penjualan gagal'); 
    }
  };

  const handleCancelBooking = async (type) => {
    if (!cancellationReason.trim()) {
        notify('error', 'Harap berikan alasan pembatalan');
        return;
    }
    notify('loading', 'Memproses pembatalan...');
    try {
      await api.put(`/bookings/vehicle/${editingVehicle.id}/cancel`, { 
        type,
        remark: cancellationReason 
      });
      notify('success', 'Status pemesanan diperbarui'); 
      setIsConfirmActionModalOpen(false); 
      setCancellationReason('');
      fetchVehicles();
    } catch (e) { 
      notify('error', e.response?.data?.message || 'Action failed'); 
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
    if (!window.confirm('Hapus gambar ini?')) return;
    try {
      notify('loading', 'Menghapus gambar...');
      await api.delete(`/vehicles/${editingVehicle.id}/images/${imgId}`);
      // Immediately remove from local state
      setEditingVehicle(prev => ({
        ...prev,
        images: (prev.images || []).filter(img => img.id !== imgId)
      }));
      fetchVehicles();
      notify('success', 'Gambar dihapus!');
    } catch (e) {
      console.error('Delete image error:', e);
      notify('error', e.response?.data?.message || 'Gagal menghapus gambar');
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
      <DynamicIsland status={confirmDeleteId ? 'confirm' : notification.status} message={confirmDeleteId ? 'Hapus kendaraan?' : notification.message} onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)} />
      <PdfViewerModal 
        isOpen={isPdfModalOpen} 
        onClose={() => setIsPdfModalOpen(false)} 
        documents={pdfDocuments} 
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Stok Kendaraan</h1>
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
          { label: 'Total Stok', count: summary.total || 0, icon: Car, color: 'blue', status: '', borderClass: 'border-b-blue-600', bgClass: 'bg-blue-50/20' },
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
        <div className="relative md:col-span-8"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" className="input pl-10 h-12" placeholder="Cari..." value={search} onChange={handleSearch} /></div>
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
              <div key={v.id} onClick={() => openModal(v, true)} className="card relative group pt-1.5 px-3 pb-3 hover:bg-blue-50/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-400/50 dark:hover:bg-blue-900/20 dark:hover:border-blue-800/50 transition-all duration-500 hover:-translate-y-1.5 cursor-pointer overflow-hidden">
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

      {/* MASTER VEHICLE FORM MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setIsViewOnly(false); }} title="Ringkasan Master Kendaraan" maxWidth="max-w-5xl">
        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6 w-fit">
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
        </div>

        {activeTab === 'main' ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3"><div className="w-1 h-5 bg-blue-600 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Detail Spesifikasi</h4></div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Select
                      label="Kategori"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      options={[
                        { value: 'Mobil', label: 'Mobil' },
                        { value: 'Motor', label: 'Motor' }
                      ]}
                      required
                      disabled={isViewOnly}
                    />
                    <Select label="Merek" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} options={brands.map(b => ({ value: b.name, label: b.name }))} required disabled={isViewOnly} />
                    <Input label="Model / Tipe" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} required readOnly={isViewOnly} />
                    <Input label="Nomor Plat" value={formData.plate_number} onChange={e => setFormData({ ...formData, plate_number: sanitizePlate(e.target.value) })} required readOnly={isViewOnly} />
                    <Select label="Tahun" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} options={Array.from({ length: 40 }, (_, i) => ({ value: (new Date().getFullYear() - i).toString(), label: (new Date().getFullYear() - i).toString() }))} required disabled={isViewOnly} />
                    <Select label="Transmisi" value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value })} options={[{ value: 'Manual', label: 'Manual' }, { value: 'Automatic', label: 'Automatic' }, { value: 'CVT', label: 'CVT' }, { value: 'Triptonic', label: 'Triptonic' }]} disabled={isViewOnly} />
                    <Select label="Bahan Bakar" value={formData.fuel_type} onChange={e => setFormData({ ...formData, fuel_type: e.target.value })} options={[{ value: 'Bensin', label: 'Bensin' }, { value: 'Diesel', label: 'Diesel / Solar' }, { value: 'Electric', label: 'Electric (EV)' }, { value: 'Hybrid', label: 'Hybrid' }]} disabled={isViewOnly} />
                    <Input label="Warna" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} readOnly={isViewOnly} />
                    <Input label="Odometer (KM)" value={displayCurrency(formData.odometer)} onChange={e => handleCurrencyChange(setFormData, formData, 'odometer', e.target.value)} readOnly={isViewOnly} />
                    <Input label="Harga Jual" value={displayCurrency(formData.price)} onChange={e => handleCurrencyChange(setFormData, formData, 'price', e.target.value)} required readOnly={isViewOnly} />
                    <Select label="Status Unit" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} options={[{ value: 'Available', label: 'Tersedia' }, { value: 'Sold', label: 'Terjual' }, { value: 'Booked', label: 'Booked' }]} disabled={isViewOnly} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3"><div className="w-1 h-5 bg-green-600 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Keuangan & Inventaris</h4></div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Input label="Harga Beli" icon={Wallet} value={displayCurrency(formData.purchase_price)} onChange={e => handleCurrencyChange(setFormData, formData, 'purchase_price', e.target.value)} readOnly={isViewOnly} />
                    <Input label="Biaya Servis" icon={Wrench} value={displayCurrency(formData.service_cost)} onChange={e => handleCurrencyChange(setFormData, formData, 'service_cost', e.target.value)} readOnly={isViewOnly} />
                    <Input label="Tanggal Masuk" type="date" value={formData.entry_date} onChange={e => setFormData({ ...formData, entry_date: e.target.value })} readOnly={isViewOnly} />
                    {(formData.status === 'Sold' || formData.sold_date) && <Input label="Tanggal Terjual" type="date" value={formData.sold_date} onChange={e => setFormData({ ...formData, sold_date: e.target.value })} readOnly={isViewOnly} />}
                    {isHeadOffice ? (
                      <Select
                        label="Kantor Cabang"
                        value={formData.office_id}
                        onChange={e => setFormData({ ...formData, office_id: e.target.value })}
                        options={[
                          { value: '', label: '-- Pilih Cabang --' },
                          ...offices.map(o => ({ value: o.id, label: o.displayName }))
                        ]}
                        required
                        disabled={isViewOnly}
                      />
                    ) : <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[8px] text-gray-400 font-black uppercase">Cabang Saat Ini</p><p className="text-[10px] font-bold">{user?.Office?.name}</p></div>}
                  </div>
                  <textarea className="input h-20 p-3 text-xs" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Catatan..." readOnly={isViewOnly} />
                  {(formData.status === 'Available' && formData.cancellation_reason) && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-1">Catatan Pembatalan Terakhir</label>
                      <textarea 
                        className="input h-20 p-3 text-xs border-red-100 dark:border-red-900/30 bg-red-50/10" 
                        value={formData.cancellation_reason} 
                        onChange={e => setFormData({ ...formData, cancellation_reason: e.target.value })} 
                        placeholder="Alasan pembatalan..." 
                        readOnly={isViewOnly} 
                      />
                    </div>
                  )}
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
                    <div className="flex items-center gap-2"><div className="w-1 h-5 bg-amber-500 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Aktivitas Terbaru</h4></div>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {bookingHistory.map(bh => (
                        <div key={bh.id} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-row sm:items-center justify-between gap-4 transition-all hover:bg-white dark:hover:bg-gray-800">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${bh.status === 'Cancelled' ? 'bg-red-100 text-red-600' : bh.status === 'Sold' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{bh.status === 'Cancelled' ? 'Batal' : bh.status === 'Sold' ? 'Terjual' : 'Booked'}</span>
                              <span className="text-[9px] text-gray-400 font-bold">{new Date(bh.booking_date).toLocaleDateString('id-ID')}</span>
                            </div>
                            <p className="font-black truncate text-gray-900 dark:text-gray-100 text-sm">{bh.customer_name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Agen: {bh.salesAgent?.name || 'Tidak Diketahui'} ({bh.salesAgent?.sales_code || 'N/A'})</p>
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
            {!isViewOnly && <div className="pt-6 border-t border-gray-100 text-right"><button type="submit" className="btn-primary px-8 py-3 bg-blue-600 border-none text-[10px] font-black uppercase tracking-widest shadow-xl">Simpan Perubahan Master</button></div>}
          </form>
        ) : (
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
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {documentTypes.map((type) => {
                   const existingDoc = vehicleDocuments.find(d => d.document_type_id === type.id);
                   return (
                     <div key={type.id} className={`p-5 rounded-3xl border transition-all ${existingDoc ? 'bg-white dark:bg-gray-800 border-green-100 dark:border-green-900/30 shadow-lg shadow-green-500/5' : 'bg-gray-50/50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${existingDoc ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              <FileText size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{type.name}</p>
                                {type.is_mandatory && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Wajib</span>}
                              </div>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{existingDoc ? `Diunggah: ${new Date(existingDoc.created_at).toLocaleDateString('id-ID')}` : 'Belum ada file'}</p>
                            </div>
                          </div>
                          {existingDoc && (
                            <button onClick={() => handleDeleteDocument(editingVehicle.id, existingDoc.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        {existingDoc ? (
                          <div className="flex items-center gap-3 mt-2">
                             <button 
                                onClick={() => window.open(`${IMAGE_BASE_URL}${existingDoc.file_path}`, '_blank')}
                                className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2"
                             >
                               <Eye size={14} /> Lihat Dokumen
                             </button>
                          </div>
                        ) : (
                          <label className={`w-full py-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${isUploadingDoc ? 'opacity-50 pointer-events-none' : 'hover:border-blue-500 hover:bg-blue-50/50 border-gray-200 dark:border-gray-700'}`}>
                            <Upload size={20} className="text-gray-300 mb-2" />
                            <p className="text-[9px] font-black text-gray-400 uppercase">Klik untuk unggah file</p>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept=".jpg,.jpeg,.png,.pdf" 
                              onChange={(e) => handleUploadDocument(editingVehicle.id, type.id, e.target.files[0])}
                              disabled={isUploadingDoc}
                            />
                          </label>
                        )}
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        )}
      </Modal>

      {/* DOCUMENT UPLOAD PROMPT */}
      <Modal isOpen={isDocPromptOpen} onClose={() => { setIsDocPromptOpen(false); setIsModalOpen(false); }} title="Unit Berhasil Disimpan">
        <div className="p-6 text-center space-y-6">
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-500 mx-auto animate-bounce">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Data Unit Tersimpan</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Apakah Anda ingin mengunggah dokumen legalitas (STNK, BPKB, dll) untuk unit ini sekarang?</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4">
            <button 
              onClick={() => {
                setIsDocPromptOpen(false);
                setIsModalOpen(false);
              }}
              className="py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
            >
              Nanti Saja
            </button>
            <button 
              onClick={() => {
                setIsDocPromptOpen(false);
                setActiveTab('documents');
              }}
              className="py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Upload size={14} /> Ya, Upload Sekarang
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isConfirmActionModalOpen} onClose={() => setIsConfirmActionModalOpen(false)} title="Konfirmasi Transaksi">
        <div className="space-y-6">
          {actionType === 'sold' && (
            <div className="flex gap-2 px-1">
              <div className={`h-1.5 flex-1 rounded-full transition-all ${formStep >= 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all ${formStep >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
            </div>
          )}
          {actionType === 'sold' && (
            <div className="space-y-6">
              {formStep === 1 ? (
                <div className="space-y-6">
                  <div className="p-4 bg-gray-900 text-white rounded-[32px] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="relative flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nomor Plat</p>
                        <p className="text-xl font-black tracking-tight">{editingVehicle?.plate_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Harga Jual</p>
                        <p className="text-xl font-black text-blue-400 tracking-tight">{formatPrice(editingVehicle?.price)}</p>
                      </div>
                    </div>
                  </div>
                  {!activeBooking ? (
                    <div className="space-y-4 p-5 bg-gray-50/80 dark:bg-gray-800/60 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-1">
                        <UserIcon size={14} className="text-orange-500" />
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Data Pelanggan Jual Langsung</p>
                      </div>
                      <Input label="Nama Pelanggan" value={bookingData.customer_name} onChange={e => setBookingData({ ...bookingData, customer_name: e.target.value })} required />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="NIK (Nomor ID)" value={bookingData.nik} onChange={e => setBookingData({ ...bookingData, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })} required />
                        <Input label="Nomor Telepon" value={bookingData.customer_phone} onChange={e => setBookingData({ ...bookingData, customer_phone: sanitizePhone(e.target.value) })} required />
                      </div>
                      <textarea 
                        className="input min-h-[80px] p-3 text-xs" 
                        placeholder="Catatan transaksi tambahan..." 
                        value={bookingData.notes} 
                        onChange={e => setBookingData({ ...bookingData, notes: e.target.value })} 
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
                      <p className="text-[9px] font-black text-blue-200 uppercase mb-1">Menjual ke Pelanggan Reservasi:</p>
                      <p className="text-base font-black uppercase tracking-tight">{activeBooking.customer_name}</p>
                      <p className="text-xs font-medium opacity-80">{activeBooking.customer_phone}</p>
                    </div>
                  )}
                  <Select label="Eksekutif Penjualan" value={bookingData.sales_agent_id} onChange={e => setBookingData({ ...bookingData, sales_agent_id: e.target.value })} options={salesAgents.map(a => ({ value: a.id, label: `${a.name} [${a.sales_code}] - ${a.Office?.name || 'Tidak Diketahui'}` }))} required />
                </div>
              ) : (
                <div className="space-y-6">
                  {bookingDocumentTypes.length > 0 && (
                    <div className="space-y-4 p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[32px] border border-indigo-100 dark:border-indigo-900/30">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText size={14} className="text-indigo-600" />
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Dokumen Legalitas Pelanggan</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {bookingDocumentTypes.map(type => (
                          <div key={type.id} className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-1">{type.name}</label>
                            <label className={`flex items-center gap-2 p-2 rounded-xl border-2 border-dashed transition-all cursor-pointer ${selectedBookingDocs[type.id] ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-indigo-400'}`}>
                              {selectedBookingDocs[type.id] ? <CheckCircle size={14} /> : <Upload size={14} className="text-gray-300" />}
                              <span className="text-[10px] font-bold truncate flex-1">{selectedBookingDocs[type.id] ? selectedBookingDocs[type.id].name : 'Unggah File'}</span>
                              <input type="file" className="hidden" onChange={(e) => setSelectedBookingDocs({ ...selectedBookingDocs, [type.id]: e.target.files[0] })} />
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 mt-4">
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Camera size={14} className="text-blue-500" /> Foto Bukti Penyerahan
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
                          <p className="text-[10px] font-black text-gray-400 uppercase">Klik untuk unggah foto bersama pelanggan</p>
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
                    <span className="text-[10px] font-black text-gray-400 uppercase">Cetak Kwitansi Penjualan setelah simpan</span>
                  </div>
                </div>
              )}
              <button onClick={handleConfirmSale} className={`w-full py-4 ${formStep === 1 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500'} text-white rounded-2xl font-black transition-all active:scale-95 uppercase text-xs tracking-widest`}>
                {formStep === 1 ? 'SIMPAN & LANJUT KE UNGGAH' : 'SELESAI & CETAK DOKUMEN'}
              </button>
            </div>
          )}
          {actionType === 'cancel' && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl">
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <Hash size={14} className="text-orange-500" />
                    <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Verifikasi Data</p>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Nomor Plat</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">{editingVehicle?.plate_number}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Nama Pelanggan</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white uppercase truncate">{activeBooking?.customer_name || '-'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">NIK / Nomor ID</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{activeBooking?.id_number || activeBooking?.nik || '-'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Total Uang Muka (DP)</p>
                      <p className="text-sm font-black text-orange-600">{formatPrice(activeBooking?.down_payment || 0)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 ml-1">
                    <Edit size={14} className="text-blue-500" />
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Alasan Pembatalan / Catatan</label>
                    <span className="text-[9px] font-bold text-red-500 ml-auto uppercase opacity-60">* Wajib</span>
                  </div>
                  <textarea 
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Ketik alasan mengapa pemesanan ini dibatalkan..."
                    className="w-full p-4 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none min-h-[120px] resize-none shadow-sm transition-all placeholder:text-gray-300"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-orange-600 uppercase text-center tracking-[0.2em] opacity-80">Pilih Hasil Akhir</p>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => handleCancelBooking('Cancelled')}
                      className="p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 rounded-2xl text-left transition-all group shadow-md active:bg-gray-100 dark:active:bg-gray-700 active:scale-[0.98] flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <XCircle size={16} className="text-red-600" />
                          <p className="text-sm font-black text-red-600 uppercase tracking-tight">Batal (Tanpa Refund)</p>
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
                          <p className="text-sm font-black text-blue-600 uppercase tracking-tight">Refund (Pengembalian Penuh)</p>
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
          <button onClick={() => setIsConfirmActionModalOpen(false)} className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all uppercase text-xs tracking-widest">KEMBALI KE DASHBOARD</button>
        </div>
      </Modal>

      <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Formulir Reservasi Unit">
        <form onSubmit={handleBookingSubmit} className="space-y-6">
          <div className="flex gap-2 px-1">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${formStep >= 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${formStep >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
          </div>
          {formStep === 1 ? (
            <div className="space-y-4">
              <Input label="Nama Pelanggan" value={bookingData.customer_name} onChange={e => setBookingData({ ...bookingData, customer_name: e.target.value })} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="NIK (Nomor ID)" placeholder="16-digit NIK" value={bookingData.nik} onChange={e => setBookingData({ ...bookingData, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })} required />
                <Input label="Nomor Telepon" placeholder="+62..." value={bookingData.customer_phone} onChange={e => setBookingData({ ...bookingData, customer_phone: sanitizePhone(e.target.value) })} required />
              </div>
              <Input label="Uang Muka (DP)" value={displayCurrency(bookingData.down_payment)} onChange={e => handleCurrencyChange(setBookingData, bookingData, 'down_payment', e.target.value)} />
              <Select
                label="Agen Penjualan (Opsional)"
                value={bookingData.sales_agent_id}
                onChange={e => setBookingData({ ...bookingData, sales_agent_id: e.target.value })}
                options={[{ value: '', label: '-- Pilih Sales (Opsional) --' }, ...salesAgents.map(a => ({ value: a.id, label: `${a.name} [${a.sales_code}] - ${a.Office?.name || 'Tidak Diketahui'}` }))]}
              />
              <textarea
                className="input min-h-[80px] p-3 text-xs"
                placeholder="Catatan / informasi tambahan..."
                value={bookingData.notes}
                onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {bookingDocumentTypes.length > 0 && (
                <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-800/40 rounded-[32px] border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={14} className="text-indigo-600" />
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Dokumen Legalitas Pelanggan (Opsional)</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bookingDocumentTypes.map(type => (
                      <div key={type.id} className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase ml-1">{type.name}</label>
                        <label className={`flex items-center gap-2 p-2 rounded-xl border-2 border-dashed transition-all cursor-pointer ${selectedBookingDocs[type.id] ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-indigo-400'}`}>
                          {selectedBookingDocs[type.id] ? <CheckCircle size={14} /> : <Upload size={14} className="text-gray-300" />}
                          <span className="text-[10px] font-bold truncate flex-1">{selectedBookingDocs[type.id] ? selectedBookingDocs[type.id].name : 'Unggah File'}</span>
                          <input type="file" className="hidden" onChange={(e) => setSelectedBookingDocs({ ...selectedBookingDocs, [type.id]: e.target.files[0] })} />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all cursor-pointer" onClick={() => {
                  const newVal = !printReceipt;
                  setPrintReceipt(newVal);
                  localStorage.setItem('pref_print_receipt', newVal);
                }}>
                  <input type="checkbox" checked={printReceipt} onChange={() => {}} className="w-4 h-4 rounded text-blue-600" />
                  <span className="text-[9px] font-black text-gray-400 uppercase leading-none">Cetak Kwitansi Reservasi</span>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all cursor-pointer" onClick={() => {
                  const newVal = !printInvoice;
                  setPrintInvoice(newVal);
                  localStorage.setItem('pref_print_invoice', newVal);
                }}>
                  <input type="checkbox" checked={printInvoice} onChange={() => {}} className="w-4 h-4 rounded text-blue-600" />
                  <span className="text-[9px] font-black text-gray-400 uppercase leading-none">Cetak Invoice Pelunasan</span>
                </div>
              </div>
            </div>
          )}
          <button type="submit" className={`w-full py-4 ${formStep === 1 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500'} text-white rounded-2xl font-black transition-all active:scale-95 uppercase text-xs tracking-widest`}>
            {formStep === 1 ? 'SIMPAN DATA & LANJUT KE UNGGAH' : 'SELESAI & CETAK DOKUMEN'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
