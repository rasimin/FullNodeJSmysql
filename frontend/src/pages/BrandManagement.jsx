import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Plus, Tags, Trash2, Edit, Car } from 'lucide-react';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { motion, AnimatePresence } from 'framer-motion';

const BrandManagement = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({ name: '', for_car: false, for_motorcycle: true });
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const notify = (status, message, delay = 2000) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const r = await api.get('/vehicles/brands');
      setBrands(r.data);
    } catch { notify('error', 'Failed to fetch brands'); }
    setLoading(false);
  };

  useEffect(() => { fetchBrands(); }, []);

  const openModal = (brand = null) => {
    setEditingBrand(brand);
    setFormData(brand ? { name: brand.name, for_car: brand.for_car, for_motorcycle: brand.for_motorcycle } : { name: '', for_car: false, for_motorcycle: true });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.for_car && !formData.for_motorcycle) {
      return notify('error', 'Pilih minimal satu tipe (Mobil atau Motor)');
    }
    notify('loading', editingBrand ? 'Updating...' : 'Adding...');
    try {
      if (editingBrand) {
        await api.put(`/vehicles/brands/${editingBrand.id}`, formData);
        notify('success', 'Brand updated');
      } else {
        await api.post('/vehicles/brands', formData);
        notify('success', 'Brand added');
      }
      setIsModalOpen(false);
      fetchBrands();
    } catch (err) { notify('error', err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async () => {
    notify('loading', 'Deleting...');
    try {
      await api.delete(`/vehicles/brands/${confirmDeleteId}`);
      setConfirmDeleteId(null);
      notify('success', 'Brand deleted');
      fetchBrands();
    } catch { notify('error', 'Delete failed'); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <DynamicIsland 
        status={confirmDeleteId ? 'confirm' : notification.status} 
        message={confirmDeleteId ? 'Delete this brand?' : notification.message}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vehicle Brands</h1>
          <p className="text-sm text-gray-500">Manage master brand list for inventory</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary gap-2">
          <Plus size={18} /> Add Brand
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Brand Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : brands.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400">No brands found</td></tr>
            ) : (
              brands.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{b.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                       {b.for_motorcycle && <span className="badge badge-orange">Motor</span>}
                       {b.for_car && <span className="badge badge-blue">Mobil</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(b)} className="btn-icon hover:text-blue-600"><Edit size={16} /></button>
                      <button onClick={() => setConfirmDeleteId(b.id)} className="btn-icon hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBrand ? 'Edit Brand' : 'New Brand'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Brand Name" icon={Tags} required value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. BMW, Honda" />
          
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Brand Category</p>
            <div className="flex gap-6 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={formData.for_motorcycle}
                  onChange={e => setFormData({...formData, for_motorcycle: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-orange-600 transition-colors">Motor</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={formData.for_car}
                  onChange={e => setFormData({...formData, for_car: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">Mobil</span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3 mt-4 shadow-lg shadow-blue-500/20">
            {editingBrand ? 'Update Brand' : 'Save Brand'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default BrandManagement;
