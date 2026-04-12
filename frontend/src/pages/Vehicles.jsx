import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Search, Plus, Car, Tag, MapPin, 
  Calendar, Info, Edit, Trash2, Filter, Eye,
  ChevronRight, ChevronLeft, ArrowUpDown, Bookmark, Smartphone, User as UserIcon,
  CreditCard, XCircle, CheckCircle, Clock, Camera, Image as ImageIcon, X, Maximize2
} from 'lucide-react';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { motion, AnimatePresence } from 'framer-motion';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [brands, setBrands] = useState([]);
  const [modelHistory, setModelHistory] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [isConfirmActionModalOpen, setIsConfirmActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'sold' or 'cancel'
  const [activeBooking, setActiveBooking] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [bookingData, setBookingData] = useState({
    vehicle_id: '', customer_name: '', customer_phone: '', id_number: '', 
    booking_date: new Date().toISOString().split('T')[0], down_payment: '', notes: ''
  });
  
  // Filter & Pagination State
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    type: 'Motor', brand: '', model: '', year: (new Date().getFullYear()).toString(), 
    plate_number: '', price: '', status: 'Available', 
    entry_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { user } = JSON.parse(localStorage.getItem('user_data') || '{}');
  const isHeadOffice = !user?.office_id || user?.Office?.parent_id === null;

  const notify = (status, message, delay = 2000) => {
    setNotification({ status, message });
    if (status !== 'loading' && status !== 'confirm') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

  const fetchMetadata = async () => {
    try {
      const [b, h, o] = await Promise.all([
        api.get('/vehicles/brands'),
        api.get('/vehicles/model-history'),
        isHeadOffice ? api.get('/offices') : Promise.resolve({ data: [] })
      ]);
      setBrands(b.data);
      setModelHistory(h.data);
      if (isHeadOffice) setOffices(o.data);
    } catch (e) { console.error('Metadata fetch error', e); }
  };

  const fetchVehicles = async (page = currentPage) => {
    setLoading(true);
    try {
      const params = {
        page: page,
        size: 10,
        search,
        officeId: selectedBranch
      };
      const r = await api.get('/vehicles', { params });
      setVehicles(r.data.items);
      setTotalPages(r.data.totalPages);
      setTotalItems(r.data.totalItems);
      setCurrentPage(r.data.currentPage);
    } catch (e) {
      notify('error', 'Failed to fetch vehicles');
    }
    setLoading(false);
  };

  useEffect(() => { 
    fetchMetadata();
  }, []);

  // Combined listener for search, branch, and page
  useEffect(() => {
    const isSearchAction = search !== '' || selectedBranch !== '';
    const delay = isSearchAction ? 500 : 0;

    const timer = setTimeout(() => {
      fetchVehicles(currentPage);
    }, delay);

    return () => clearTimeout(timer);
  }, [currentPage, search, selectedBranch]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') setActiveImageIndex(prev => (prev === 0 ? editingVehicle.images.length - 1 : prev - 1));
      if (e.key === 'ArrowRight') setActiveImageIndex(prev => (prev === editingVehicle.images.length - 1 ? 0 : prev + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, editingVehicle?.images?.length]);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    notify('loading', 'Deleting...');
    try {
      await api.delete(`/vehicles/${confirmDeleteId}`);
      notify('success', 'Vehicle removed');
      setConfirmDeleteId(null);
      fetchVehicles();
    } catch (e) { notify('error', 'Delete failed'); }
  };

  const years = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

  const openModal = (vehicle = null, readOnly = false) => {
    setIsViewOnly(readOnly);
    setEditingVehicle(vehicle);
    setSelectedFiles([]);
    setFormData(vehicle 
      ? { ...vehicle } 
      : { type: 'Motor', brand: '', model: '', year: (new Date().getFullYear()).toString(), plate_number: '', price: '', status: 'Available', entry_date: new Date().toISOString().split('T')[0], description: '' }
    );
    if (readOnly && vehicle) {
      fetchBookingHistory(vehicle.id);
    } else {
      setBookingHistory([]);
    }
    setIsModalOpen(true);
  };

  const fetchBookingHistory = async (vehicleId) => {
    try {
      const r = await api.get(`/bookings/vehicle/${vehicleId}/history`);
      setBookingHistory(r.data);
    } catch (e) {
      console.error('History fetch failed', e);
    }
  };

  const preConfirmAction = async (vehicle, type) => {
    setEditingVehicle(vehicle);
    setActionType(type);
    try {
      const r = await api.get(`/bookings/vehicle/${vehicle.id}`);
      setActiveBooking(r.data);
      setIsConfirmActionModalOpen(true);
    } catch (e) {
      notify('error', 'Failed to fetch active booking details');
    }
  };

  const handleCancelBooking = async () => {
    if (!editingVehicle) return;
    notify('loading', 'Cancelling booking...');
    try {
      await api.put(`/bookings/vehicle/${editingVehicle.id}/cancel`);
      notify('success', 'Booking cancelled!');
      setIsConfirmActionModalOpen(false);
      fetchVehicles();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Cancellation failed');
    }
  };

  const handleConfirmSale = async () => {
    if (!editingVehicle) return;
    notify('loading', 'Confirming sale...');
    try {
      await api.put(`/bookings/vehicle/${editingVehicle.id}/sold`, { 
        sold_date: bookingData.sold_date || new Date().toISOString().split('T')[0] 
      });
      notify('success', 'Unit marked as Sold!');
      setIsConfirmActionModalOpen(false);
      fetchVehicles();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to mark as sold');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // Maksimal 10 file yang dipilih
    const currentUploaded = editingVehicle?.images?.length || 0;
    if (files.length + currentUploaded > 10) {
      notify('error', `Max 10 images total. You can only add ${10 - currentUploaded} more.`);
      return;
    }
    setSelectedFiles(files);
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await api.delete(`/vehicles/${editingVehicle.id}/images/${imageId}`);
      // Update local state by removing the image
      setEditingVehicle(prev => ({
        ...prev,
        images: prev.images.filter(img => img.id !== imageId)
      }));
      fetchVehicles(); // refresh grid list as well
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to delete image');
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    try {
      await api.put(`/vehicles/${editingVehicle.id}/images/${imageId}/primary`);
      setEditingVehicle(prev => ({
        ...prev,
        images: prev.images.map(img => ({ ...img, is_primary: img.id === imageId }))
      }));
      fetchVehicles();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to set primary image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    notify('loading', editingVehicle ? 'Updating...' : 'Adding...');
    try {
      let vehicleId = editingVehicle?.id;
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, formData);
      } else {
        const res = await api.post('/vehicles', formData);
        vehicleId = res.data.id;
      }
      
      // Upload Images if any
      if (selectedFiles.length > 0) {
        const uploadData = new FormData();
        selectedFiles.forEach(file => {
          uploadData.append('images', file);
        });
        
        await api.post(`/vehicles/${vehicleId}/images`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      notify('success', editingVehicle ? 'Vehicle updated!' : 'Vehicle added!');
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Operation failed');
    }
  };

  const openBookingModal = (vehicle) => {
    setBookingData({
      vehicle_id: vehicle.id, 
      customer_name: '', 
      customer_phone: '', 
      id_number: '', 
      booking_date: new Date().toISOString().split('T')[0], 
      down_payment: '', 
      notes: ''
    });
    setEditingVehicle(vehicle);
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    notify('loading', 'Processing booking...');
    try {
      await api.post('/bookings', bookingData);
      notify('success', 'Booking confirmed!');
      setIsBookingModalOpen(false);
      fetchVehicles();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Booking failed');
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

  return (
    <div className="space-y-6">
      <DynamicIsland 
        status={confirmDeleteId ? 'confirm' : notification.status} 
        message={confirmDeleteId ? 'Delete this vehicle?' : notification.message}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vehicle Inventory</h1>
          <p className="text-sm text-gray-500">
            {isHeadOffice ? 'Viewing all branch data' : `Managing data for ${user?.Office?.name || 'Branch'}`}
          </p>
        </div>
        <button onClick={() => openModal()} className="btn-primary gap-2">
          <Plus size={18} /> Add New Vehicle
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            className="input pl-10 h-12"
            placeholder="Search brand, model, or plate number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {isHeadOffice && (
          <select 
            className="input h-12"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">All Branches</option>
            {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4 shadow-sm border-0">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
            <Car size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Inventory</p>
            <p className="text-xl font-bold">{totalItems} Units</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 shadow-sm border-0">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Stock Status</p>
            <p className="text-xl font-bold">Active Records</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 shadow-sm border-0">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Availability</p>
            <p className="text-xl font-bold">{isHeadOffice ? 'Multi-Branch' : 'Local Cabang'}</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Office</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <AnimatePresence mode="wait">
                {loading && vehicles.length === 0 ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" /></td>
                    </tr>
                  ))
                ) : vehicles.length === 0 ? (
                  <motion.tr 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No vehicles found</td>
                  </motion.tr>
                ) : (
                  vehicles.map((v, i) => (
                    <motion.tr 
                      key={v.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: loading ? 0.6 : 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${v.type === 'Mobil' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                            <Car size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{v.brand} {v.model}</p>
                            <p className="text-xs text-gray-500">
                              {v.type} • {v.year} • {v.plate_number} 
                              <span className="block mt-0.5 text-blue-500 font-medium whitespace-nowrap">Masuk: {new Date(v.entry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              {v.status === 'Sold' && v.sold_date && (
                                <span className="block mt-0.5 text-red-500 font-bold whitespace-nowrap">Terjual: {new Date(v.sold_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <MapPin size={14} />
                          <span className="text-sm font-medium">{v.Office?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        {formatPrice(v.price)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${
                          v.status === 'Available' ? 'badge-green' : 
                          v.status === 'Sold' ? 'badge-red' : 'badge-yellow'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {v.status === 'Available' && (
                            <button onClick={() => openBookingModal(v)} className="btn-icon text-gray-400 hover:text-orange-500" title="Book Now">
                              <Bookmark size={16} />
                            </button>
                          )}
                          {v.status === 'Pending' && (
                            <>
                              <button onClick={() => preConfirmAction(v, 'sold')} className="btn-icon text-gray-400 hover:text-green-600" title="Mark as Sold">
                                <CheckCircle size={16} />
                              </button>
                              <button onClick={() => preConfirmAction(v, 'cancel')} className="btn-icon text-gray-400 hover:text-red-500" title="Cancel Booking">
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          <button onClick={() => openModal(v, true)} className="btn-icon text-gray-400 hover:text-purple-600" title="View Details">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => openModal(v)} className="btn-icon text-gray-400 hover:text-blue-600" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => setConfirmDeleteId(v.id)} className="btn-icon text-gray-400 hover:text-red-500" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-bold text-gray-900 dark:text-white">{vehicles.length}</span> of <span className="font-bold text-gray-900 dark:text-white">{totalItems}</span> vehicles
          </p>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="btn-white text-xs disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === i + 1 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                    : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="btn-white text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Action Modal (Sold/Cancel) */}
      <Modal 
        isOpen={isConfirmActionModalOpen} 
        onClose={() => setIsConfirmActionModalOpen(false)} 
        title={actionType === 'sold' ? 'Confirm Unit Sale' : 'Confirm Cancel Booking'}
      >
        <div className="space-y-6">
          <div className={`p-4 rounded-xl border ${actionType === 'sold' ? 'bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-800' : 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-800'}`}>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">You are about to {actionType === 'sold' ? 'mark this unit as SOLD' : 'CANCEL the booking for'}:</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingVehicle?.brand} {editingVehicle?.model} ({editingVehicle?.plate_number})</h3>
          </div>

          {activeBooking && (
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span className="text-gray-500">Customer Name</span>
                  <span className="font-bold">{activeBooking.customer_name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span className="text-gray-500">Phone Number</span>
                  <span className="font-bold">{activeBooking.customer_phone}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span className="text-gray-500">Down Payment</span>
                  <span className="font-bold text-green-600 font-mono">{formatPrice(activeBooking.down_payment)}</span>
                </div>
                {activeBooking.notes && (
                  <div className="pt-1">
                    <span className="text-gray-500 block mb-1">Notes:</span>
                    <p className="p-2 bg-white dark:bg-gray-800 rounded-lg text-xs italic">{activeBooking.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {actionType === 'sold' && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800">
              <label className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-2">Tanggal Penjualan (Bisa Backdate)</label>
              <input 
                type="date" 
                className="input h-10 bg-white/50 dark:bg-gray-900 border-orange-200" 
                value={bookingData.sold_date || new Date().toISOString().split('T')[0]}
                onChange={(e) => setBookingData({...bookingData, sold_date: e.target.value})}
              />
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={actionType === 'sold' ? handleConfirmSale : handleCancelBooking}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                actionType === 'sold' 
                ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' 
                : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
              }`}
            >
              {actionType === 'sold' ? 'YES, CONFIRM SOLD' : 'YES, CANCEL THIS BOOKING'}
            </button>
            <button 
              onClick={() => setIsConfirmActionModalOpen(false)}
              className="w-full py-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </Modal>

      {/* Booking Modal */}
      <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Booking Reservation">
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800 flex items-center gap-3 mb-2">
            <div className="p-2 bg-white dark:bg-gray-900 rounded-lg text-orange-600 shadow-sm">
              <Car size={20} />
            </div>
            <div>
              <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Vehicle Selected</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {editingVehicle?.brand} {editingVehicle?.model} ({editingVehicle?.plate_number})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Customer Name" 
              icon={UserIcon} 
              required 
              value={bookingData.customer_name}
              onChange={e => setBookingData({...bookingData, customer_name: e.target.value})} 
              placeholder="Nama Calon Pembeli" 
            />
            <Input 
              label="Phone Number" 
              icon={Smartphone} 
              required 
              value={bookingData.customer_phone}
              onChange={e => setBookingData({...bookingData, customer_phone: e.target.value})} 
              placeholder="0812..." 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="KTP / ID Number" 
              icon={CreditCard} 
              value={bookingData.id_number}
              onChange={e => setBookingData({...bookingData, id_number: e.target.value})} 
              placeholder="No KTP" 
            />
            <Input 
              label="Booking Date" 
              icon={Calendar} 
              type="date" 
              required 
              value={bookingData.booking_date}
              onChange={e => setBookingData({...bookingData, booking_date: e.target.value})} 
            />
          </div>

          <div>
            <Input 
              label="Down Payment (DP)" 
              icon={Tag} 
              type="number" 
              value={bookingData.down_payment}
              onChange={e => setBookingData({...bookingData, down_payment: e.target.value})} 
              placeholder="Minimal nominal DP" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Booking Notes</label>
            <textarea 
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
              rows={3} 
              value={bookingData.notes}
              onChange={e => setBookingData({...bookingData, notes: e.target.value})}
              placeholder="Catatan tambahan (misal: janjian jam 10 pagi)..."
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full py-3 mt-2 shadow-lg shadow-orange-500/20 bg-orange-600 hover:bg-orange-700 border-none"
          >
            Confirm Booking
          </button>
        </form>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isViewOnly ? 'Vehicle Details' : (editingVehicle ? 'Edit Vehicle' : 'Register Vehicle')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={isViewOnly} className="space-y-4 border-0 p-0 m-0">
            <div className="grid grid-cols-2 gap-4">
              <Select label="Type" icon={Car} value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                options={[{value: 'Motor', label: 'Motor'}, {value: 'Mobil', label: 'Mobil'}]} />
              
              <Select label="Year" icon={Calendar} value={formData.year}
                onChange={e => setFormData({...formData, year: e.target.value})}
                options={years.map(y => ({ value: y, label: y }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select label="Brand" icon={Tag} value={formData.brand}
                onChange={e => setFormData({...formData, brand: e.target.value})}
                options={brands.filter(b => formData.type === 'Mobil' ? b.for_car : b.for_motorcycle).map(b => ({ value: b.name, label: b.name }))}
              />
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1 flex items-center gap-1.5">
                  <Info size={12} /> Model
                </label>
                <input 
                  list="model-history"
                  className="input"
                  value={formData.model}
                  onChange={e => setFormData({...formData, model: e.target.value})}
                  placeholder="Avanza / Vario"
                  required
                />
                <datalist id="model-history">
                  {modelHistory.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Plate Number" icon={ArrowUpDown} required value={formData.plate_number}
                onChange={e => setFormData({...formData, plate_number: e.target.value})} placeholder="B 1234 ABC" />
              <Input label="Price (IDR)" icon={Tag} type="number" required value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})} placeholder="150000000" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select label="Status" icon={Filter} value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                options={[
                  {value: 'Available', label: 'Available (Ready)'}, 
                  {value: 'Sold', label: 'Sold (Terjual)'},
                  {value: 'Pending', label: 'Pending (Booking)'}
                ]} />
              <Input label="Tanggal Masuk" icon={Calendar} type="date" required value={formData.entry_date}
                onChange={e => setFormData({...formData, entry_date: e.target.value})} />
            </div>

            {formData.status === 'Sold' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <Input label="Tanggal Terjual" icon={CheckCircle} type="date" value={formData.sold_date || ''}
                  onChange={e => setFormData({...formData, sold_date: e.target.value})} />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Description</label>
              <textarea 
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                rows={3} value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Detail tambahan kendaraan..."
              />
            </div>

            {/* Vehicle Images Section */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-3 text-blue-600">
                <ImageIcon size={18} />
                <h3 className="font-bold uppercase text-xs tracking-wider">Vehicle Images (Max 10)</h3>
              </div>
              
              {/* Existing Images Gallery */}
              {editingVehicle?.images && editingVehicle.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {editingVehicle.images.map((img, idx) => (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 aspect-video cursor-zoom-in" onClick={() => { setActiveImageIndex(idx); setIsLightboxOpen(true); }}>
                      <img src={`http://localhost:5001${img.image_url}`} alt="vehicle" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      
                      {img.is_primary && (
                        <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Primary
                        </div>
                      )}

                      {!isViewOnly && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {!img.is_primary && (
                            <button 
                              type="button" 
                              onClick={() => handleSetPrimaryImage(img.id)}
                              className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700" 
                              title="Set as Primary"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button 
                            type="button" 
                            onClick={() => handleDeleteImage(img.id)}
                            className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Input */}
              {!isViewOnly && (
                <div className="space-y-3">
                  <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={editingVehicle?.images?.length >= 10}
                    />
                    <div className="flex flex-col items-center gap-1 text-gray-500">
                      <Camera size={24} className="text-blue-500 mb-1" />
                      <p className="text-sm font-bold">Click or drag images here to upload</p>
                      <p className="text-xs">JPG, PNG, WEBP (Max 10 files)</p>
                    </div>
                  </div>

                  {/* Preview Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div className="flex overflow-x-auto gap-2 pb-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </fieldset>

          {isViewOnly && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <Clock size={18} />
                <h3 className="font-bold uppercase text-xs tracking-wider">Booking & Status History</h3>
              </div>
              
              <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {bookingHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-400 italic">No booking records found for this unit.</td>
                      </tr>
                    ) : (
                      bookingHistory.map((bh) => (
                        <tr key={bh.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-gray-900 dark:text-white">{bh.customer_name}</p>
                            <p className="text-[10px] text-gray-500">{bh.customer_phone}</p>
                          </td>
                          <td className="px-4 py-3">
                            {new Date(bh.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              bh.status === 'Active' ? 'bg-blue-50 text-blue-600' :
                              bh.status === 'Sold' ? 'bg-green-50 text-green-600' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {bh.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {bh.User?.name}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isViewOnly && (
            <button type="submit" className="btn-primary w-full py-3 mt-2 shadow-lg shadow-blue-500/20">
              {editingVehicle ? 'Update Inventory' : 'Add to Stock'}
            </button>
          )}
        </form>
      </Modal>

      {/* Lightbox / Image Zoom */}
      <AnimatePresence>
        {isLightboxOpen && editingVehicle?.images && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close Button */}
            <button 
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X size={24} />
            </button>

            {/* Main Content */}
            <div className="relative w-full max-w-5xl h-[80vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <motion.img 
                key={activeImageIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={`http://localhost:5001${editingVehicle.images[activeImageIndex].image_url}`} 
                alt="zoomed vehicle" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-white/5"
              />

              {/* Navigation Arrows */}
              {editingVehicle.images.length > 1 && (
                <>
                  <button 
                    className="absolute left-0 p-4 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all -translate-x-12 hidden md:block"
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? editingVehicle.images.length - 1 : prev - 1))}
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button 
                    className="absolute right-0 p-4 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all translate-x-12 hidden md:block"
                    onClick={() => setActiveImageIndex((prev) => (prev === editingVehicle.images.length - 1 ? 0 : prev + 1))}
                  >
                    <ChevronRight size={32} />
                  </button>

                  {/* Mobile Nav */}
                  <div className="absolute -bottom-12 flex gap-8 md:hidden">
                    <button 
                      className="p-3 bg-white/10 text-white rounded-full"
                      onClick={() => setActiveImageIndex((prev) => (prev === 0 ? editingVehicle.images.length - 1 : prev - 1))}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      className="p-3 bg-white/10 text-white rounded-full"
                      onClick={() => setActiveImageIndex((prev) => (prev === editingVehicle.images.length - 1 ? 0 : prev + 1))}
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            <div className="absolute bottom-8 left-0 right-0 overflow-x-auto flex justify-center gap-2 p-4" onClick={(e) => e.stopPropagation()}>
              {editingVehicle.images.map((img, idx) => (
                <button 
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/20' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <img src={`http://localhost:5001${img.image_url}`} className="w-full h-full object-cover" alt="thumb" />
                </button>
              ))}
            </div>

            {/* Info Badge */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-bold tracking-widest uppercase">
              {activeImageIndex + 1} / {editingVehicle.images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Vehicles;
