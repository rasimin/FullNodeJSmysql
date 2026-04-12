import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Search, Plus, Car, Tag, MapPin, 
  Calendar, Info, Edit, Trash2, Filter, Eye,
  ChevronRight, ArrowUpDown
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
    // Only debounce if searching, otherwise fetch immediately (like pagination)
    const isSearchAction = search !== '' || selectedBranch !== '';
    const delay = isSearchAction ? 500 : 0;

    const timer = setTimeout(() => {
      fetchVehicles(currentPage);
    }, delay);

    return () => clearTimeout(timer);
  }, [currentPage, search, selectedBranch]);

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
    setFormData(vehicle 
      ? { ...vehicle } 
      : { type: 'Motor', brand: '', model: '', year: '', plate_number: '', price: '', status: 'Available', entry_date: new Date().toISOString().split('T')[0], description: '' }
    );
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    notify('loading', editingVehicle ? 'Updating...' : 'Adding...');
    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, formData);
        notify('success', 'Vehicle updated!');
      } else {
        await api.post('/vehicles', formData);
        notify('success', 'Vehicle added!');
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Operation failed');
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
                              <span className="block mt-0.5 text-blue-500 font-medium">Masuk: {new Date(v.entry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
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
                          v.status === 'Sold' ? 'badge-red' : 'badge-orange'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
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

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Description</label>
              <textarea 
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                rows={3} value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Detail tambahan kendaraan..."
              />
            </div>
          </fieldset>

          {!isViewOnly && (
            <button type="submit" className="btn-primary w-full py-3 mt-2 shadow-lg shadow-blue-500/20">
              {editingVehicle ? 'Update Inventory' : 'Add to Stock'}
            </button>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
