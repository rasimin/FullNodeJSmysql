import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, Plus, Edit, Trash2, FileSpreadsheet, LayoutGrid, MapPin, CornerDownRight } from 'lucide-react';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { motion, AnimatePresence } from 'framer-motion';

const OfficeManagement = () => {
  const [offices, setOffices] = useState([]); // Hierarchy grouped
  const [flatOffices, setFlatOffices] = useState([]); // Sorted list for table
  const [rawOffices, setRawOffices] = useState([]); // Raw flat data
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'BRANCH_OFFICE', address: '', parent_id: '' });
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'grid' : 'table');

  const notify = (status, message) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), 2000);
  };

  const fetchOffices = async () => {
    setLoading(true);
    try {
      const r = await api.get('/offices');
      const allData = r.data;
      setRawOffices(allData);

      // Build Sorted List for Table
      const roots = allData.filter(o => !o.parent_id);
      const sorted = [];
      roots.forEach(root => {
        sorted.push({ ...root, isParent: true });
        allData.filter(o => o.parent_id === root.id).forEach(c => sorted.push({ ...c, isParent: false }));
      });
      setFlatOffices(sorted);

      // Build Hierarchy for Grid
      const hierarchy = roots.map(root => ({
        ...root,
        branches: allData.filter(o => o.parent_id === root.id)
      }));
      setOffices(hierarchy);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchOffices(); }, []);

  const openModal = (office = null) => {
    setEditingOffice(office);
    setFormData(office
      ? { name: office.name, type: office.type, address: office.address || '', parent_id: office.parent_id || '' }
      : { name: '', type: 'BRANCH_OFFICE', address: '', parent_id: '' }
    );
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsModalOpen(false);
    notify('loading', editingOffice ? 'Updating...' : 'Creating...');
    try {
      const data = { ...formData };
      if (!data.parent_id) data.parent_id = null;
      editingOffice ? await api.put(`/offices/${editingOffice.id}`, data) : await api.post('/offices', data);
      notify('success', 'Success!'); fetchOffices();
    } catch { notify('error', 'Error'); }
  };

  const handleDelete = async () => {
    notify('loading', 'Deleting...');
    setConfirmDeleteId(null);
    try { await api.delete(`/offices/${confirmDeleteId}`); notify('success', 'Deleted'); fetchOffices(); }
    catch { notify('error', 'Failed'); }
  };

  return (
    <div className="space-y-6 pb-20">
      <DynamicIsland status={confirmDeleteId ? 'confirm' : notification.status} message={confirmDeleteId ? 'Delete office?' : notification.message} onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Office Management</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Master Organization Hierarchy</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl grow sm:grow-0">
             <button onClick={() => setViewMode('table')} className={`grow flex-1 p-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}><FileSpreadsheet size={14} /> List</button>
             <button onClick={() => setViewMode('grid')} className={`grow flex-1 p-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}><LayoutGrid size={14} /> Tree</button>
          </div>
          <button onClick={() => openModal()} className="btn-primary h-11 px-4 text-xs font-black shadow-lg shadow-blue-500/20"><Plus size={18} /></button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="space-y-4">
           {/* Desktop Table */}
           <div className="hidden md:block card overflow-hidden border-none shadow-xl">
             <table className="w-full text-left">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                   <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hierarchy & Office</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                   {flatOffices.map(o => (
                     <tr key={o.id} className={`${o.isParent ? 'bg-white' : 'bg-gray-50/20'} hover:bg-blue-50/30 transition-colors`}>
                        <td className="px-6 py-4">
                           <div className={`flex items-center gap-4 ${!o.isParent ? 'pl-10' : ''}`}>
                             {!o.isParent && <CornerDownRight size={14} className="text-blue-300" />}
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${o.isParent ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-500'}`}><Building2 size={16} /></div>
                             <div><p className={`text-sm font-black ${o.isParent ? 'text-gray-900' : 'text-gray-600'}`}>{o.name}</p><p className="text-[9px] text-gray-400 font-bold uppercase">{o.type.replace('_', ' ')}</p></div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2 text-gray-400">
                             <button onClick={() => openModal(o)} className="hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                             <button onClick={() => setConfirmDeleteId(o.id)} className="hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                           </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
           </div>
           {/* Mobile 2-Column List for Table View */}
           <div className="md:hidden grid grid-cols-2 gap-3">
              {flatOffices.map(o => (
                <div key={o.id} className={`card p-3 border-l-4 ${o.isParent ? 'border-purple-500' : 'border-blue-400'}`}>
                   <div className="flex justify-between items-start mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${o.isParent ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}><Building2 size={16} /></div>
                      <div className="flex gap-1">
                        <button onClick={() => openModal(o)} className="text-gray-400"><Edit size={14} /></button>
                        <button onClick={() => setConfirmDeleteId(o.id)} className="text-gray-400"><Trash2 size={14} /></button>
                      </div>
                   </div>
                   <h4 className="text-[10px] font-black text-gray-800 uppercase leading-tight line-clamp-2">{o.name}</h4>
                   <span className="text-[8px] font-black text-gray-400 uppercase mt-1 block">{o.isParent ? 'ROOT' : 'BRANCH'}</span>
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="space-y-12">
           {offices.map((ho) => (
            <div key={ho.id} className="relative">
              {/* Main Trunk Line */}
              <div className="absolute left-6 lg:left-[160px] top-28 bottom-0 w-px bg-gradient-to-b from-purple-500/30 to-transparent" />
              
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-20">
                {/* Parent - Full width on desktop, 1/2 on tablet? No, full is better for parent hierarchy */}
                <div className="w-full lg:w-80 shrink-0 relative z-10 transition-transform active:scale-95">
                   <div className="card-interactive p-5 border-l-4 border-purple-600 bg-white dark:bg-gray-900 shadow-xl shadow-purple-900/5">
                      <div className="flex justify-between items-start mb-4 text-gray-400"><Building2 size={24} className="text-purple-600" /><div className="flex gap-2"><Edit size={14} onClick={() => openModal(ho)} /><Trash2 size={14} onClick={() => setConfirmDeleteId(ho.id)} /></div></div>
                      <h3 className="text-base font-black text-gray-900 dark:text-white uppercase leading-tight">{ho.name}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Head Office Pusat</p>
                   </div>
                </div>

                {/* Branches - 2 Columns on ALL mobile sizes */}
                <div className="flex-1 pl-10 lg:pl-0 space-y-4">
                   <div className="flex items-center gap-3 relative">
                      <div className="absolute -left-10 lg:-left-20 top-1/2 w-10 lg:w-20 h-px bg-purple-200" />
                      <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Network Units</span>
                      <div className="h-px grow bg-gradient-to-r from-purple-100 to-transparent" />
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {ho.branches.map(br => (
                        <div key={br.id} className="group relative">
                           <div className="absolute -left-6 lg:-left-12 top-1/2 w-6 lg:w-12 h-px bg-gray-100 dark:bg-gray-800" />
                           <div className="card p-3 md:p-4 border-l-2 border-blue-400 hover:border-blue-600 transition-all shadow-sm">
                             <div className="flex justify-between items-start mb-3"><div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500"><Building2 size={14} /></div><div className="flex gap-1 text-gray-300 group-hover:text-gray-500 transition-colors"><Edit size={12} onClick={() => openModal(br)} /><Trash2 size={12} onClick={() => setConfirmDeleteId(br.id)} /></div></div>
                             <h4 className="text-[10px] font-black text-gray-800 dark:text-gray-100 uppercase line-clamp-2 leading-tight">{br.name}</h4>
                             <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold">{br.address || 'Branch Unit'}</p>
                           </div>
                        </div>
                      ))}
                      {ho.branches.length === 0 && <div className="col-span-full py-8 border-2 border-dashed border-gray-100 rounded-3xl text-center text-[10px] text-gray-300 font-black uppercase">Offline Unit</div>}
                   </div>
                </div>
              </div>
            </div>
           ))}
        </div>
      )}

      {/* MODAL remains the same */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Office Registration">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Office Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Pusat Jakarta" />
          <Select label="Type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} options={[{ value: 'HEAD_OFFICE', label: 'Head Office' }, { value: 'BRANCH_OFFICE', label: 'Branch Office' }]} />
          {formData.type === 'BRANCH_OFFICE' && (
            <Select label="Parent" value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})} options={offices.map(o => ({ value: o.id, label: o.name }))} />
          )}
          <button type="submit" className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20">Save Office Unit</button>
        </form>
      </Modal>
    </div>
  );
};

export default OfficeManagement;
