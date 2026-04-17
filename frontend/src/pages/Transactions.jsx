import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Search, FileSpreadsheet, Printer, Eye, Calendar, User, 
  Phone, Tag, Clock, CheckCircle, XCircle, MoreHorizontal,
  Building2, Hash, Wallet, UserCheck, Trash2
} from 'lucide-react';
import DynamicIsland from '../components/DynamicIsland';
import ViewSwitcher from '../components/ui/ViewSwitcher';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [viewMode, setViewMode] = useState('table');
  
  // Delete handling
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const storedUser = JSON.parse(localStorage.getItem('user_data') || '{}');
  const user = storedUser.user || storedUser;

  const notify = (status, message, delay = 2000) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const r = await api.get('/bookings', {
        params: { page, search, status: statusFilter }
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

  useEffect(() => {
    fetchTransactions();
  }, [page, search, statusFilter]);

  const handlePrint = async (id, type) => {
    notify('loading', `Generating document...`);
    try {
      let url = '';
      if (type === 'receipt' || type === 'invoice') {
        const docType = type === 'receipt' ? 'receipt' : 'dp-invoice';
        const res = await api.get(`/export/bookings/${id}?type=${docType}`, { responseType: 'blob' });
        url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      } else if (type === 'sale-invoice' || type === 'deal-proof') {
        const isProof = type === 'deal-proof';
        const res = await api.get(`/export/sales/${id}/invoice${isProof ? '?isProof=true' : ''}`, { responseType: 'blob' });
        url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      }
      
      if (url) {
        window.open(url, '_blank');
        notify('success', 'Document generated!');
      }
    } catch (e) {
      console.error('Print error:', e);
      notify('error', 'Failed to generate document');
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
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-800">Cancelled</span>;
      default: 
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-100 dark:border-gray-800">{status}</span>;
    }
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      <DynamicIsland status={notification.status} message={notification.message} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Transactions & Bookings</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Financial History & Documents</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="btn gap-2 text-xs h-11 px-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <FileSpreadsheet size={18} className="text-green-600" /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" placeholder="Search customer or unit..."
            className="input pl-10 h-11"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="input h-11 text-xs"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Active">Active Booking</option>
          <option value="Sold">Sold / Deal</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      {/* Content */}
      <div className="card overflow-hidden border-none shadow-xl shadow-gray-200/50 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Booking Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Processed Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit Detail</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Office / Sales</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Booking Fee</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sale Price</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-20 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No transactions found</p>
                  </td>
                </tr>
              ) : transactions.map((t) => {
                const s = (t.status || '').toLowerCase();
                return (
                  <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{new Date(t.booking_date).toLocaleDateString('id-ID')}</p>
                      <p className="text-[9px] text-gray-300 font-bold uppercase truncate max-w-[80px]">ID: {t.id.split('-')[0]}</p>
                    </td>
                    <td className="px-6 py-4">
                      {s === 'sold' ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">Sold On</span>
                          <span className="text-xs font-bold text-green-700 dark:text-green-400">{new Date(t.updatedAt).toLocaleDateString('id-ID')}</span>
                        </div>
                      ) : s === 'cancelled' ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-red-600 uppercase tracking-tighter">Cancelled On</span>
                          <span className="text-xs font-bold text-red-700 dark:text-red-400">{new Date(t.updatedAt).toLocaleDateString('id-ID')}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic font-medium">Pending...</span>
                      )}
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
                      <p className="text-[10px] text-blue-600 font-black uppercase">{t.Vehicle?.plate_number}</p>
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
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-gray-900 dark:text-white">{formatPrice(t.down_payment)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-blue-600 dark:text-blue-400">{formatPrice(t.Vehicle?.price || 0)}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {(s === 'active' || s === 'sold') && (
                          <>
                            <button 
                              onClick={() => handlePrint(t.id, 'receipt')}
                              className="p-2 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/30 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm cursor-pointer"
                              title="Print Reservation Receipt"
                            >
                              <Printer size={14} />
                            </button>
                            <button 
                              onClick={() => handlePrint(t.id, 'sale-invoice')}
                              className="p-2 bg-white dark:bg-gray-800 border border-orange-100 dark:border-orange-900/30 text-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-all shadow-sm cursor-pointer"
                              title="Print Final Settlement Invoice"
                            >
                              <FileSpreadsheet size={14} />
                            </button>
                          </>
                        )}
                        {s === 'sold' && (
                          <button 
                            onClick={() => handlePrint(t.id, 'deal-proof')}
                            className="p-2 bg-white dark:bg-gray-800 border border-green-100 dark:border-green-900/30 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm cursor-pointer"
                            title="Print Official Bill of Sale"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => { setSelectedTransaction(t); setIsDeleteModalOpen(true); }}
                          className="p-2 bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm cursor-pointer"
                          title="Move to Trash"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
    </div>
  );
};

export default Transactions;
