import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Search, FileSpreadsheet, Printer, Eye, Calendar, User,
  Phone, Tag, Clock, CheckCircle, XCircle, MoreHorizontal,
  Building2, Hash, Wallet, UserCheck, Trash2, Edit, CheckCircle2,
  PhoneCall, CreditCard as CardIcon, ChevronRight, ArrowUpDown, FileText, Upload
} from 'lucide-react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DynamicIsland from '../components/DynamicIsland';
import ViewSwitcher from '../components/ui/ViewSwitcher';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/Modal';
import PdfViewerModal from '../components/PdfViewerModal';
import { motion, AnimatePresence } from 'framer-motion';
import { IMAGE_BASE_URL } from '../config';

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'grid' : 'table');

  const [activeTab, setActiveTab] = useState('main');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [bookingDocuments, setBookingDocuments] = useState([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);


  // Delete handling
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // PDF Viewer handling
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfDocuments, setPdfDocuments] = useState([]);

  // Booking Edit handling
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [salesAgents, setSalesAgents] = useState([]);
  const [bookingData, setBookingData] = useState({
    vehicle_id: '', customer_name: '', customer_phone: '', id_number: '',
    booking_date: '', down_payment: '', notes: '', sales_agent_id: ''
  });
  const [printReceipt, setPrintReceipt] = useState(localStorage.getItem('pref_print_receipt') === 'true');
  const [printInvoice, setPrintInvoice] = useState(localStorage.getItem('pref_print_invoice') === 'true');

  const storedUser = JSON.parse(localStorage.getItem('user_data') || '{}');
  const user = storedUser.user || storedUser;

  const notify = (status, message, delay = 2000) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sort, setSort] = useState({ column: 'updatedAt', direction: 'DESC' });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const r = await api.get('/bookings', {
        params: { 
          page, 
          search, 
          status: statusFilter, 
          size: 8,
          startDate: dateRange.start,
          endDate: dateRange.end,
          sortBy: sort.column,
          sortOrder: sort.direction
        }
      });
      const data = r.data.items || (Array.isArray(r.data) ? r.data : []);
      setTransactions(data);
      setTotalPages(r.data.total_pages || 1);
    } catch (e) {
      console.error('Fetch transactions error:', e);
      notify('error', 'Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const r = await api.get('/documents/types', { params: { category: 'Booking' } });
      setDocumentTypes(r.data);
    } catch (e) { console.error('Fetch doc types error:', e); }
  };

  const fetchBookingDocuments = async (bookingId) => {
    try {
      const r = await api.get(`/documents/booking/${bookingId}`);
      setBookingDocuments(r.data);
    } catch (e) { console.error('Fetch docs error:', e); }
  };

  const handleUploadDocument = async (bookingId, typeId, file) => {
    if (!file) return;
    setIsUploadingDoc(true);
    notify('loading', 'Uploading document...');
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('document_type_id', typeId);
      await api.post(`/documents/booking/${bookingId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      notify('success', 'Document uploaded successfully');
      fetchBookingDocuments(bookingId);
    } catch (err) {
      console.error('Upload doc error:', err);
      notify('error', 'Failed to upload document');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (bookingId, docId) => {
    if (!window.confirm('Hapus dokumen ini?')) return;
    notify('loading', 'Deleting document...');
    try {
      await api.delete(`/documents/booking/${bookingId}/${docId}`);
      notify('success', 'Document deleted');
      fetchBookingDocuments(bookingId);
    } catch (err) {
      console.error('Delete doc error:', err);
      notify('error', 'Failed to delete document');
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchMetadata();
  }, [page, search, statusFilter, dateRange, sort]);


  const toggleSort = (column) => {
    setSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'DESC' ? 'ASC' : 'DESC'
    }));
  };

  const handlePrintDoc = async (bookingId, type, openModal = true) => {
    notify('loading', `Preparing document...`);
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
      } else if (type === 'sale-invoice' || type === 'deal-proof') {
        const isProof = type === 'deal-proof';
        label = isProof ? 'Sales Receipt' : 'Final Settlement Invoice';
        filename = isProof ? `Sales_Receipt${customerSuffix}.pdf` : `Final_Settlement_Invoice${customerSuffix}.pdf`;

        const res = await api.get(`/export/sales/${bookingId}/invoice${isProof ? '?isProof=true' : ''}`, { responseType: 'blob' });
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
      console.error('Print error:', e);
      notify('error', 'Failed to generate document');
      return null;
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    notify('loading', 'Updating booking details...');
    try {
      const cleanData = {
        ...bookingData,
        down_payment: bookingData.down_payment?.toString().replace(/\D/g, '') || 0
      };

      await api.put(`/bookings/${bookingData.id}`, cleanData);

      notify('success', 'Booking updated successfully!');
      setIsBookingModalOpen(false);
      fetchTransactions();

      const docsToOpen = [];
      if (printReceipt) {
        const d = await handlePrintDoc(bookingData.id, 'receipt', false);
        if (d) docsToOpen.push(d);
      }
      if (printInvoice) {
        const d = await handlePrintDoc(bookingData.id, 'invoice', false);
        if (d) docsToOpen.push(d);
      }

      if (docsToOpen.length > 0) {
        setPdfDocuments(docsToOpen);
        setIsPdfModalOpen(true);
      }

    } catch (err) {
      console.error('Booking Update Error:', err);
      notify('error', err.response?.data?.message || 'Update failed');
    }
  };

  const openBookingModal = (t) => {
    setActiveTab('main');
    setBookingDocuments([]);
    setBookingData({
      ...t,
      id: t.id,
      vehicle_id: t.vehicle_id,
      booking_date: t.booking_date?.split('T')[0] || '',
      nik: t.nik || '',
      id_number: t.id_number || '',
      notes: t.notes || '',
      sales_agent_id: t.sales_agent_id || ''
    });
    fetchAgentsByOffice(t.office_id);
    fetchBookingDocuments(t.id);
    setIsBookingModalOpen(true);
  };


  const fetchAgentsByOffice = async (officeId) => {
    try {
      const r = await api.get('/sales-agents/active', { params: { officeId } });
      setSalesAgents(r.data);
    } catch (e) { console.error(e); }
  };

  const handleCurrencyChange = (setter, state, field, val) => {
    const num = val.replace(/\D/g, '');
    setter({ ...state, [field]: num });
  };

  const displayCurrency = (val) => {
    if (val === null || val === undefined || val === '') return '';
    return parseInt(val).toLocaleString('id-ID');
  };

  const handleCancelBooking = async (type) => {
    if (!cancellationReason.trim()) {
        notify('error', 'Please provide a reason for cancellation');
        return;
    }
    notify('loading', 'Processing cancellation...');
    try {
      await api.put(`/bookings/${selectedTransaction.id}/cancel`, { 
        type,
        remark: cancellationReason
      });
      notify('success', 'Booking cancelled successfully');
      setIsCancelModalOpen(false);
      setCancellationReason('');
      fetchTransactions();
    } catch (err) {
      console.error('Cancel booking error:', err);
      notify('error', err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;
    notify('loading', 'Moving transaction to trash...');
    try {
      await api.delete(`/bookings/${selectedTransaction.id}`);
      notify('success', 'Transaction moved to trash');
      setIsDeleteModalOpen(false);
      fetchTransactions();
    } catch (e) {
      console.error('Delete error:', e);
      notify('error', 'Failed to delete transaction');
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-gray-50 text-gray-400 dark:bg-gray-800 border border-gray-100 dark:border-gray-800">No Status</span>;

    const s = status.toLowerCase();
    switch (s) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">Booking</span>;
      case 'sold':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-800">Sold / Deal</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-800">Cancelled (Income)</span>;
      case 'refunded':
      case 'refund':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-100 dark:border-orange-800">Refunded</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-gray-50 text-gray-400 dark:bg-gray-800 border border-gray-100 dark:border-gray-800">{status}</span>;
    }
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatNumber = (val) => {
    return new Intl.NumberFormat('id-ID').format(val);
  };

  return (
    <div className="space-y-6">
      <DynamicIsland status={notification.status} message={notification.message} />
      <PdfViewerModal 
        isOpen={isPdfModalOpen} 
        onClose={() => setIsPdfModalOpen(false)} 
        documents={pdfDocuments} 
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Transactions & Bookings</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Financial History & Documents</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
          <button className="btn gap-2 text-xs h-11 px-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <FileSpreadsheet size={18} className="text-green-600" /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
        <div className="lg:col-span-4 relative">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Search Transaction</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search ID, customer or unit..."
              className="input pl-10 h-11 text-xs"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Status</label>
          <select
            className="input h-11 text-xs font-bold"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Active">Active Booking</option>
            <option value="Sold">Sold / Deal</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>

        <div className="lg:col-span-4 grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Start Date</label>
            <div className="relative group">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="date" 
                className="input pl-9 h-11 text-[11px] font-bold w-full cursor-pointer" 
                value={dateRange.start}
                onClick={(e) => e.target.showPicker?.()}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">End Date</label>
            <div className="relative group">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="date" 
                className="input pl-9 h-11 text-[11px] font-bold w-full cursor-pointer" 
                value={dateRange.end}
                onClick={(e) => e.target.showPicker?.()}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <button 
            onClick={() => setDateRange({ start: '', end: '' })}
            className="w-full h-11 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Clear Date
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="card-container min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-4 text-xs font-black text-gray-400 uppercase tracking-widest">Refreshing transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center text-gray-300 mb-4">
              <Search size={32} />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No transactions found</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="card overflow-hidden border-none shadow-xl shadow-gray-200/50 dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors group" onClick={() => toggleSort('booking_date')}>
                      <div className="flex items-center gap-2">
                        Booking Date <ArrowUpDown size={10} className={sort.column === 'booking_date' ? 'text-blue-500' : 'text-gray-300 opacity-0 group-hover:opacity-100'} />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors group" onClick={() => toggleSort('updatedAt')}>
                      <div className="flex items-center gap-2">
                        Date Modif <ArrowUpDown size={10} className={sort.column === 'updatedAt' ? 'text-blue-500' : 'text-gray-300 opacity-0 group-hover:opacity-100'} />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors group" onClick={() => toggleSort('customer_name')}>
                      <div className="flex items-center gap-2">
                        Customer <ArrowUpDown size={10} className={sort.column === 'customer_name' ? 'text-blue-500' : 'text-gray-300 opacity-0 group-hover:opacity-100'} />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit Detail</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Office / Sales</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Pricing</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Print Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {transactions.map((t) => {
                    const s = (t.status || '').toLowerCase();
                    return (
                      <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 group">
                            <div>
                              <p className="text-xs font-bold text-gray-900 dark:text-white">{new Date(t.booking_date).toLocaleDateString('id-ID')}</p>
                              <p className="text-[9px] text-gray-300 font-bold uppercase truncate max-w-[80px]">ID: {t.id.split('-')[0]}</p>
                            </div>
                            <div className="flex gap-1 transition-opacity">
                              <button onClick={() => { setSelectedTransaction(t); setIsDeleteModalOpen(true); }} className="btn-delete !p-1" title="Trash"><Trash2 size={12} /></button>
                              {s === 'active' && (
                                <>
                                  <button onClick={() => openBookingModal(t)} className="btn-edit !p-1" title="Edit"><Edit size={12} /></button>
                                  <button 
                                    onClick={() => { 
                                      setSelectedTransaction(t); 
                                      setCancellationReason(''); 
                                      setIsCancelModalOpen(true); 
                                    }}
                                    className="btn-icon !p-1 text-red-500 hover:bg-red-50" 
                                    title="Cancel Booking"
                                  >
                                    <XCircle size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">{new Date(t.updatedAt).toLocaleDateString('id-ID')}</span>
                            <span className="text-[9px] text-gray-400 font-bold">{new Date(t.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                              <User size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-gray-900 dark:text-white uppercase truncate">{t.customer_name}</p>
                              <p className="text-[10px] text-gray-400 font-bold">{t.customer_phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{t.Vehicle?.brand} {t.Vehicle?.model}</p>
                          <button 
                            onClick={() => navigate('/vehicles', { state: { searchPlate: t.Vehicle?.plate_number } })}
                            className="text-[10px] text-blue-600 font-black uppercase hover:underline cursor-pointer text-left block"
                          >
                            {t.Vehicle?.plate_number}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Building2 size={12} className="text-gray-400" />
                              <p className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">{t.Office?.name || 'Central Office'}</p>
                            </div>
                            {t.salesAgent && (
                              <div className="flex items-center gap-1.5">
                                <UserCheck size={12} className="text-blue-500" />
                                <p className="text-[10px] font-bold text-blue-600 uppercase">{t.salesAgent?.name}</p>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400">Rp. {formatNumber(t.Vehicle?.price || 0)}</span>
                            <span className="text-[10px] font-bold text-gray-400">Dp. {formatPrice(t.down_payment)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            {getStatusBadge(t.status)}
                            {(['cancelled', 'refunded', 'refund'].includes(t.status?.toLowerCase())) && t.cancellation_reason && (
                              <p className="text-[9px] text-gray-400 font-bold italic mt-1 max-w-[120px] truncate" title={t.cancellation_reason}>
                                "{t.cancellation_reason}"
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {(s === 'active' || s === 'sold') && (
                              <>
                                <button onClick={() => handlePrintDoc(t.id, 'receipt')} className="btn-icon hover:text-indigo-600 hover:bg-indigo-50" title="Print Receipt"><Printer size={12} /></button>
                                <button onClick={() => handlePrintDoc(t.id, 'sale-invoice')} className="btn-icon hover:text-amber-600 hover:bg-amber-50" title="Print Invoice"><FileSpreadsheet size={12} /></button>
                              </>
                            )}
                            {s === 'sold' && <button onClick={() => handlePrintDoc(t.id, 'deal-proof')} className="btn-icon hover:text-green-600 hover:bg-green-50" title="Print Sales Receipt"><CheckCircle size={12} /></button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {transactions.map((t, idx) => {
                const s = (t.status || '').toLowerCase();
                return (
                  <motion.div 
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="card-hover overflow-hidden group border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 bg-white dark:bg-gray-900"
                  >
                    {/* Header: Date & Status */}
                    <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-start bg-gray-50/50 dark:bg-gray-800/30">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Booking Date</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{new Date(t.booking_date).toLocaleDateString('id-ID')}</p>
                      </div>
                      {getStatusBadge(t.status)}
                    </div>

                    {/* Content: Customer & Vehicle */}
                    <div className="p-4 space-y-4">
                      {/* Customer Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                          <User size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">{t.customer_name}</p>
                          <div className="flex items-center gap-1 text-gray-400">
                            <Phone size={10} className="text-blue-400" />
                            <p className="text-[11px] font-bold">{t.customer_phone}</p>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle Info */}
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Unit Detail</p>
                            <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">{t.Vehicle?.brand} {t.Vehicle?.model}</p>
                          </div>
                          <button 
                            onClick={() => navigate('/vehicles', { state: { searchPlate: t.Vehicle?.plate_number } })}
                            className="px-2 py-0.5 bg-blue-600 text-[10px] font-black text-white rounded-md uppercase tracking-tight hover:bg-blue-700 transition-colors cursor-pointer"
                          >
                            {t.Vehicle?.plate_number}
                          </button>
                        </div>
                        <div className="flex justify-between items-end pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                          <div>
                            <p className="text-[9px] font-black text-blue-400 uppercase leading-none">Sale Price</p>
                            <p className="text-sm font-black text-blue-600 dark:text-blue-400">Rp. {formatNumber(t.Vehicle?.price || 0)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-gray-400 uppercase leading-none">Down Payment</p>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{formatPrice(t.down_payment)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Office/Sales */}
                      <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} className="text-gray-400" />
                          <p className="text-[10px] font-bold text-gray-500 uppercase">{t.Office?.name || 'Central Office'}</p>
                        </div>
                        {t.salesAgent ? (
                          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800/50 min-w-0">
                            <UserCheck size={12} className="text-blue-500 shrink-0" />
                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight truncate" title={t.salesAgent?.name}>
                              {t.salesAgent?.name}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800/50">
                            <User size={12} className="text-gray-400 shrink-0" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">No Sales Agent</p>
                          </div>
                        )}
                      </div>

                      {/* Cancellation Reason */}
                      {(['cancelled', 'refunded', 'refund'].includes(t.status?.toLowerCase())) && t.cancellation_reason && (
                        <div className="px-4 py-2 bg-red-50/50 dark:bg-red-900/10 border-t border-red-50 dark:border-red-900/20">
                          <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-0.5">Cancellation Remark</p>
                          <p className="text-[11px] text-gray-700 dark:text-gray-300 italic">"{t.cancellation_reason}"</p>
                        </div>
                      )}
                    </div>

                    {/* Footer: All Actions */}
                    <div className="p-2.5 px-4 bg-gray-50 dark:bg-gray-800/20 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                      <div className="flex gap-1.5">
                        <button onClick={() => { setSelectedTransaction(t); setIsDeleteModalOpen(true); }} className="btn-delete !bg-white dark:!bg-gray-800 !p-1.5 shadow-sm" title="Trash"><Trash2 size={14} /></button>
                        {s === 'active' && (
                          <>
                            <button onClick={() => openBookingModal(t)} className="btn-edit !bg-white dark:!bg-gray-800 !p-1.5 shadow-sm" title="Edit"><Edit size={14} /></button>
                             <button onClick={() => { 
                               setSelectedTransaction(t); 
                               setCancellationReason(''); // Reset
                               setIsCancelModalOpen(true); 
                             }} className="btn-icon !bg-white dark:!bg-gray-800 !p-1.5 !text-red-500 hover:!bg-red-50 shadow-sm" title="Cancel Booking"><XCircle size={14} /></button>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {(s === 'active' || s === 'sold') && (
                          <>
                            <button onClick={() => handlePrintDoc(t.id, 'receipt')} className="p-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Print Reservation Receipt"><Printer size={14} /></button>
                            <button onClick={() => handlePrintDoc(t.id, 'sale-invoice')} className="p-1.5 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg hover:bg-amber-600 dark:hover:bg-amber-600 hover:text-white transition-all shadow-sm" title="Print Final Invoice"><FileSpreadsheet size={14} /></button>
                          </>
                        )}
                        {s === 'sold' && <button onClick={() => handlePrintDoc(t.id, 'deal-proof')} className="p-1.5 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-600 dark:hover:bg-green-600 hover:text-white transition-all shadow-sm" title="Print Sales Receipt"><CheckCircle2 size={14} /></button>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Move to Trash"
      >
        <div className="space-y-6 pt-2">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600">
              <Trash2 size={32} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Are you sure you want to move this transaction to trash?</p>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Transaction ID: {selectedTransaction?.id.split('-')[0]}</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Transaction Details:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Customer</p>
                <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{selectedTransaction?.customer_name}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Unit</p>
                <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{selectedTransaction?.Vehicle?.brand} {selectedTransaction?.Vehicle?.model}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all uppercase text-xs tracking-widest"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95 uppercase text-xs tracking-widest"
            >
              Move to Trash
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Transaction Cancellation"
      >
        <div className="space-y-6 pt-2">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 shadow-inner">
              <XCircle size={32} />
            </div>
            <div className="w-full">
              <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">Transaction Verification</p>
              
              {/* Verification Card */}
              <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-inner mb-6">
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-left">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Plate Number</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">{selectedTransaction?.Vehicle?.plate_number}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Customer Name</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white uppercase truncate">{selectedTransaction?.customer_name}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">NIK / ID Number</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{selectedTransaction?.id_number || selectedTransaction?.nik || '-'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Down Payment</p>
                    <p className="text-sm font-black text-orange-600">{formatPrice(selectedTransaction?.down_payment || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="space-y-2 mb-6 text-left px-1">
                <div className="flex items-center gap-2">
                  <Edit size={14} className="text-blue-500" />
                  <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Cancellation Reason / Remark</label>
                  <span className="text-[9px] font-bold text-red-500 ml-auto opacity-60">* REQUIRED</span>
                </div>
                <textarea 
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Type the official reason for cancellation here..."
                  className="w-full p-4 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none min-h-[120px] resize-none shadow-sm transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Select Process Method</p>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => handleCancelBooking('Cancelled')}
                    className="p-5 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 rounded-2xl text-left transition-all group shadow-md active:bg-gray-100 dark:active:bg-gray-700 active:scale-[0.98] flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle size={16} className="text-red-600" />
                        <p className="text-sm font-black text-red-600 uppercase tracking-tight">Cancel (No Refund)</p>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed max-w-[280px]">Dana DP hangus dan menjadi pendapatan kantor.</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-red-500 transition-colors ml-2" />
                  </button>

                  <button 
                    onClick={() => handleCancelBooking('Refunded')}
                    className="p-5 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 rounded-2xl text-left transition-all group shadow-md active:bg-gray-100 dark:active:bg-gray-700 active:scale-[0.98] flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 size={16} className="text-blue-600" />
                        <p className="text-sm font-black text-blue-600 uppercase tracking-tight">Refund (Full Return)</p>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed max-w-[280px]">Dana DP dikembalikan sepenuhnya ke customer.</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => setIsCancelModalOpen(false)} className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all uppercase text-[10px] tracking-[0.2em]">KEMBALI KE DAFTAR</button>
        </div>
      </Modal>

      {/* Booking Form Modal */}
      <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Update Reservation Details">
        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6 w-fit">
          <button
            onClick={() => setActiveTab('main')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'main' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Tag size={14} /> Reservation Info
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'documents' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <FileText size={14} /> Legal Documents
          </button>
        </div>

        {activeTab === 'main' ? (
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <Input label="Customer Name" value={bookingData.customer_name} onChange={e => setBookingData({ ...bookingData, customer_name: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="NIK (ID Number)" placeholder="16-digit NIK" value={bookingData.nik || ''} onChange={e => setBookingData({ ...bookingData, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })} required />
              <Input label="Phone Number" placeholder="+62..." value={bookingData.customer_phone} onChange={e => setBookingData({ ...bookingData, customer_phone: e.target.value })} required />
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
              value={bookingData.notes || ''}
              onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all cursor-pointer" onClick={() => {
                const newVal = !printReceipt;
                setPrintReceipt(newVal);
                localStorage.setItem('pref_print_receipt', newVal);
              }}>
                <input type="checkbox" checked={printReceipt} readOnly className="w-4 h-4 rounded text-blue-600" />
                <span className="text-[9px] font-black text-gray-400 uppercase leading-none">Print Reservation Receipt</span>
              </div>
              <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all cursor-pointer" onClick={() => {
                const newVal = !printInvoice;
                setPrintInvoice(newVal);
                localStorage.setItem('pref_print_invoice', newVal);
              }}>
                <input type="checkbox" checked={printInvoice} readOnly className="w-4 h-4 rounded text-blue-600" />
                <span className="text-[9px] font-black text-gray-400 uppercase leading-none">Print Settlement Invoice</span>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black border-none uppercase text-xs font-black tracking-widest shadow-xl">UPDATE RESERVATION</button>
          </form>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3"><div className="w-1 h-5 bg-blue-600 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Customer & Transaction Documents</h4></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documentTypes.map((type) => {
                const existingDoc = bookingDocuments.find(d => d.document_type_id === type.id);
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
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{existingDoc ? `Uploaded: ${new Date(existingDoc.created_at).toLocaleDateString('id-ID')}` : 'Belum ada file'}</p>
                        </div>
                      </div>
                      {existingDoc && (
                        <button onClick={() => handleDeleteDocument(bookingData.id, existingDoc.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors">
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
                           <Eye size={14} /> View Document
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
                          onChange={(e) => handleUploadDocument(bookingData.id, type.id, e.target.files[0])}
                          disabled={isUploadingDoc}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Transactions;
