import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Search, Plus, Car, Tag, MapPin, 
  Calendar, Info, Edit, Trash2, Filter, Eye,
  ChevronRight, ChevronLeft, ArrowUpDown, Bookmark, Smartphone, User as UserIcon,
  CreditCard, XCircle, CheckCircle, Clock, Camera, Image as ImageIcon, X, Maximize2, Users,
  PlusCircle, TrendingUp, Download, FileSpreadsheet
} from 'lucide-react';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { IMAGE_BASE_URL } from '../config';

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
  const [salesAgents, setSalesAgents] = useState([]);
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
    entry_date: new Date().toISOString().split('T')[0],
    description: '', office_id: '', sales_agent_id: '', color: '', odometer: ''
  });

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { user } = JSON.parse(localStorage.getItem('user_data') || '{}');
  const isSuperAdmin = user?.role === 'Super Admin';
  const isHeadOffice = isSuperAdmin || !user?.office_id || user?.Office?.parent_id === null;

  const notify = (status, message, delay = 2000) => {
    setNotification({ status, message });
    if (status !== 'loading' && status !== 'confirm') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

  const fetchMetadata = async () => {
    try {
      const [b, h, o, s] = await Promise.all([
        api.get('/vehicles/brands'),
        api.get('/vehicles/model-history'),
        isHeadOffice ? api.get('/offices') : Promise.resolve({ data: [] }),
        api.get('/sales-agents/active')
      ]);
      setBrands(b.data); setModelHistory(h.data);
      if (isHeadOffice) setOffices(o.data);
      setSalesAgents(s.data);
    } catch (e) { console.error(e); }
  };

  const fetchVehicles = async (page = currentPage) => {
    setLoading(true);
    try {
      const params = { page, size: 10, search, officeId: selectedBranch, status: filterStatus };
      const r = await api.get('/vehicles', { params });
      setVehicles(r.data.items);
      setTotalPages(r.data.totalPages);
      setTotalItems(r.data.totalItems);
      setSummary(r.data.summary || summary);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchMetadata(); }, []);
  useEffect(() => { fetchVehicles(currentPage); }, [currentPage, search, selectedBranch, filterStatus]);

  const handleSearch = (e) => { setSearch(e.target.value); setCurrentPage(1); };
  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

  const openModal = (vehicle = null, viewOnly = false) => {
    setIsViewOnly(viewOnly);
    setEditingVehicle(vehicle);
    setSelectedFiles([]);
    if (vehicle) {
      setFormData({
        ...vehicle,
        year: vehicle.year.toString(),
        entry_date: vehicle.entry_date.split('T')[0],
        sold_date: vehicle.sold_date ? vehicle.sold_date.split('T')[0] : ''
      });
      if (viewOnly) fetchBookingHistory(vehicle.id);
    } else {
      setFormData({
        type: 'Motor', brand: '', model: '', year: (new Date().getFullYear()).toString(),
        plate_number: '', price: '', status: 'Available',
        entry_date: new Date().toISOString().split('T')[0],
        description: '', office_id: user?.office_id || '', color: '', odometer: ''
      });
    }
    setIsModalOpen(true);
  };

  const fetchBookingHistory = async (id) => {
    try { const r = await api.get(`/vehicles/${id}/bookings`); setBookingHistory(r.data); } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    notify('loading', editingVehicle ? 'Updating...' : 'Adding...');
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    selectedFiles.forEach(file => data.append('images', file));

    try {
      editingVehicle ? await api.put(`/vehicles/${editingVehicle.id}`, data) : await api.post('/vehicles', data);
      notify('success', 'Success!'); setIsModalOpen(false); fetchVehicles();
    } catch (err) { notify('error', 'Failed'); }
  };

  const handleDelete = async () => {
    notify('loading', 'Deleting...');
    try { await api.delete(`/vehicles/${confirmDeleteId}`); notify('success', 'Deleted'); setConfirmDeleteId(null); fetchVehicles(); }
    catch { notify('error', 'Error'); }
  };

  const openBookingModal = (v, existingBooking = null) => {
    setEditingVehicle(v);
    setBookingData(existingBooking ? {
      ...existingBooking,
      booking_date: existingBooking.booking_date.split('T')[0],
      expiry_date: existingBooking.expiry_date.split('T')[0]
    } : {
      vehicle_id: v.id, customer_name: '', customer_phone: '', id_number: '',
      booking_date: new Date().toISOString().split('T')[0], down_payment: '', notes: '', sales_agent_id: ''
    });
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    notify('loading', 'Processing...');
    try {
      bookingData.id ? await api.put(`/bookings/${bookingData.id}`, bookingData) : await api.post('/bookings', bookingData);
      notify('success', 'Booking saved!'); setIsBookingModalOpen(false); fetchVehicles();
    } catch (err) { notify('error', 'Booking failed'); }
  };

  const preConfirmAction = (v, type) => {
     setEditingVehicle(v); setActionType(type);
     api.get(`/vehicles/${v.id}/bookings/active`).then(r => {
       setActiveBooking(r.data);
       setBookingData({ ...bookingData, sales_agent_id: r.data?.sales_agent_id || '' });
       setIsConfirmActionModalOpen(true);
     });
  };

  const handleConfirmSale = async () => {
    notify('loading', 'Selling unit...');
    try {
      await api.post(`/vehicles/${editingVehicle.id}/sell`, { 
        booking_id: activeBooking?.id, 
        sold_date: bookingData.sold_date,
        sales_agent_id: bookingData.sales_agent_id 
      });
      notify('success', 'Unit sold!'); setIsConfirmActionModalOpen(false); fetchVehicles();
    } catch { notify('error', 'Sale failed'); }
  };

  const handleCancelBooking = async () => {
    notify('loading', 'Cancelling...');
    try {
      await api.post(`/bookings/${activeBooking.id}/cancel`);
      notify('success', 'Booking cancelled'); setIsConfirmActionModalOpen(false); fetchVehicles();
    } catch { notify('error', 'Cancel failed'); }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 10) return alert('Max 10 images');
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const handleSetPrimaryImage = async (imgId) => {
    try { await api.patch(`/vehicles/images/${imgId}/primary`); fetchVehicles(); if (editingVehicle) fetchMetadata(); } catch (e) { console.error(e); }
  };

  const handleDeleteImage = async (imgId) => {
    if (!window.confirm('Delete image?')) return;
    try { await api.delete(`/vehicles/images/${imgId}`); if (editingVehicle) fetchMetadata(); } catch (e) { console.error(e); }
  };

  const displayCurrency = (val) => val ? parseInt(val).toLocaleString('id-ID') : '';
  const handleCurrencyChange = (setter, state, field, val) => {
    const num = val.replace(/\D/g, '');
    setter({ ...state, [field]: num });
  };

  return (
    <div className="space-y-6">
      <DynamicIsland status={confirmDeleteId ? 'confirm' : notification.status} message={confirmDeleteId ? 'Delete vehicle?' : notification.message} onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vehicle Inventory</h1>
          <p className="text-sm text-gray-500">{isHeadOffice ? 'All Branches' : user?.Office?.name}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
             <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}><FileSpreadsheet size={16} /> <span className="hidden md:inline">Grid</span></button>
             <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}><Car size={16} /> <span className="hidden md:inline">Card</span></button>
          </div>
          <button onClick={() => openModal()} className="btn-primary gap-2 h-11 px-4 text-sm"><Plus size={18} /> Add New</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" className="input pl-10 h-12" placeholder="Search..." value={search} onChange={handleSearch} />
        </div>
        {isHeadOffice && (
          <select className="input h-12" value={selectedBranch} onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}>
            <option value="">All Branches</option>
            {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', count: summary.total, icon: Car, color: 'blue', status: '' },
          { label: 'Available', count: summary.available, icon: Tag, color: 'green', status: 'Available' },
          { label: 'Booking', count: summary.booking, icon: Clock, color: 'orange', status: 'Booked' },
          { label: 'Sold', count: summary.sold, icon: CheckCircle, color: 'purple', status: 'Sold' },
        ].map((s) => (
          <button key={s.label} onClick={() => { setFilterStatus(s.status); setCurrentPage(1); }} className={`card p-4 flex items-center gap-4 border-b-4 transition-all text-left ${filterStatus === s.status ? `border-b-${s.color}-500 bg-${s.color}-50/10` : 'border-b-transparent opacity-70'}`}>
            <div className={`p-3 bg-${s.color}-50 dark:bg-${s.color}-900/20 rounded-xl text-${s.color}-600`}><s.icon size={24} /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-black">{s.label}</p><p className="text-xl font-black">{s.count}</p></div>
          </button>
        ))}
      </div>

      {viewMode === 'table' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Office</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Action</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Misc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <AnimatePresence mode="wait">
                  {loading && vehicles.length === 0 ? [...Array(3)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-8"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" /></td></tr>) : 
                  vehicles.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No vehicles found</td></tr> :
                  vehicles.map((v, i) => (
                    <motion.tr key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${v.type === 'Mobil' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}><Car size={18} /></div>
                          <div><p className="font-bold">{v.brand} {v.model}</p><p className="text-xs text-gray-500">{v.type} • {v.year} • {v.plate_number}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">{v.Office?.name || 'N/A'}</td>
                      <td className="px-6 py-4 font-bold">{formatPrice(v.price)}</td>
                      <td className="px-6 py-4"><span className={`badge ${v.status === 'Available' ? 'badge-green' : v.status === 'Sold' ? 'badge-red' : 'badge-yellow'}`}>{v.status}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                           {v.status === 'Available' && <button onClick={() => openBookingModal(v)} className="btn px-2 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded">Book</button>}
                           {v.status === 'Booked' && <button onClick={() => preConfirmAction(v, 'sold')} className="btn px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded">Sell</button>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openModal(v, true)} className="p-1 text-purple-500"><Eye size={15} /></button>
                          <button onClick={() => openModal(v)} className="p-1 text-blue-500"><Edit size={15} /></button>
                          <button onClick={() => setConfirmDeleteId(v.id)} className="p-1 text-red-500"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {loading && vehicles.length === 0 ? [...Array(6)].map((_, i) => <div key={i} className="card h-40 animate-pulse" />) :
            vehicles.map((v) => (
              <motion.div layout key={v.id} className="card p-3 flex flex-col justify-between gap-3 group" onClick={() => openModal(v, true)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${v.type === 'Mobil' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}><Car size={16} /></div>
                    <div className="min-w-0"><h3 className="text-xs font-bold truncate">{v.brand} {v.model}</h3><p className="text-[10px] text-gray-400 truncate">{v.plate_number}</p></div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${v.status === 'Available' ? 'bg-green-100 text-green-600' : v.status === 'Sold' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{v.status}</span>
                </div>
                <div className="space-y-1 text-[10px]">
                  <p className="font-bold text-blue-600 flex justify-between">{formatPrice(v.price)} <span className="font-normal text-gray-400">{v.year}</span></p>
                  <p className="flex items-center gap-1 text-gray-500 truncate"><MapPin size={10} /> {v.Office?.name}</p>
                </div>
                <div className="flex gap-1 pt-2 border-t border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                  {v.status === 'Available' ? <button onClick={() => openBookingModal(v)} className="flex-1 py-1.5 bg-orange-600 text-white rounded-lg text-[10px] font-bold">Book</button> :
                   v.status === 'Booked' ? <button onClick={() => preConfirmAction(v, 'sold')} className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-bold">Sell</button> :
                   <div className="flex-1 py-1.5 text-center text-gray-400 text-[10px] italic">Sold</div>}
                  <button onClick={() => openModal(v)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg"><Edit size={12} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn text-[10px] px-3 py-1.5 bg-white border rounded">Prev</button>
          <span className="text-[10px] text-gray-500">Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn text-[10px] px-3 py-1.5 bg-white border rounded">Next</button>
        </div>
      )}

      {/* MODALS (Simplified for brevity but maintaining essential structure) */}
      <Modal isOpen={isConfirmActionModalOpen} onClose={() => setIsConfirmActionModalOpen(false)} title="Confirm Action">
        <div className="space-y-4 p-2 text-sm">
          <p>Confirm {actionType} for <strong>{editingVehicle?.brand} {editingVehicle?.model}</strong>?</p>
          <div className="flex flex-col gap-2">
            <button onClick={actionType === 'sold' ? handleConfirmSale : handleCancelBooking} className={`w-full py-2 rounded-xl text-white font-bold ${actionType === 'sold' ? 'bg-green-600' : 'bg-red-600'}`}>Confirm</button>
            <button onClick={() => setIsConfirmActionModalOpen(false)} className="w-full py-2 bg-gray-100 rounded-xl">Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Booking Reservation">
         <form onSubmit={handleBookingSubmit} className="space-y-4">
            <Input label="Customer" icon={UserIcon} value={bookingData.customer_name} onChange={e => setBookingData({...bookingData, customer_name: e.target.value})} required />
            <Input label="Phone" icon={Smartphone} value={bookingData.customer_phone} onChange={e => setBookingData({...bookingData, customer_phone: e.target.value})} required />
            <Input label="DP" icon={Tag} value={displayCurrency(bookingData.down_payment)} onChange={e => handleCurrencyChange(setBookingData, bookingData, 'down_payment', e.target.value)} />
            <button type="submit" className="btn-primary w-full py-2.5 bg-orange-600 border-none">Save Booking</button>
         </form>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isViewOnly ? 'Vehicle Details' : 'Vehicle Form'} maxWidth="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             <Select label="Type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} options={[{value:'Motor', label:'Motor'}, {value:'Mobil', label:'Mobil'}]} />
             <Input label="Brand" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} required />
             <Input label="Model" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} required />
             <Input label="Plate" value={formData.plate_number} onChange={e => setFormData({...formData, plate_number: e.target.value})} required />
             <Input label="Price" value={displayCurrency(formData.price)} onChange={e => handleCurrencyChange(setFormData, formData, 'price', e.target.value)} required />
             <Select label="Status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} options={[{value:'Available', label:'Available'}, {value:'Sold', label:'Sold'}, {value:'Booked', label:'Booked'}]} />
          </div>
          {!isViewOnly && <button type="submit" className="btn-primary w-full py-3">Save Vehicle</button>}
        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
