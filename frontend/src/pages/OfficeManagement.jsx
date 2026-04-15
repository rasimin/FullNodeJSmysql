import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, Plus, Edit, Trash2, FileSpreadsheet, LayoutGrid, MapPin, CornerDownRight, Image as ImageIcon, Upload, Phone } from 'lucide-react';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { IMAGE_BASE_URL } from '../config';

const OfficeManagement = () => {
  const [offices, setOffices] = useState([]); // Hierarchy grouped
  const [flatOffices, setFlatOffices] = useState([]); // Sorted list for table
  const [rawOffices, setRawOffices] = useState([]); // Raw flat data
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'BRANCH_OFFICE', address: '', parent_id: '', phone: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
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
      ? { name: office.name, type: office.type, address: office.address || '', parent_id: office.parent_id || '', phone: office.phone || '' }
      : { name: '', type: 'BRANCH_OFFICE', address: '', parent_id: '', phone: '' }
    );
    setLogoFile(null);
    setLogoPreview(office?.logo ? `${IMAGE_BASE_URL}${office.logo}` : null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsModalOpen(false);
    notify('loading', editingOffice ? 'Updating...' : 'Creating...');
    try {
      const fd = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          fd.append(key, formData[key]);
        }
      });
      if (logoFile) fd.append('logo', logoFile);

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };

      editingOffice 
        ? await api.put(`/offices/${editingOffice.id}`, fd, config) 
        : await api.post('/offices', fd, config);
      notify('success', 'Success!'); fetchOffices();
    } catch (err) { 
      console.error(err);
      notify('error', 'Error'); 
    }
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
                     <tr key={o.id} className={`${o.isParent ? 'bg-white dark:bg-gray-900/50' : 'bg-gray-50/20 dark:bg-gray-800/20'} hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors`}>
                        <td className="px-6 py-4">
                           <div className={`flex items-center gap-4 ${!o.isParent ? 'pl-10' : ''}`}>
                             {!o.isParent && <CornerDownRight size={14} className="text-blue-300" />}
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${o.isParent ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400'}`}>
                                {o.logo ? <img src={`${IMAGE_BASE_URL}${o.logo}`} className="w-full h-full object-cover" alt="" /> : <Building2 size={16} />}
                             </div>
                             <div>
                               <p className={`text-sm font-black ${o.isParent ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{o.name}</p>
                               <div className="flex items-center gap-2 mt-0.5">
                                 <p className="text-[9px] text-gray-400 font-bold uppercase">{o.type.replace('_', ' ')}</p>
                                 {o.phone && <p className="text-[9px] text-blue-500 font-black tracking-wider border-l border-gray-100 dark:border-white/10 pl-2">{o.phone}</p>}
                               </div>
                             </div>
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
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${o.isParent ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                        {o.logo ? <img src={`${IMAGE_BASE_URL}${o.logo}`} className="w-full h-full object-cover" alt="" /> : <Building2 size={16} />}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openModal(o)} className="text-gray-400"><Edit size={14} /></button>
                        <button onClick={() => setConfirmDeleteId(o.id)} className="text-gray-400"><Trash2 size={14} /></button>
                      </div>
                   </div>
                   <h4 className="text-[10px] font-black text-gray-800 dark:text-gray-100 uppercase leading-tight line-clamp-2">{o.name}</h4>
                   <div className="flex flex-wrap gap-1 items-center mt-1">
                      <span className="text-[7px] font-black text-gray-400 uppercase">{o.isParent ? 'ROOT' : 'BRANCH'}</span>
                      {o.phone && <span className="text-[7px] font-black text-blue-500 uppercase border-l pl-1 border-gray-100 dark:border-white/10">{o.phone}</span>}
                   </div>
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
                <div className="w-full lg:w-80 shrink-0 relative z-10 transition-transform active:scale-95">
                   <div className="card-interactive p-5 border-l-4 border-purple-600 bg-white dark:bg-gray-900 shadow-xl shadow-purple-900/5">
                      <div className="flex justify-between items-start mb-4 text-gray-400">
                        {ho.logo ? <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm bg-white dark:bg-gray-800"><img src={`${IMAGE_BASE_URL}${ho.logo}`} className="w-full h-full object-cover" /></div> : <Building2 size={24} className="text-purple-600" />}
                        <div className="flex gap-2"><Edit size={14} onClick={() => openModal(ho)} /><Trash2 size={14} onClick={() => setConfirmDeleteId(ho.id)} /></div>
                      </div>
                      <h3 className="text-base font-black text-gray-900 dark:text-white uppercase leading-tight">{ho.name}</h3>
                      <div className="flex flex-wrap gap-3 items-center mt-2">
                         <p className="text-[10px] text-purple-400 font-bold uppercase">Head Office</p>
                         {ho.phone && <p className="text-[10px] text-blue-500 font-black border-l border-gray-100 dark:border-white/10 pl-3">{ho.phone}</p>}
                      </div>
                      {ho.address && <p className="text-[9px] text-gray-500 mt-2 flex items-start gap-1"><MapPin size={10} className="shrink-0 mt-0.5" /> {ho.address}</p>}
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
                             <div className="flex justify-between items-start mb-3">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-white/5 rounded-xl overflow-hidden flex items-center justify-center text-blue-500">
                                  {br.logo ? <img src={`${IMAGE_BASE_URL}${br.logo}`} className="w-full h-full object-cover" /> : <Building2 size={14} />}
                                </div>
                                <div className="flex gap-1 text-gray-300 group-hover:text-gray-500 transition-colors"><Edit size={12} onClick={() => openModal(br)} /><Trash2 size={12} onClick={() => setConfirmDeleteId(br.id)} /></div>
                              </div>
                             <h4 className="text-[10px] font-black text-gray-800 dark:text-gray-100 uppercase line-clamp-2 leading-tight">{br.name}</h4>
                             <div className="mt-2 space-y-1">
                                {br.phone && <p className="text-[8px] text-blue-500 font-bold flex items-center gap-1"><Phone size={8} /> {br.phone}</p>}
                                <p className="text-[8px] text-gray-400 uppercase font-bold">{br.address || 'Branch Unit'}</p>
                             </div>
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

      {/* MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Office Registration">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Office Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Pusat Jakarta" />
          
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} options={[{ value: 'HEAD_OFFICE', label: 'Head Office' }, { value: 'BRANCH_OFFICE', label: 'Branch Office' }]} />
            <Input label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+62..." />
          </div>

          <Input label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Jl. Raya No. 123..." />

          {formData.type === 'BRANCH_OFFICE' && (
            <Select label="Parent" value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})} options={offices.map(o => ({ value: o.id, label: o.name }))} />
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Office Logo / Branding</label>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-100 dark:border-white/10 rounded-[20px] transition-all hover:bg-white dark:hover:bg-gray-800">
               <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                 {logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-gray-300" />}
               </div>
               <div className="flex-1">
                 <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase mb-1">Company Identity</p>
                 <p className="text-[8px] text-gray-400 font-bold uppercase mb-3">Resized & Compressed Automatically</p>
                 <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-transform">
                   <Upload size={14} /> Choose Logo
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setLogoFile(file);
                        setLogoPreview(URL.createObjectURL(file));
                      }
                   }} />
                 </label>
               </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20">Save Office Unit</button>
        </form>
      </Modal>
    </div>
  );
};

export default OfficeManagement;
