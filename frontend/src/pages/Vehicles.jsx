import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Search, Plus, Car, Tag, MapPin, 
  Calendar, Info, Edit, Trash2, Filter, Eye,
  ChevronRight, ChevronLeft, ArrowUpDown, Bookmark, Smartphone, User as UserIcon,
  CreditCard, XCircle, CheckCircle, Clock, Camera, Image as ImageIcon, X, Maximize2, Users,
  PlusCircle, TrendingUp, Download, FileSpreadsheet, Palette, Gauge, Wallet, Wrench, History
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
    booking_date: new Date().toISOString().split('T')[0], down_payment: '', notes: '', sales_agent_id: ''
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
    purchase_price: '', service_cost: '', sold_date: '',
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
        year: vehicle.year?.toString() || '',
        entry_date: vehicle.entry_date?.split('T')[0] || '',
        sold_date: vehicle.sold_date ? vehicle.sold_date.split('T')[0] : '',
        purchase_price: vehicle.purchase_price || '',
        service_cost: vehicle.service_cost || '',
        office_id: vehicle.office_id || '',
        sales_agent_id: vehicle.sales_agent_id || '',
        color: vehicle.color || '',
        odometer: vehicle.odometer || '',
        description: vehicle.description || ''
      });
      fetchBookingHistory(vehicle.id);
    } else {
      setFormData({
        type: 'Motor', brand: '', model: '', year: (new Date().getFullYear()).toString(),
        plate_number: '', price: '', status: 'Available',
        purchase_price: '', service_cost: '', sold_date: '',
        entry_date: new Date().toISOString().split('T')[0],
        description: '', office_id: user?.office_id || '', sales_agent_id: '', color: '', odometer: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    notify('loading', editingVehicle ? 'Updating...' : 'Adding...');
    
    try {
      // Clean payload: strip associations and ensure no nulls for text fields
      const payload = {};
      const allowedFields = [
        'type', 'brand', 'model', 'year', 'plate_number', 'price', 'status',
        'purchase_price', 'service_cost', 'sold_date', 'entry_date',
        'description', 'office_id', 'sales_agent_id', 'color', 'odometer'
      ];
      
      allowedFields.forEach(field => {
        if (formData[field] !== undefined) {
          payload[field] = formData[field] === null ? '' : formData[field];
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
        sales_agent_id: existingBooking.sales_agent_id || ''
      });
    } else {
      setBookingData({
        vehicle_id: v.id, customer_name: '', customer_phone: '', id_number: '',
        booking_date: new Date().toISOString().split('T')[0], down_payment: '', notes: '', sales_agent_id: ''
      });
    }
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
      
      if (bookingData.id) {
        await api.put(`/bookings/${bookingData.id}`, cleanData);
      } else {
        await api.post('/bookings', cleanData);
      }
      notify('success', 'Booking saved!'); setIsBookingModalOpen(false); fetchVehicles();
    } catch (err) { 
      console.error('Booking Submit Error:', err);
      notify('error', err.response?.data?.message || 'Booking failed'); 
    }
  };

  const preConfirmAction = (v, type) => {
     setEditingVehicle(v); setActionType(type);
     api.get(`/bookings/vehicle/${v.id}`).then(r => {
       setActiveBooking(r.data);
       setBookingData({ ...bookingData, sales_agent_id: r.data?.sales_agent_id || '' });
       setIsConfirmActionModalOpen(true);
     });
  };

  const handleConfirmSale = async () => {
    notify('loading', 'Selling unit...');
    try {
      await api.put(`/bookings/vehicle/${editingVehicle.id}/sold`, { 
        booking_id: activeBooking?.id, 
        sold_date: new Date().toISOString().split('T')[0],
        sales_agent_id: bookingData.sales_agent_id 
      });
      notify('success', 'Unit sold!'); setIsConfirmActionModalOpen(false); fetchVehicles();
    } catch { notify('error', 'Sale failed'); }
  };

  const handleCancelBooking = async () => {
    notify('loading', 'Cancelling...');
    try {
      await api.put(`/bookings/vehicle/${editingVehicle.id}/cancel`);
      notify('success', 'Booking cancelled'); setIsConfirmActionModalOpen(false); fetchVehicles();
    } catch { notify('error', 'Cancel failed'); }
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

  return (
    <div className="space-y-6">
      <DynamicIsland status={confirmDeleteId ? 'confirm' : notification.status} message={confirmDeleteId ? 'Delete vehicle?' : notification.message} onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Vehicle Inventory</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isHeadOffice ? 'All Branches' : user?.Office?.name}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
             <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}><FileSpreadsheet size={16} /> <span className="hidden md:inline">Grid</span></button>
             <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}><Car size={16} /> <span className="hidden md:inline">Card</span></button>
          </div>
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
            <div className={`p-3 rounded-xl ${s.color === 'blue' ? 'bg-blue-50 text-blue-600' : s.color === 'green' ? 'bg-green-50 text-green-600' : s.color === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}><s.icon size={22} /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-black">{s.label}</p><p className="text-xl font-black">{s.count}</p></div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="relative md:col-span-8"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" className="input pl-10 h-12" placeholder="Search..." value={search} onChange={handleSearch} /></div>
        <div className="md:col-span-4">{isHeadOffice && (<select className="input h-12" value={selectedBranch} onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}><option value="">All Branches</option>{offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>)}</div>
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
                <tr key={v.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${v.type === 'Mobil' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>{v.images?.length > 0 ? <img src={`${IMAGE_BASE_URL}${v.images[0].image_url}`} className="w-full h-full object-cover" alt="Unit" /> : <Car size={20} />}</div><div><p className="text-sm font-black text-gray-900 dark:text-gray-100">{v.brand} {v.model}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{v.type} • {v.year} • {v.plate_number}</p></div></div></td>
                  <td className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase">{v.Office?.name || '-'}</td>
                  <td className="px-6 py-4 font-black text-blue-600">{formatPrice(v.price)}</td>
                  <td className="px-6 py-4"><span className={`badge ${v.status === 'Available' ? 'badge-green' : v.status === 'Sold' ? 'badge-red' : 'badge-yellow'}`}>{v.status}</span></td>
                  <td className="px-6 py-4"><div className="flex justify-center gap-2">
                    {v.status === 'Available' && <button onClick={() => openBookingModal(v)} className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"><Bookmark size={12} /> Book Now</button>}
                    {v.status === 'Booked' && <button onClick={() => preConfirmAction(v, 'sold')} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95"><CheckCircle size={12} /> Sell Unit</button>}
                    {v.status === 'Sold' && <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 text-[10px] font-black uppercase rounded-xl">Completed</div>}
                  </div></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(v, true)} className="p-2 hover:bg-purple-100 hover:text-purple-600 rounded-lg transition-colors" title="View Detail"><Eye size={16} /></button>
                      <button onClick={() => openModal(v)} className="p-2 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors" title="Edit Unit"><Edit size={16} /></button>
                      <button onClick={() => setConfirmDeleteId(v.id)} className="p-2 hover:bg-red-100 hover:text-red-500 rounded-lg transition-colors" title="Delete Unit"><Trash2 size={16} /></button>
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
              <div key={v.id} className="card p-3 md:p-4 flex flex-col justify-between gap-3 group hover:border-blue-500/30 transition-all" onClick={() => openModal(v, true)}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase w-max ${v.status === 'Available' ? 'bg-green-100 text-green-700' : v.status === 'Sold' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{v.status}</span>
                  <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase truncate">{v.plate_number} • {v.year}</p>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${v.type === 'Mobil' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                    {displayImage ? <img src={`${IMAGE_BASE_URL}${displayImage}`} className="w-full h-full object-cover" alt="Vehicle" /> : <Car size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs md:text-sm font-black text-gray-900 uppercase truncate" title={`${v.brand} ${v.model}`}>{v.brand} {v.model}</h3>
                    <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase truncate">{v.type}</p>
                  </div>
                </div>
                <div className="space-y-1.5 mt-auto">
                  <p className="text-xs md:text-sm font-black text-blue-600 truncate">{formatPrice(v.price)}</p>
                  <div className="flex items-center gap-1 text-[8px] md:text-[9px] text-gray-400 font-bold uppercase truncate"><MapPin size={8} className="text-gray-300 md:w-2.5 md:h-2.5" /> {v.Office?.name}</div>
                </div>
                <div className="flex gap-1 pt-2 border-t border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                  {v.status === 'Available' ? <button onClick={() => openBookingModal(v)} className="flex-1 py-1.5 bg-orange-600 text-white rounded-lg text-[9px] font-black uppercase shadow-sm hover:shadow-md">Book</button> :
                   v.status === 'Booked' ? <button onClick={() => preConfirmAction(v, 'sold')} className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-[9px] font-black uppercase shadow-sm hover:shadow-md">Sell</button> :
                   <div className="flex-1 py-1.5 text-center text-gray-400 text-[9px] font-black uppercase bg-gray-50 rounded-lg">Sold</div>}
                  <button onClick={() => openModal(v)} className="w-8 flex items-center justify-center bg-gray-100 text-gray-400 hover:text-blue-600 rounded-lg shrink-0"><Edit size={12} /></button>
                  <button onClick={() => setConfirmDeleteId(v.id)} className="w-8 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-lg shrink-0 transition-colors"><Trash2 size={12} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MASTER VEHICLE FORM MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Master Vehicle Overview" maxWidth="max-w-5xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3"><div className="w-1 h-5 bg-blue-600 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Detail Spesifikasi</h4></div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Select label="Category" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} options={[{value:'Motor', label:'Motorcycle'}, {value:'Mobil', label:'Car'}]} disabled={isViewOnly} />
                    <Input label="Brand / Merk" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} required readOnly={isViewOnly} />
                    <Input label="Model / Type" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} required readOnly={isViewOnly} />
                    <Input label="Plate Number" value={formData.plate_number} onChange={e => setFormData({...formData, plate_number: e.target.value})} required readOnly={isViewOnly} />
                    <Input label="Year" type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required readOnly={isViewOnly} />
                    <Input label="Color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} readOnly={isViewOnly} />
                    <Input label="Odometer (KM)" value={displayCurrency(formData.odometer)} onChange={e => handleCurrencyChange(setFormData, formData, 'odometer', e.target.value)} readOnly={isViewOnly} />
                    <Input label="Sales Price" value={displayCurrency(formData.price)} onChange={e => handleCurrencyChange(setFormData, formData, 'price', e.target.value)} required readOnly={isViewOnly} />
                    <Select label="Unit Status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} options={[{value:'Available', label:'Available'}, {value:'Sold', label:'Sold'}, {value:'Booked', label:'Booked'}]} disabled={isViewOnly} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3"><div className="w-1 h-5 bg-green-600 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Financial & Inventory</h4></div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Input label="Purchase Price" icon={Wallet} value={displayCurrency(formData.purchase_price)} onChange={e => handleCurrencyChange(setFormData, formData, 'purchase_price', e.target.value)} readOnly={isViewOnly} />
                    <Input label="Service Cost" icon={Wrench} value={displayCurrency(formData.service_cost)} onChange={e => handleCurrencyChange(setFormData, formData, 'service_cost', e.target.value)} readOnly={isViewOnly} />
                    <Input label="Entry Date" type="date" value={formData.entry_date} onChange={e => setFormData({...formData, entry_date: e.target.value})} readOnly={isViewOnly} />
                    {(formData.status === 'Sold' || formData.sold_date) && <Input label="Sold Date" type="date" value={formData.sold_date} onChange={e => setFormData({...formData, sold_date: e.target.value})} readOnly={isViewOnly} />}
                    {isHeadOffice ? (
                      <Select label="Branch Office" value={formData.office_id} onChange={e => setFormData({...formData, office_id: e.target.value})} options={offices.map(o => ({ value: o.id, label: o.name }))} required disabled={isViewOnly} />
                    ) : <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[8px] text-gray-400 font-black uppercase">Current Branch</p><p className="text-[10px] font-bold">{user?.Office?.name}</p></div>}
                  </div>
                  <textarea className="input h-20 p-3 text-xs" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Notes..." readOnly={isViewOnly} />
                </div>
             </div>

             <div className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-2"><div className="w-1 h-5 bg-indigo-600 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Media Gallery</h4></div>
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
                    <div className="flex items-center gap-2"><div className="w-1 h-5 bg-amber-500 rounded-full" /><h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Recent Activity</h4></div>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {bookingHistory.map(bh => (
                        <div key={bh.id} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-row sm:items-center justify-between gap-4 transition-all hover:bg-white dark:hover:bg-gray-800">
                          <div className="min-w-0 flex-1">
                             <div className="flex items-center gap-2 mb-1">
                               <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${bh.status === 'Cancelled' ? 'bg-red-100 text-red-600' : bh.status === 'Sold' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{bh.status}</span>
                               <span className="text-[9px] text-gray-400 font-bold">{new Date(bh.booking_date).toLocaleDateString('id-ID')}</span>
                             </div>
                             <p className="font-black truncate text-gray-900 dark:text-gray-100 text-sm">{bh.customer_name}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase">Agent: {bh.salesAgent?.name || 'Unknown'}</p>
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
          {!isViewOnly && <div className="pt-6 border-t border-gray-100 text-right"><button type="submit" className="btn-primary px-8 py-3 bg-blue-600 border-none text-[10px] font-black uppercase tracking-widest shadow-xl">Simpan Perubahan Master</button></div>}
        </form>
      </Modal>

      {/* OTHER MODALS (Booking, Confirm) remain the same */}
      <Modal isOpen={isConfirmActionModalOpen} onClose={() => setIsConfirmActionModalOpen(false)} title="Konfirmasi Transaksi">
        <div className="space-y-6 pt-2">
          <p className="text-sm">Konfirmasi {actionType === 'sold' ? 'Penjualan' : 'Pembatalan'} untuk <strong>{editingVehicle?.brand} {editingVehicle?.model}</strong>?</p>
          <div className="space-y-3">
             {actionType === 'sold' && (
               <>
                 <Select label="Agent Penjual" value={bookingData.sales_agent_id} onChange={e => setBookingData({...bookingData, sales_agent_id: e.target.value})} options={salesAgents.map(a => ({ value: a.id, label: a.name }))} required />
                 <button onClick={handleConfirmSale} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold">KONFIRMASI JUAL</button>
               </>
             )}
             {actionType === 'cancel' && <button onClick={handleCancelBooking} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold">BATALKAN BOOKING</button>}
             <button onClick={() => setIsConfirmActionModalOpen(false)} className="w-full py-3 bg-gray-100 rounded-xl font-bold">TUTUP</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Form Reservasi Booking">
         <form onSubmit={handleBookingSubmit} className="space-y-4">
            <Input label="Nama Konsumen" value={bookingData.customer_name} onChange={e => setBookingData({...bookingData, customer_name: e.target.value})} required />
            <Input label="Nomor HP" value={bookingData.customer_phone} onChange={e => setBookingData({...bookingData, customer_phone: e.target.value})} required />
            <Input label="Down Payment" value={displayCurrency(bookingData.down_payment)} onChange={e => handleCurrencyChange(setBookingData, bookingData, 'down_payment', e.target.value)} />
            <Select 
              label="Sales Agent (Optional)" 
              value={bookingData.sales_agent_id} 
              onChange={e => setBookingData({...bookingData, sales_agent_id: e.target.value})} 
              options={[
                { value: '', label: '-- Pilih Agent (Opsional) --' },
                ...salesAgents.map(a => ({ value: a.id, label: a.name }))
              ]} 
            />
            <button type="submit" className="btn-primary w-full py-4 bg-orange-600 border-none">SIMPAN RESERVASI</button>
         </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
